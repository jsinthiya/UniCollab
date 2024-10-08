const express = require('express');
const { questionAccess,studentAndAdminAccess,onlyStudentAccess } = require('../Middleware/Permission.middleware');
const { verifyAccessToken } = require('../util/jwt');
const QuestionController = require('../Controllers/Question.Controller');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const { spamProtection,ownQuestionAccess } = require('../Middleware/Question.middleware');
const EventEmmiter = require('../util/event');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.resolve(__dirname, '../../public/uploads/questions'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

router.post('/create',verifyAccessToken,questionAccess,spamProtection,upload.any(),QuestionController.create);
router.put('/update',verifyAccessToken,questionAccess,ownQuestionAccess,QuestionController.update);
router.delete('/delete',verifyAccessToken,studentAndAdminAccess,ownQuestionAccess,QuestionController.delete);
router.get('/get',verifyAccessToken,QuestionController.getAll);
router.get('/getwithans',verifyAccessToken,QuestionController.getAllQuestionsWithAns);

router.get('/get/:id',verifyAccessToken,QuestionController.get);
router.get('/getwithans/:id',verifyAccessToken,QuestionController.getWithAns);
router.get('/own',verifyAccessToken,onlyStudentAccess,QuestionController.getOwnQuestions);
router.get('/get/user/:id',verifyAccessToken,QuestionController.getUsersQuestions);

router.get('/answer/get/:id',verifyAccessToken,QuestionController.getAnswers);
router.post('/answer/create',verifyAccessToken,questionAccess,QuestionController.createAnswer);
router.put('/answer/update',verifyAccessToken,questionAccess,QuestionController.updateAnswer);
router.delete('/answer/delete',verifyAccessToken,studentAndAdminAccess,QuestionController.deleteAnswer);

router.post('/feedback/create',verifyAccessToken,questionAccess,QuestionController.createFeedback);
router.put('/feedback/update',verifyAccessToken,questionAccess,QuestionController.updateFeedback);
router.post('/feedback/rate',verifyAccessToken,questionAccess,QuestionController.rateFeedback);
router.delete('/feedback/delete',verifyAccessToken,studentAndAdminAccess,QuestionController.deleteFeedback);

router.post("/test",async(req,res)=>{
    EventEmmiter.emit('question', req.body);
    res.send("Question Route Works"); 

});

module.exports = router;