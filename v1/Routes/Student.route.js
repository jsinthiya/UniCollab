const express = require('express');
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { onlyUniversityAccess,universityAndStudentAccess,onlyUserAccess } = require('../Middleware/Permission.middleware');
const { verifyAccessToken } = require('../util/jwt');
const StudnentController = require('../Controllers/Student.Controller');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const {checkEmailRegex} = require('../Middleware/Student.middleware');
const router = express.Router();

router.post('/sendVerifyURL',verifyAccessToken,onlyUserAccess, checkEmailRegex,StudnentController.sendVerifyURL);
router.get('/verify',StudnentController.verify);


module.exports = router;