const { or } = require('mathjs');
const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
class EventModel{
    constructor(eventID, title, description, poster,time,venue,type,privacy, organizers, speakers) {
        this.eventID = eventID;
        this.title = title;
        this.description = description;
        this.poster = poster;
        this.time = time;
        this.venue = venue;
        this.type = type;
        this.privacy = privacy
        this.organizers = organizers;
        this.speakers = speakers;
    }
    async create() {
        try {
            if(!this.poster)
            {
                this.poster = '';
            }
            const sql = `INSERT INTO events (eventID, title, description, poster, time, venue, type, privacy) VALUES ('${this.eventID}', '${this.title}', '${this.description}', '${this.poster}', '${this.time}', '${this.venue}', '${this.type}', '${this.privacy}')`;
            const result = await db.query(sql);
            if (this.organizers.length) {
                const organizerValues = this.organizers.map(organizer => [this.eventID, organizer]);

            const outputData = organizerValues.map(arr => `(${arr.map(val => typeof val === 'string' ? `'${val}'` : val).join(', ')})`);

                const organizerQuery = `INSERT INTO event_organizer (eventID, organizerID) VALUES ${outputData.join(', ')}`;
                await db.query(organizerQuery);
            }
            if (this.speakers.length) {
                const speakerValues = this.speakers.map(speaker => [this.eventID, speaker]);
                const outputData = speakerValues.map(arr => `(${arr.map(val => typeof val === 'string' ? `'${val}'` : val).join(', ')})`);
                const speakerQuery = `INSERT INTO event_speaker (eventID, speakerID) VALUES ${outputData.join(', ')}`;
                await db.query(speakerQuery);
            }
            return result;
        } catch (error) {
            throw createError(error);
        }
    }

    static async createSpeaker(speaker) {
        try {
            if(!speaker.picture)
            {
                speaker.picture = '';
            }
            const sql = `INSERT INTO speakers (speakerID, name, picture, designation, email) VALUES ('${speaker.speakerID}', '${speaker.name}', '${speaker.picture}', '${speaker.designation}', '${speaker.email}')`;
            const result = await db.query(sql);
            if(result.affectedRows === 0)
            {
                throw createError(500, 'Failed to create speaker');
            }
            else{
                return speaker;
            }
            return result;
        } catch (error) {
            throw createError(error);
        }
    }

    static async checkSpeaker(email) {
        const sql = `SELECT * FROM speakers WHERE email = ?`;
        const rows = await db.query(sql, [email]);
        return helper.emptyOrRows(rows);
    }

    static async getEventWithOrganizersAndSpeakers(eventID) {
        const query = `SELECT 
            events.*,
            event_organizer.organizerID,
            users.name AS organizerName,
            users.username AS organizerUsername,
            users.email AS organizerEmail,
            users.role AS organizerRole,
            users.avatar AS organizerAvatar,
            speakers.speakerID,
            speakers.name AS speakerName,
            speakers.picture AS speakerPic,
            speakers.designation AS speakerDesignation,
            speakers.email AS speakerEmail
        FROM events
        JOIN event_organizer ON event_organizer.eventID = events.eventID
        JOIN users ON event_organizer.organizerID = users.userID
        JOIN event_speaker ON event_speaker.eventID = events.eventID
        JOIN speakers ON speakers.speakerID = event_speaker.speakerID
        WHERE events.eventID = ?`;
    
        const rows = await db.query(query, [eventID]);
        const data = helper.emptyOrRows(rows);
    
        if (!data.length) return null;
    
        // Initialize empty arrays for organizers and speakers
        const organizersMap = new Map();
        const speakersMap = new Map();
    
        // Loop through the data and store unique organizers and speakers in maps
        data.forEach(row => {
            organizersMap.set(row.organizerID, {
                organizerID: row.organizerID,
                organizerName: row.organizerName,
                organizerUsername: row.organizerUsername,
                organizerEmail: row.organizerEmail,
                organizerRole: row.organizerRole,
                organizerAvatar: row.organizerAvatar
            });
            speakersMap.set(row.speakerID, {
                speakerID: row.speakerID,
                speakerName: row.speakerName,
                speakerPic: row.speakerPic,
                speakerDesignation: row.speakerDesignation,
                speakerEmail: row.speakerEmail
            });
        });
    
        // Convert maps to arrays
        const organizers = [...organizersMap.values()];
        const speakers = [...speakersMap.values()];
    
        // Construct event details object
        const eventDetails = {
            eventID: data[0].eventID,
            title: data[0].title,
            description: data[0].description,
            poster: data[0].poster,
            time: data[0].time, // Include time field
            venue: data[0].venue, // Include venue field
            organizers: organizers,
            speakers: speakers
        };
    
        return eventDetails;
    }
    
