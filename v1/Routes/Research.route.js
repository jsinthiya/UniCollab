const express = require('express');
const AuthController = require('../Controllers/Auth.Controller')
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { onlyUniversityAccess,universityAndStudentAccess, onlyStudentAccess } = require('../Middleware/Permission.middleware');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const ClubController = require('../Controllers/Club.Controller');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const { accessCheck } = require('../Middleware/Project.middleware');
const ProjectController = require('../Controllers/Project.Controller');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { query } = require('../services/db');
const crypto = require('crypto');
const { re } = require('mathjs');
const ResearchController = require('../Controllers/Research.Controller');
const { get } = require('http');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.resolve(__dirname, '../../public/uploads/research'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

router.post('/propose',verifyAccessToken,upload.any(),ResearchController.propose);
router.get('/proposal/:id',ResearchController.getProposal);
router.get('/get',ResearchController.getResearches);
router.get('/get/:id',ResearchController.getResearch);


module.exports = router;