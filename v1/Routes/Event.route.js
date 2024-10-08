const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { query } = require('../services/db');
const crypto = require('crypto');
const EventController = require('../Controllers/Event.Controller');
const { verifyAccessToken } = require('../util/jwt');


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


router.post('/create', verifyAccessToken,upload.any(), EventController.create);
router.get('/get/:id', EventController.getEventWithOrganizersAndSpeakers);
router.get('/get', EventController.getEvents);


router.post('/speaker/create', upload.any(), EventController.createSpeaker);
router.get('/allspeakers', EventController.getAllSpeakers);

module.exports = router;