const db = require('../services/db');
module.exports = {
    spamProtection : async (req, res, next) => {
        try {
            const result = await db.query(`SELECT COUNT(quesID) AS numQuestions FROM questions WHERE userID = '${req.user.userID}' AND timestamp > NOW() - INTERVAL 10 MINUTE;`)
            const numQuestions = result[0].numQuestions;
            if(numQuestions > 2) {
                return res.status(429).json({success: false, message: "You are allowed to ask only 3 questions in 10 minutes. Please try again later."});
            }
            next();
        } catch (err) {
            next(err);
        }
    },
    ownQuestionAccess: async (req, res, next) => {
        try {
            if(req.user.role === 'admin') return next();
            const result = await db.query(`SELECT * FROM questions WHERE quesID = '${req.query.quesID}' AND userID = '${req.user.userID}';`);
            console.log(result);
            if(result.length === 0) {
                return res.status(403).json({success: false, message: "You are not authorized to perform this action."});
            }
            next();
        } catch (err) {
            next(err);
        }
    }
}