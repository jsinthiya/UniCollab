const express = require('express');
const AuthController = require('../Controllers/Auth.Controller')
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { onlyUniversityAccess,universityAndStudentAccess } = require('../Middleware/Permission.middleware');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const ClubController = require('../Controllers/Club.Controller');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const router = express.Router();

router.get('/',verifyAccessToken,onlyAdminAccess,ClubController.getAllClubs);
router.post('/create',verifyAccessToken,onlyUniversityAccess, ClubController.create);
router.get('/get',verifyAccessToken,universityAndStudentAccess,ClubController.getClubs)


module.exports = router;