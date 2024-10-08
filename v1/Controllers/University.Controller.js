const { UniversityModel } = require("../Models/University.model")
const UserModel = require('../Models/User.model');
const crypto = require('crypto');
const { universityRegSchema,universityAddEmailsSchema,verifyUniversitySchema,universityApproveSchema } = require('../util/validation_schema');
const createError = require('http-errors');
const { sendMail } = require('../services/email')
const { } = require('../Models/University.model');
const generator = require('generate-password');
const { generateDomainRegex,isEmailMatchingDomain } = require('../util/helper');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const bcrypt = require('bcrypt');
const jwt  = require('jsonwebtoken');
const { access } = require("fs");
const db = require('../services/db');
const { query } = require("express");
function generateShortName(longName) {
    const words = longName.split(' ');
    const shortName = words.map(word => word.charAt(0).toLowerCase()).join('');
    return shortName;
}

module.exports = {
    register: async (req, res, next) => {
        try {
            const validate = await universityRegSchema.validateAsync(req.body);
            const doesExist = await UserModel.getWithFilter({ email: validate.email });
    
            if(doesExist) throw createError.Conflict("University already has been registered");


            const uniID = crypto.randomUUID();

            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(validate.password, salt);

            const username = validate.website.split(".")[0];

            const user  = new UserModel(uniID,username,validate.email,validate.name,hashPassword,"guestUniversity");
            const resp = await user.create();


            const uni = new UniversityModel(uniID,validate.name,validate.type,validate.email,validate.website,0,validate.description);
        
            const result = await uni.create();
        
            res.status(201).send(result);
        }
        catch (err) {
            if (err.isJoi === true) err.status = 422;
            next(err);
        }
    },
    verify: async (req, res, next) => {
        try {
            const reqToken = {accessToken: req.query.token}
            const validate = await verifyUniversitySchema.validateAsync(reqToken);
            await jwt.verify(validate.accessToken,process.env.ACCESS_TOKEN_SECRET,async(err,payload)=>{
                if(err){
                    if(err.name === "JsonWebTokenError")
                        return next(createError.Unauthorized());
                    return next(createError.Unauthorized(err.message))
                }
                const result = await db.query(`SELECT userID,username,email,name,role FROM users WHERE userID = '${payload.aud}';`);
                if(result.length===0) 
                     next(createError.Unauthorized("Invalid Verify Token"));
                const user  = result[0];
                if(user.role !== "guestUniversity") 
                    next(createError.Unauthorized("Invalid Verify Token"));

                await db.query(`UPDATE users SET role = 'university' WHERE userID = '${user.userID}';`);
                await sendMail(user.email, "University Account Verified", `<p>Your account has been verified</p>`);
                const accessToken = await signAccessToken(user.userID);
                const refreshToken = await signRefreshToken(user.userID);
                user.role = "university";
                res.send({accessToken,refreshToken,user});
            });
        }
        catch (err) {
            next(err);
        }
    },
    approve: async (req, res, next) => {
        try {
            const validate = await universityApproveSchema.validateAsync(req.body);
            const result = await UniversityModel.get(validate.uniID);
            if (!result) throw createError.NotFound("University Not Found");
            req.uni = {
                uniID: result[0].uniID,
                name: result[0].name,
                email: result[0].email,
                website: result[0].website,
            };
            if (result[0].approval == 1)
                throw createError.Conflict(`${result[0].name} is already approved. Please check your official email`);

            await UniversityModel.update({ approval: 1 }, req.body.uniID);
            const accessToken = await signAccessToken(req.uni.uniID);
            const refreshToken = await signRefreshToken(req.uni.uniID);
            const hostname = process.env.HOSTNAME || 'localhost';
            const port = process.env.PORT || 2000;
            const emailURL = `http://${hostname}:${port}/v1/university/verify?token=${accessToken}`;
            await sendMail(req.uni.email, "University Account Approved", `<p>Click <a href="${emailURL}">here</a> to verify your account</p>`);
            res.send({ accessToken, refreshToken });
        }
        catch (err) {
            next(err);
        }
    },
    addEmailRegex: async (req, res, next) => {
        try {
            const validate = await universityAddEmailsSchema.validateAsync(req.body);
            const result = await UniversityModel.getRegex(req.user.userID);
            let emailsArr = validate.emails;
            if(result) {
                emailsArr = [...new Set(result.concat(validate.emails))];            
            }
            const emails = JSON.stringify(emailsArr);            
            await UniversityModel.update({ allowedEmails: emails }, req.user.userID);
            res.send({
                status: "success",
                message: "Emails added successfully",
                emalils: JSON.parse(emails)
            })
        }
        catch (err) {
            if (err.isJoi === true) err.status = 422;
            next(err);
        }
    },
    getUniversity: async (req, res, next) => {
        try {
            const result = await UniversityModel.getAll();
            if (!result) throw createError.NotFound("No University Found");
            res.send(result);
        }
        catch (err) {
            next(err);
        }
    },
    pendingApproval: async (req, res, next) => {
        try {
            const result = await UniversityModel.getPendingApproval(req.query.search);
            if (!result) throw createError.NotFound("No University Found");
            res.send(result);
        }
        catch (err) {
            next(err);
        }
    }
}