const createError = require('http-errors');
const UserModel = require('../Models/User.model');
const helper = require('../util/helper');
const crypto = require('crypto'); 
const db = require('../services/db');
const { registerSchema, loginSchema } = require('../util/validation_schema');
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const User = require('../Models/User.model');
const { re } = require('mathjs');


module.exports = {
    register: async (req, res, next) => {  
        try{
            const {name,email,password}  = req.body;
            const username = email.split("@")[0];
            //create user
            const user = new UserModel(crypto.randomUUID(),username.toLowerCase(),email.toLowerCase(),name,password,"user");
            const doesExist = await user.get("email")
            if(doesExist) throw createError.Conflict(`${email} already been register`);
    
            const result = await user.create();
            const accessToken = await signAccessToken(user.userID); 
            const refreshToken = await signRefreshToken(user.userID);
            res.send({accessToken,refreshToken,user:
                {
                    userID: user.userID,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: ""
                }}
                );
        }
        catch(err)
        {
            if(err.isJoi === true) err.status = 422;
            next(err);
        }
    },
    login: async (req, res, next) => {  
        try {
            console.log(req.body);
            const accessToken = await signAccessToken(req.userID); 
            const refreshToken = await signRefreshToken(req.userID);
            const user  = (await UserModel.getWithFilter({userID: req.userID})).data[0];
    
            res.send({
                user,
                accessToken,
                refreshToken
            });
        } catch (error) {
            next(error)
        }
        
    },
    refreshToken:  async (req, res, next) => {  
        try {
            const accessToken = await signAccessToken(req.payload.aud);
        const refreshToken = await signRefreshToken(req.payload.aud);
        try {
            await db.query(`DELETE FROM refreshtoken WHERE userID = '${req.payload.aud}' && token = '${req.refreshToken}';`);
        } catch (error) {
            next(error);
        }
        const user = req.user.data[0];
        res.send({accessToken,refreshToken,user})
        } catch (error) {
            next(error);
        }
        
    },
    identity:  async (req, res, next) => {  
        try {
            const accessToken = await signAccessToken(req.payload.aud);
        try {
        } catch (error) {
            next(error);
        }
     
        const user = req.user.data[0];
        const refreshToken = req.refreshToken;
        res.send({accessToken,refreshToken,user})
        } catch (error) {
            next(error);
        }
        
    },
    logout: async (req, res, next) => {  
        try {
            await db.query(`DELETE FROM refreshtoken WHERE userID = '${req.payload.aud}' && token = '${req.refreshToken}';`);
        } catch (error) {
            next(error);
        }
        res.send({message: "logout successfully"});
    },
    changeEmail: async (req, res, next) => {
        try {
            console.log(req.body);
            res.send(req.body);
        } catch (error) {
            next(error);
        }
    }
}