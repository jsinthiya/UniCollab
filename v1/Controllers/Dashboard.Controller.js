const db = require("../services/db");
const crypto = require("crypto");
const helper = require("../util/helper");
function generateId() {
    return Math.floor(Math.random() * 1000000);
}
module.exports = {
   fetch: async (req,res,next) => {
        try {
            const limit = 10
            const page = parseInt(req.query.page) || 1;
            const offset = helper.getOffset(page, limit);
            const data = await db.query(`
            SELECT * FROM (
                (SELECT 
                    'project' AS type,
                    p.projectID AS ID,
                    p.projectID AS titleID,
                    p.title AS title,
                    u.name AS subtitle,
                    u.username AS subtitleID,
                    p.logo AS avatar,
                    GROUP_CONCAT(DISTINCT t.tagName SEPARATOR ', ') AS tags,
                    p.description AS body,
                    COUNT(DISTINCT pr.reviewID) AS badge1,
                    AVG(pr.rating) AS badge2,
                    COUNT(DISTINCT pu.upvoteID) AS badge3,
                    COUNT(DISTINCT pc.contributorID) AS badge4,
                    COUNT(DISTINCT pc.contributionID) AS badge5,
                    p.status AS badge6
                FROM 
                    projects p
                JOIN 
                    users u ON p.owner = u.userID
                LEFT JOIN 
                    projects_tags pt ON p.projectID = pt.projectID
                LEFT JOIN 
                    tags t ON pt.tagID = t.tagID
                LEFT JOIN 
                    projects_reviews pr ON p.projectID = pr.projectID
                LEFT JOIN 
                    project_upvotes pu ON p.projectID = pu.projectID
                LEFT JOIN 
                    project_contributors pc ON p.projectID = pc.projectID
                WHERE 
                    p.privacy = 'Public'
                GROUP BY 
                    p.projectID
                ORDER BY 
                    p.createdAt DESC
                LIMIT ${limit + 1} OFFSET ${offset})
                
                UNION ALL
                
                (SELECT 
                    'job' AS type,
                    jobs.jobID AS ID,
                    jobs.jobID AS titleID,
                    jobs.jobTitle AS title,
                    org.name AS subtitle,
                    user.username AS subtitleID,
                    IFNULL(user.avatar, '') AS avatar,
                    GROUP_CONCAT(tags.tagName) AS tags,
                    jobs.description AS body,
                    jobs.jobType AS badge1,
                    jobs.jobLocation AS badge2,
                    jobs.salary AS badge3,
                    jobs.lastApplyDate AS badge4,
                    NULL AS badge5,
                    NULL AS badge6
                FROM 
                    jobs
                JOIN 
                    organization AS org ON jobs.orgID = org.orgID
                JOIN 
                    users AS user ON org.orgID = user.userID
                LEFT JOIN 
                    jobs_tags ON jobs.jobID = jobs_tags.jobID
                LEFT JOIN 
                    tags ON jobs_tags.tagID = tags.tagID
                GROUP BY 
                    jobs.jobID
                ORDER BY 
                    jobs.jobPostTime DESC
                LIMIT ${limit + 1} OFFSET ${offset})
                
                UNION ALL
                
                (SELECT 
                    'researchProposal' AS type,
                    research_proposals.proposalID AS ID,
                    (SELECT users.username FROM users WHERE users.userID = students.stuID) AS titleID,
                    (SELECT users.name FROM users WHERE users.userID = students.stuID) AS title,
                    university.name AS subtitle,
                    user.username AS subtitleID,
                    IFNULL((SELECT users.avatar FROM users WHERE users.userID = students.stuID), '') AS avatar,
                    GROUP_CONCAT(tags.tagName) AS tags,
                    research_proposals.title AS body,
                    NULL AS badge1,
                    NULL AS badge2,
                    NULL AS badge3,
                    NULL AS badge4,
                    NULL AS badge5,
                    NULL AS badge6
                FROM 
                    research_proposals
                JOIN 
                    students ON research_proposals.stuID = students.stuID
                JOIN 
                    university ON students.uniID = university.uniID
                JOIN 
                    users AS user ON university.uniID = user.userID
                LEFT JOIN 
                    research_tags ON research_proposals.proposalID = research_tags.proposalID
                LEFT JOIN 
                    tags ON research_tags.tagID = tags.tagID
                GROUP BY 
                    research_proposals.proposalID
                ORDER BY 
                    research_proposals.submittedAt DESC
                LIMIT ${limit + 1} OFFSET ${offset})
            ) AS feed
            ORDER BY RAND();
            
        `);
            if(data.length === 0){
                return res.status(404).json({message: 'No data found'});
            }
            const obj = {
                projects: [],
                jobs: [],
                researchProposals: []
            };
            
            data.forEach(item => {
                if (item.type === 'project') {
                    obj.projects.push({
                        projectID: item.ID,
                        title: item.title,
                        ownerName: item.subtitle,
                        ownerUsername: item.subtitleID,
                        projectLogo: item.avatar,
                        tags: item.tags?item.tags.split(',').map(tag => tag.trim()):[],
                        description: item.body,
                        reviews: parseInt(item.badge1),
                        rating: parseFloat(item.badge2),
                        upvotes: parseInt(item.badge3),
                        contributors: parseInt(item.badge4),
                        contributions: parseInt(item.badge5),
                        status: item.badge6
                    });
                } else if (item.type === 'job') {
                    obj.jobs.push({
                        jobID: item.ID,
                        title: item.title,
                        orgName: item.subtitle,
                        orgUsername: item.subtitleID,
                        orgLogo: item.avatar,
                        tags: item.tags?.split(',').map(tag => tag.trim()),
                        description: item.body,
                        jobType: item.badge1,
                        jobLocation: item.badge2,
                        salary: parseInt(item.badge3),
                        lastApplyDate: item.badge4,
                        daysLeft: Math.ceil((new Date(item.badge4) - new Date()) / (1000 * 60 * 60 * 24))
                    });
                } else if (item.type === 'researchProposal') {
                    obj.researchProposals.push({
                        proposalID: item.ID,
                        studentUsername: item.titleID,
                        studentName: item.title,
                        universityName: item.subtitle,
                        universityUsername: item.subtitleID,
                        studentAvatar: item.avatar,
                        tags: item.tags?.split(',').map(tag => tag.trim()),
                        title: item.body
                    });
                }
            });

            const projects = helper.emptyOrRows(obj.projects.slice(0, limit));
            const jobs = helper.emptyOrRows(obj.jobs.slice(0, limit));
            const researchProposals = helper.emptyOrRows(obj.researchProposals.slice(0, limit));
            const hasNextProjects = obj.projects?.length > limit;
            const hasNextJobs = obj.jobs?.length > limit;
            const hasNextResearchProposals = obj.researchProposals?.length > limit;
            return res.json({
                projects: {
                    data: projects,
                    page: page,
                    hasNext: hasNextProjects
                },
                jobs: {
                    data: jobs,
                    page: page,
                    hasNext: hasNextJobs
                },
                researchProposals: {
                    data: researchProposals,
                    page: page,
                    hasNext: hasNextResearchProposals
                }
            });

        } catch (error) {
            next(error);
        }
    },
    search: async (req,res,next) => {
        const key = req.query.key;
        const students = await db.query(`
        SELECT 
               u.userID AS studentUserID,
               u.username AS studentUsername,
               u.name AS studentName,
               u.avatar AS studentAvatar,
               un.uniID,
               un.name AS universityName,
               un.email AS universityEmail
           FROM 
               users u
           JOIN 
               students s ON s.stuID = u.userID
           JOIN 
               university un ON un.uniID = s.uniID
               
             WHERE u.username LIKE "%${key}%" OR u.name LIKE "%${key}%"`);
        const organizations = await db.query(`
        SELECT 
               u.userID AS orgUserID,
               u.username AS orgUsername,
               u.name AS orgName,
               u.avatar AS orgAvatar,
               o.orgID,
               o.name AS orgName,
               o.email AS orgEmail
           FROM 
               users u
           JOIN 
               organization o ON o.orgID = u.userID
             WHERE u.username LIKE "%${key}%" OR u.name LIKE "%${key}%"`);
        const projects = await db.query(`
        SELECT
            p.projectID,
            p.title,
            p.logo,
            p.description,
            u.userID AS ownerID,
            u.username AS ownerUsername,
            u.name AS ownerName
        FROM

            projects p
        JOIN
            users u ON p.owner = u.userID
        WHERE
            p.title LIKE "%${key}%" OR p.description LIKE "%${key}%"`);
        const jobs = await db.query(`
        SELECT
            j.jobID,
            j.jobTitle,
            j.jobType,
            j.jobLocation,
            j.salary,
            j.jobPostTime,
            u.userID AS orgID,
            u.username AS orgUsername,
            u.name AS orgName
        FROM

            jobs j
        JOIN
            organization o ON j.orgID = o.orgID
        JOIN
            users u ON o.orgID = u.userID
        WHERE
            j.jobTitle LIKE "%${key}%" OR j.jobLocation LIKE "%${key}%"`);
        const researchProposals = await db.query(`
        SELECT
            rp.proposalID,
            rp.title,
            u.userID AS studentID,
            u.username AS studentUsername,
            u.name AS studentName,
            un.uniID,
            un.name AS universityName
        FROM
            
                research_proposals rp
        JOIN
            students s ON rp.stuID = s.stuID
        JOIN

            users u ON s.stuID = u.userID
        JOIN
            university un ON s.uniID = un.uniID
        WHERE
            rp.title LIKE "%${key}%"`);
        return res.json({
            students: helper.emptyOrRows(students),
            organizations: helper.emptyOrRows(organizations),
            projects: helper.emptyOrRows(projects),
            jobs: helper.emptyOrRows(jobs),
            researchProposals: helper.emptyOrRows(researchProposals)
        });
    }
}
