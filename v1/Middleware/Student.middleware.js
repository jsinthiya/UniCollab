const {generateDomainRegex, isEmailMatchingDomain} = require('../util/helper');
const {UniversityModel} = require('../Models/University.model');
const {StudentModel} = require('../Models/Student.model');
const createError = require('http-errors');
module.exports = {
    checkEmailRegex: async (req, res, next) => {
        try {
            console.log(req.body.eduMail);
            if(!req.body.eduMail) next(createError.BadRequest("Email is required"));
            const regexEmails = await UniversityModel.getRegex(req.body.uniID);
            const emails = JSON.parse(JSON.stringify(regexEmails));
            if(emails==null) next();
            else{
                let flag = false;
                emails.forEach((email) => {
                    const regex = generateDomainRegex(email);
                    if (isEmailMatchingDomain(req.body.eduMail, regex)) {
                        flag = true;
                    }
                });
                if (!flag) {
                    next(createError.BadRequest("Email is not matching with university domain"));
                }
                next();
            }
            
        } catch (err) {
            next(err);
        }
    }
}