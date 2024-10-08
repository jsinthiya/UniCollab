const bcrypt = require('bcrypt');
const createError = require('http-errors');
const db = require('../services/db');
const helper = require('../util/helper')
const { registerSchema, loginSchema } = require('../util/validation_schema');


async function encryptPassword(request, response, next) {
  try {
    const validate = await registerSchema.validateAsync(request.body);
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(request.body.password, salt);
    request.body.password = hashPassword;
    next();
  } catch (error) {
    if(error.isJoi === true) error.status = 422;
    next(error);
  }
}


async function validateLogin(req,res,next)
{
  try {
    const result = await loginSchema.validateAsync(req.body);
    const email = result.email;
   const password = result.password;
  const query = `SELECT userID,password FROM users WHERE email = '${email}'`;
    const rows = await db.query(query);
    const data = helper.emptyOrRows(rows);
    if(data.length === 0) 
    {
      next(createError.Unauthorized("email & password not match"))
    }
    const isMatch = await bcrypt.compare(password,data[0].password)
    if(!isMatch) 
    {
      next(createError.Unauthorized("email & password not match"))
    }
    req.userID = data[0].userID;
    next()
  } catch (error) {
    if(error.isJoi === true) error.status = 422;
    next(error)
  }
  
}
module.exports = {
  encryptPassword,
  validateLogin
};
