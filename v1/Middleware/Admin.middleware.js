const bcrypt = require('bcrypt');
const createError = require('http-errors');
const db = require('../services/db');
const helper = require('../util/helper')
const { registerSchema, loginSchema } = require('../util/validation_schema');



function onlyAdminAccess(req,res,next)
{
    if(!(req.user.role =='admin')) next(createError.Unauthorized("You have no permission to access this route"));
    next();
}
module.exports = {
  onlyAdminAccess
};
