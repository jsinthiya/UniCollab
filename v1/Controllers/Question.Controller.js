const {questionSchema,answerSchema,answerUpdateSchema,feedbackSchema,feedbackUpdateSchema} = require('../util/validation_schema');
const db = require('../services/db');
const {QuestionModel} = require('../Models/Question.model');
const {AnswerModel} = require('../Models/Answer.model');
const {FeedbackModel} = require('../Models/Feedback.model');
const EventEmmiter = require('../util/event');
const createError = require('http-errors');
function generateQuestionId() {
    return Math.floor(Math.random() * 1000000);
}
module.exports = {
    create: async (req,res,next) => {
        try {
            console.log(req.files[0]);
            const validate = await questionSchema.validateAsync(req.body);
            imgPath =  req.files[0]?`/uploads/questions/${req.files[0].filename}`:undefined;
            const question = new QuestionModel(generateQuestionId(),req.user.userID,validate.quesText,imgPath); 
            const result = await question.create(); 
            EventEmmiter.emit('question', question);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    update: async (req,res,next) => {
        try {
            const validate = await questionSchema.validateAsync(req.body);
            const result = await QuestionModel.update(validate,req.query.quesID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    delete: async (req,res,next) => {
        try {
            const doesExist = await QuestionModel.get(req.query.quesID);
            if(!doesExist) throw next(createError.NotFound('Question does not exist'))
            const result = await QuestionModel.delete(req.query.quesID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    get: async (req,res,next) => {
        try {
            const result = await QuestionModel.get(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getWithAns: async (req,res,next) => {
        try {
            const result = await QuestionModel.getWithAns(req.params.id);
            if(!result) throw next(createError.NotFound('Question not found'))
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getUsersQuestions: async (req,res,next) => {
        try {
            const result = await QuestionModel.getWithFilter({userID:req.params.id})
            if(!result) throw next(createError.NotFound('Questions not found for this user'))
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getOwnQuestions: async (req,res,next) => {
        try {
            const result = await QuestionModel.getWithFilter({userID:req.user.userID})
            if(!result) throw next(createError.NotFound('Questions not found for this user'))
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getAll: async (req,res,next) => {
        try {
            req.query.page = (req.query.page && parseInt(req.query.page)) || 1;
           req.query.limit = (req.query.limit && parseInt(req.query.limit)) || 10;
            const result = await QuestionModel.getMultiple(req.query.page,req.query.limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getAllQuestionsWithAns: async (req,res,next) => {
        try {
            req.query.page = (req.query.page && parseInt(req.query.page)) || 1;
           req.query.limit = (req.query.limit && parseInt(req.query.limit)) || 100;
            const result = await QuestionModel.getQuestionsWithAnswers(req.query.page,req.query.limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    createAnswer: async (req,res,next) => {
        try {
            const validate = await answerSchema.validateAsync(req.body);
            const ans = new AnswerModel(generateQuestionId(),validate.quesID,req.user.userID,validate.ansText,validate.imgPath);
            const result = await ans.create();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    updateAnswer: async (req,res,next) => {
        try {
            const validate = await answerUpdateSchema.validateAsync(req.body);
            if(!req.query.ansID) throw next(createError.BadRequest('ansID is required'))
            const doesExist = await AnswerModel.get(req.query.ansID);
            if(!doesExist) throw next(createError.NotFound('Answer does not exist'))
            const result = await AnswerModel.update(validate,req.query.ansID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    deleteAnswer: async (req,res,next) => {
        try {
            if(!req.body.ansID) throw next(createError.BadRequest('ansID is required'))
            const doesExist = await AnswerModel.get(req.body.ansID);
            if(!doesExist) throw next(createError.NotFound('Answer does not exist'))
            const result = await AnswerModel.delete(req.body.ansID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getAnswers: async (req,res,next) => {
        try {
            const result = await AnswerModel.getQuestionAnswers(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    createFeedback: async (req,res,next) => {
        try {
            const validate = await feedbackSchema.validateAsync(req.body);
            const doesExist = await AnswerModel.get(validate.ansID);
            if(!doesExist) throw next(createError.NotFound('Answer does not exist'))
            const feedback = new FeedbackModel(generateQuestionId(),validate.ansID,req.user.userID,validate.comment);
            const result = await feedback.create();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    updateFeedback: async (req,res,next) => {
        try {
            const validate = await feedbackUpdateSchema.validateAsync(req.body);
            if(!req.query.feedbackID) throw next(createError.BadRequest('feedbackID is required'))
            const result = await FeedbackModel.update(validate,req.query.feedbackID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    rateFeedback: async (req,res,next) => {
        try {
            if(!req.body.feedbackID) throw next(createError.BadRequest('feedbackID is required'))
            if(!req.body.rating) throw next(createError.BadRequest('rating is required'))
            if(req.body.rating!="Positive" && req.body.rating!="Negative") throw next(createError.BadRequest('rating can only be Positive or Negative'))
            const doesExist = await FeedbackModel.get(req.body.feedbackID);
            if(!doesExist) throw next(createError.NotFound('Feedback does not exist'))
            const result = await FeedbackModel.update({rating:req.body.rating},req.body.feedbackID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    deleteFeedback: async (req,res,next) => {
        try {
            if(!req.body.feedbackID) throw next(createError.BadRequest('feedbackID is required'))
            const doesExist = await FeedbackModel.get(req.body.feedbackID);
            if(!doesExist) throw next(createError.NotFound('Feedback does not exist'))
            const result = await FeedbackModel.delete(req.body.feedbackID);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
}