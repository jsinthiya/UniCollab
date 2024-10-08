const UserModel = require('../Models/User.model');
const crypto = require('crypto');
const { clubRegSchema } = require('../util/validation_schema');
const createError = require('http-errors');
const { sendMail } = require('../services/email')
const generator = require('generate-password');
const bcrypt = require('bcrypt');
const { ClubModel } = require("../Models/Club.model");
const { generateShortName } = require('../util/helper');
const { UniversityModel } = require('../Models/University.model');

module.exports = {
    create: async (req, res, next) => {
        try {
            const validate = await clubRegSchema.validateAsync(req.body);
            const doesExist = await ClubModel.getWithFilterOR({
                email: validate.email,
            })
            if(doesExist) throw createError.Conflict("Club already has been registered")
            
            const club = new ClubModel(crypto.randomUUID(), validate.name, validate.email, req.user.userID);

            await club.create();
            const password = generator.generate({
                length: 10,
                uppercase: true,
                numbers: true
            });

            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            const username = generateShortName(req.user.name) + generateShortName(club.name);
            const user  = new UserModel(club.clubID,username,club.email,club.name,hashPassword,"club");
            await user.create();
            await sendMail(club.email, "Club Account Created", `<p>${password}</p>`);
            res.send(club);
        }
        catch (err) {
            if (err.isJoi === true) err.status = 422;
            next(err);
        }
    },
    getClubs:async (req,res,next) => {
        if( req.user.role == 'university' )
        {
            const result  = await ClubModel.getWithFilter({
                uniID: req.user.userID
            })

            if(!result) return res.send({
                data: []
            })
            console.log(result);
           return  res.send(result);
        }
        res.send("student");
    },
    getAllClubs: async (req,res,next) => {
        req.query.page = (req.query.page && parseInt(req.query.page)) || 1;
        req.query.limit = (req.query.limit && parseInt(req.query.limit)) || 10;
        const result = await ClubModel.getMultiple(req.query.page, req.query.limit);
        if(!result) return res.send({
            data: []
        })
        res.send(result);
    }
    
}