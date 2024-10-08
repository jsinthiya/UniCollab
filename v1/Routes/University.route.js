const express = require('express');
const AuthController = require('../Controllers/Auth.Controller')
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const { onlyUniversityAccess,universityAndStudentAccess } = require('../Middleware/Permission.middleware');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const UniversityController = require('../Controllers/University.Controller');
const router = express.Router();



router.post('/register', UniversityController.register);
router.post('/approve',verifyAccessToken,onlyAdminAccess,UniversityController.approve);
router.get('/verify', UniversityController.verify);

router.get('/pendingApproval',verifyAccessToken,onlyAdminAccess,UniversityController.pendingApproval);




// router.post('/addemails',verifyAccessToken,onlyUniversityAccess,UniversityController.addEmailRegex);

router.get('/getAll',UniversityController.getUniversity);


module.exports = router;