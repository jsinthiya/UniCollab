const { proposalSchema } = require("../util/validation_schema");
const db = require("../services/db");
const crypto = require("crypto");
function generateId() {
    return Math.floor(Math.random() * 1000000);
}
module.exports = {
    propose: async (req,res,next) => {
        try {
            delete req.body.files;
            req.files[0]?req.body.documentURL = `/uploads/research/${req.files[0].filename}`:req.body.documentURL = "";
            const validate = await proposalSchema.validateAsync(req.body);
            await db.query(`INSERT INTO research_proposals (proposalID,stuID,title,description,documentURL,submittedAt) VALUES ('${crypto.randomUUID()}','${req.user.userID}','${validate.title}','${validate.description}','${validate.documentURL}',NOW());`);
            res.json({
                message: "Proposal Submitted Successfully",
            });
        } catch (error) {
            next(error);
        }
    },
    getResearches: async (req,res,next) => {
        try {
            const result = await db.query(`SELECT 
            research.researchID,
            research.title,
            research.shortDescription AS description,
            research.owner,
            research.status,
            research.createdAt
        FROM research
        UNION ALL
        SELECT 
            research_proposals.proposalID AS researchID,
            research_proposals.title,
            research_proposals.description,
            research_proposals.stuID AS owner,
            "Proposed" AS status,
            research_proposals.submittedAt AS createdAt
        FROM research_proposals`);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getResearch: async (req,res,next) => {
        try {
            const result = await db.query(`SELECT res.*, users.name,users.username,users.email,users.role,users.avatar FROM (SELECT 
                research.researchID,
                research.title,
                research.shortDescription AS description,
                research.owner,
                research.status,
                research.createdAt,
                 (SELECT COUNT(research_colab.userID) FROM research_colab WHERE research_colab.researchID = '${req.params.id}') AS noOfContributrs
            FROM research
            WHERE researchID = '${req.params.id}'
            UNION ALL
            SELECT 
                research_proposals.proposalID AS researchID,
                research_proposals.title,
                research_proposals.description,
                research_proposals.stuID AS owner,
                "Proposed" AS status,
                research_proposals.submittedAt AS createdAt,
                0 AS noOfContributrs
            FROM research_proposals
            WHERE proposalID = '${req.params.id}') AS res
           JOIN users ON users.userID = res.owner
       `);


            res.json({
                researchID: result[0].researchID,
                title: result[0].title,
                description: result[0].description,
                owner: {
                    userID: result[0].owner,
                    name: result[0].name,
                    username: result[0].username,
                    email: result[0].email,
                    role: result[0].role,
                    avatar: result[0].avatar
                },
                status: result[0].status,
                createdAt: result[0].createdAt,
                noOfContributors: result[0].noOfContributrs

            });
        } catch (error) {
            next(error);
        }
    },
    getProposal: async (req,res,next) => {
        try {
            const result = await db.query(`SELECT * FROM research_proposals WHERE proposalID = '${req.params.id}'`);
            res.json(result[0]);
        } catch (error) {
            next(error);
        }
    }
}
