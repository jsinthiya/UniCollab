const { studentVerifySchema, studentTokenVerifySchema } = require('../util/validation_schema');
const createError = require('http-errors');
const { sendMail } = require('../services/email')
const { } = require('../Models/University.model');
const { StudentModel } = require("../Models/Student.model");
const db = require('../services/db');
const { signAccessToken } = require('../util/jwt');
const jwt = require('jsonwebtoken');


module.exports = {
    sendVerifyURL: async (req, res, next) => {
        try {
            if(req.body.graduationDate==="") delete req.body.graduationDate;
            const validate = await studentVerifySchema.validateAsync(req.body);
            const doesExist = await StudentModel.get(req.user.userID);
            if(doesExist && doesExist[0].verified) throw createError.Conflict("Student account already verified");
            if(doesExist) 
                await db.query(`DELETE FROM students WHERE stuID = '${req.user.userID}';`);
            const duplicateEmail = await db.query(`SELECT * FROM students WHERE eduMail = '${validate.eduMail}';`);
            if(duplicateEmail.length>0) throw createError.Conflict("An account already verified with this email");
            const student = new StudentModel(req.user.userID,validate.eduMail,validate.uniID,validate.department,validate.enrollmentDate,validate.graduationDate?validate.graduationDate:null);
            const result = await student.create();
            const accessToken = await signAccessToken(req.user.userID);
            const hostname = process.env.HOSTNAME || 'localhost';
            const port = process.env.PORT || 2000;
            const emailURL = `http://${hostname}:${port}/v1/student/verify?token=${accessToken}`;
            await sendMail(validate.eduMail, "Student Account Created", `<p>Click <a href="${emailURL}">here</a> to verify your account</p>`);
            res.send(student);
        }
        catch (err) {
            if (err.isJoi === true) err.status = 422;
            next(err);
        }
    },
    verify: async (req, res, next) => {
        try {
            const token = req.query.token;
            const validate = await studentTokenVerifySchema.validateAsync({accessToken:token});
            jwt.verify(validate.accessToken,process.env.ACCESS_TOKEN_SECRET,async(err,payload)=>{
                if(err){
                    if(err.name === "JsonWebTokenError")
                        return next(createError.Unauthorized());
                    return next(createError.Unauthorized(err.message))
                }
                const result = await db.query(`SELECT userID,username,email,name,role FROM users WHERE userID = '${payload.aud}';`);
                if(result.length===0) 
                     next(createError.Unauthorized("Invalid Verify Token"));
                const user  = result[0];
                if(user.role !== "user") 
                    next(createError.Unauthorized("Invalid Verify Token"));

                await db.query(`UPDATE users SET role = 'student' WHERE userID = '${user.userID}';`);
                await db.query(`UPDATE students SET verified = 1 WHERE stuID = '${user.userID}';`);

                await sendMail(user.email, "Account Verified", `<p>Your account has been verified</p>`);
                return res.redirect('http://localhost:5173/verify/ok');
            });
        }
        catch (err) {
            if (err.isJoi === true) err.status = 422;
            next(err);
        }
    }
}