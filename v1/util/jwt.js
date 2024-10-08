const jwt  = require('jsonwebtoken');
const createError = require('http-errors');
const db = require('../services/db');
const moment = require('moment');
const User = require('../Models/User.model');
const { re } = require('mathjs');

function generateExpireAt(expiration) {

const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + expiration);
    const formattedDate = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');
    return formattedDate; // Format: 'YYYY-MM-DD HH:mm:ss'
  }
  

module.exports =  {
    signAccessToken: (userID)=>{
        return new Promise((resolve,reject)=>{
            const payload = {
    
            }
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const option = {
                expiresIn: '1d',
                issuer: "uniconnect.com",
                audience:userID,
            }
            jwt.sign(payload,secret,option,(err,token)=>{
                if(err) return reject(err)
                resolve(token);
            })
        })
    },
    verifyAccessToken: async(req,res,next)=>{
        if(!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,async(err,payload)=>{
            if(err){
                if(err.name === "JsonWebTokenError")
                    return next(createError.Unauthorized());
                return next(createError.Unauthorized(err.message))
            }
            const result = await db.query(`SELECT userID,username,email,name,role FROM users WHERE userID = '${payload.aud}';`);
            if(result.length===0) 
                 next(createError.Unauthorized("Invalid Access Token"));
            req.payload = payload;
            req.user  = result[0];
            next();
        });
    },
    signRefreshToken: async(userID)=>{
        return new Promise((resolve,reject)=>{
            const payload = {
                
            }
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const option = {
                expiresIn: '30d',
                issuer: "uniconnect.com",
                audience:userID,
            }
            jwt.sign(payload,secret,option,async(err,token)=>{
                if(err) return reject(err)
                try {
                    const result = await db.query(`INSERT INTO refreshtoken VALUES('${userID}','${token}','${generateExpireAt(30)}');`);
                } catch (error) {
                    reject(error)
                }
                resolve(token);
            })
        })
    },
    verifyRefreshToken: async(req,res,next)=>{
        if(!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        jwt.verify(token,process.env.REFRESH_TOKEN_SECRET,async(err,payload)=>{
            if(err){
                if(err.name === "JsonWebTokenError")
                    return next(createError.Unauthorized());
                return next(createError.Unauthorized(err.message))
            }
            const result = await db.query(`SELECT * FROM refreshtoken WHERE token = '${token}';`);
            req.user =  await User.getWithFilter({userID: payload.aud}); 
            if(result.length===0)
            next(createError.Unauthorized("Invalid Refresh Token"));
            req.payload = payload;
            req.refreshToken = token;
            next();
        });
    },
}