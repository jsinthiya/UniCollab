const { studentVerifySchema, studentTokenVerifySchema, eventSchema, speakerSchema } = require('../util/validation_schema');
const createError = require('http-errors');
const { sendMail } = require('../services/email')
const { } = require('../Models/University.model');
const { StudentModel } = require("../Models/Student.model");
const db = require('../services/db');
const { signAccessToken } = require('../util/jwt');
const jwt = require('jsonwebtoken');
const EventModel = require('../Models/Event.model');
const { re } = require('mathjs');
const crypto = require('crypto');

module.exports = {
    create: async (req,res,next) => {
        try {
            req.body.organizers = JSON.parse(req.body.organizers);
            req.body.speakers = JSON.parse(req.body.speakers);
            req.body.organizers.push(req.user.userID);
            req.files[0]?req.body.poster = '/uploads/events/'+req.files[0].filename: delete req.body.poster;
            const eventID = crypto.randomUUID();
            req.body.eventID = eventID;
            const validate = await eventSchema.validateAsync(req.body);
            console.log(validate)
            const event = new EventModel(validate.eventID, validate.title, validate.description, validate.poster, req.body.time, validate.venue, validate.type, validate.privacy, validate.organizers, validate.speakers);
            const result = await event.create();
            res.send(result)
        } catch (error) {
            next(error)
        }
    },
    getEventWithOrganizersAndSpeakers: async (req, res, next) => {
         try {
              const events = await EventModel.getEventWithOrganizersAndSpeakers(req.params.id)
              res.send(events);
         } catch (error) {
              next(error)
         }
    },
    getEvents: async (req, res, next) => {
        try {
             const events = await EventModel.getEvents(req.query.search,req.query.page, req.query.limit);
             res.send(events);
        } catch (error) {
             next(error)
        }
   },
   getAllSpeakers: async (req, res, next) => {
        try {
             const speakers = await EventModel.getSpeakers();
             res.send(speakers);
        } catch (error) {
             next(error)
        }
   },
   createSpeaker: async (req, res, next) => {
            try {
               const doesExist = await EventModel.checkSpeaker(req.body.email);
               if(doesExist.length > 0)
               {
                   throw createError.Conflict(`${req.body.email} is already registered as a speaker`);
               }
                req.body.speakerID = crypto.randomUUID();
                req.files[0]?req.body.picture = '/uploads/events/'+req.files[0].filename: delete req.body.picture;
                const validate = await speakerSchema.validateAsync(req.body);

                const result = await EventModel.createSpeaker(req.body);
                res.send(result);
            } catch (error) {
                next(error)
            }
     }
}