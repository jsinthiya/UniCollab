const bcrypt = require('bcrypt');
const createError = require('http-errors');
const db = require('../services/db');
const helper = require('../util/helper')



function onlyUniversityAccess(req,res,next)
{
    if(!(req.user.role =='university')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}

function onlyUserAccess(req,res,next)
{
    if(!(req.user.role =='user')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}

function universityAndStudentAccess(req,res,next)
{
    if(!(req.user.role =='university' || req.user.role == 'student')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}

function questionAccess(req,res,next)
{
    if(!(req.user.role =='student')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}

function studentAndAdminAccess(req,res,next)
{
    if(!(req.user.role =='student' || req.user.role == 'admin')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}
function onlyStudentAccess(req,res,next)
{
    if(!(req.user.role =='student')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}
module.exports = {
  onlyUniversityAccess,
  universityAndStudentAccess,
  onlyUserAccess,
  questionAccess,
  studentAndAdminAccess,
  onlyStudentAccess
};
