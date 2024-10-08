const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { query } = require('../services/db');
const crypto = require('crypto');
const EventController = require('../Controllers/Event.Controller');
const { verifyAccessToken } = require('../util/jwt');
const { jobSchema } = require('../util/validation_schema');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.resolve(__dirname, '../../public/uploads/events'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

//cors middleware


router.post('/create', verifyAccessToken,async (req, res, next) => {
    try {
      // const job =  await jobSchema.validateAsync(req.body);
    const {jobTitle
        ,orgID
        ,jobLocation
        ,description
        ,responsibilities
        ,qualifications
        ,experience
        ,jobType
        ,salary
        ,lastApplyDate
        ,jobPostTime
        ,experienceCategory
        ,educationLevelID
     } = req.body;
     await query(`
     INSERT INTO jobs (
         jobTitle, 
         orgID, 
         jobLocation, 
         description, 
         responsibilities, 
         qualifications, 
         experience, 
         jobType, 
         salary, 
         lastApplyDate, 
         experienceCategory, 
         educationLevelID
     ) VALUES (
         '${jobTitle}', 
         '${orgID}', 
         '${jobLocation}', 
         '${description}', 
         '${responsibilities}', 
         '${qualifications}', 
         '${experience}', 
         '${jobType}', 
         '${salary}', 
         '${lastApplyDate}',  
         '${experienceCategory}', 
         '${educationLevelID}'
     )
 `);
 
    res.status(200).json({ message: 'Event created successfully' });
  } catch (error) {
    next(error);
  }
}
);
router.get('/get/:id', EventController.getEventWithOrganizersAndSpeakers);
router.get('/get', EventController.getEvents);

router.post('/speaker/create', upload.any(), EventController.createSpeaker);
router.get('/allspeakers', EventController.getAllSpeakers);

module.exports = router;