    static async getEvents(search = "",page = 1, listPerPage = 10) {
        const offset = helper.getOffset(page, listPerPage);
        const sql = `SELECT 
        events.eventID,
        events.title,
        events.description,
        events.poster,
        events.time,
        events.venue,
        events.type,
        events.privacy,
        users.userID AS organizerID,
        users.name AS organizerName,
        users.username AS organizerUsername,
        users.email AS organizerEmail,
        users.role AS organizerRole,
        users.avatar AS organizerAvatar,
        speakers.speakerID,
        speakers.name AS speakerName,
        speakers.picture AS speakerPic,
        speakers.designation AS speakerDesignation,
        speakers.email AS speakerEmail
    FROM events
    LEFT JOIN event_organizer ON events.eventID = event_organizer.eventID
    LEFT JOIN users ON event_organizer.organizerID = users.userID
    LEFT JOIN event_speaker ON events.eventID = event_speaker.eventID
    LEFT JOIN speakers ON event_speaker.speakerID = speakers.speakerID
    WHERE events.title LIKE '%${search}%' OR events.description LIKE '%${search}%' OR events.venue LIKE '%${search}%'`
    console.log(sql);
        const rows = await db.query(sql);
    
        const data = helper.emptyOrRows(rows);

        console.log(data);
    
        const eventsMap = new Map();
    
        data.forEach(event => {
            if (!eventsMap.has(event.eventID)) {
                eventsMap.set(event.eventID, {
                    eventID: event.eventID,
                    title: event.title,
                    description: event.description,
                    poster: event.poster,
                    time: event.time,
                    venue: event.venue,
                    type: event.type,
                    privacy: event.privacy,
                    organizers: [],
                    speakers: []
                });
            }
    
            const eventData = eventsMap.get(event.eventID);
    
            if (event.organizerID && !eventData.organizers.some(organizer => organizer.organizerID === event.organizerID)) {
                eventData.organizers.push({
                    id: event.organizerID,
                    name: event.organizerName,
                    username: event.organizerUsername,
                    email: event.organizerEmail,
                    role: event.organizerRole,
                    avatar: event.organizerAvatar
                });
            }
    
            if (event.speakerID && !eventData.speakers.some(speaker => speaker.speakerID === event.speakerID)) {
                eventData.speakers.push({
                    id: event.speakerID,
                    name: event.speakerName,
                    avatar: event.speakerPic,
                    designation: event.speakerDesignation,
                    email: event.speakerEmail
                });
            }
        });
    
        const organizedData = Array.from(eventsMap.values());
        const hasNextPage = organizedData.length > listPerPage;
        const meta = { page, hasNextPage };
    
        return {
            data: organizedData,
            meta: meta
        };
    }

    static async eventSearch(search, page = 1, listPerPage = 10) {
        const offset = helper.getOffset(page, listPerPage);
        const rows = await db.query(
            `SELECT 
                events.eventID,
                events.title,
                events.description,
                events.poster,
                events.time,
                events.venue,
                events.type,
                events.privacy,
                users.userID AS organizerID,
                users.name AS organizerName,
                users.username AS organizerUsername,
                users.email AS organizerEmail,
                users.role AS organizerRole,
                users.avatar AS organizerAvatar,
                speakers.speakerID,
                speakers.name AS speakerName,
                speakers.picture AS speakerPic,
                speakers.designation AS speakerDesignation,
                speakers.email AS speakerEmail
            FROM events
            LEFT JOIN event_organizer ON events.eventID = event_organizer.eventID
            LEFT JOIN users ON event_organizer.organizerID = users.userID
            LEFT JOIN event_speaker ON events.eventID = event_speaker.eventID
            LEFT JOIN speakers ON event_speaker.speakerID = speakers.speakerID
            WHERE events.title LIKE '%${search}%' OR events.description LIKE '%${search}%' OR events.venue LIKE '%${search}%'`
        );
    
        const data = helper.emptyOrRows(rows);

        console.log(data);
    
        const eventsMap = new Map();
    
        data.forEach(event => {
            if (!eventsMap.has(event.eventID)) {
                eventsMap.set(event.eventID, {
                    eventID: event.eventID,
                    title: event.title,
                    description: event.description,
                    poster: event.poster,
                    time: event.time,
                    venue: event.venue,
                    type: event.type,
                    privacy: event.privacy,
                    organizers: [],
                    speakers: []
                });
            }
    
            const eventData = eventsMap.get(event.eventID);
    
            if (event.organizerID && !eventData.organizers.some(organizer => organizer.organizerID === event.organizerID)) {
                eventData.organizers.push({
                    id: event.organizerID,
                    name: event.organizerName,
                    username: event.organizerUsername,
                    email: event.organizerEmail,
                    role: event.organizerRole,
                    avatar: event.organizerAvatar
                });
            }
    
            if (event.speakerID && !eventData.speakers.some(speaker => speaker.speakerID === event.speakerID)) {
                eventData.speakers.push({
                    id: event.speakerID,
                    name: event.speakerName,
                    avatar: event.speakerPic,
                    designation: event.speakerDesignation,
                    email: event.speakerEmail
                });
            }
        });
    
        const organizedData = Array.from(eventsMap.values());
        const hasNextPage = organizedData.length > listPerPage;
        const meta = { page, hasNextPage };
    
        return {
            data: organizedData,
            meta: meta
        };
    }

    static async getSpeakers () {
        const rows = await db.query(
            `SELECT * FROM speakers`
        );
        return helper.emptyOrRows(rows);
    }
        
    
    
}
module.exports = EventModel;