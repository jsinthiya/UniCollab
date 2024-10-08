const express = require('express');

const AuthController = require('../Controllers/Auth.Controller')
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const {onlyAdminAccess} = require('../Middleware/Admin.middleware')
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const User = require('../Models/User.model');
const router = express.Router();

router.use(express.json());

router.post('/register',encryptPassword, AuthController.register);

router.post('/login',validateLogin,AuthController.login );

router.post('/refresh-token',verifyRefreshToken,AuthController.refreshToken);

router.post('/identity',verifyRefreshToken,AuthController.identity);

router.delete('/logout',verifyRefreshToken,AuthController.logout );





// router.put('/change-email',verifyAccessToken,AuthController.changeEmail);












router.post('/google', async(req, res) => {
    const doesExist = await User.getWithFilter({ email: req.body.email });
    console.log(doesExist);
    if(doesExist){
        const accessToken = await signAccessToken(doesExist.data[0].userID);
        const refreshToken = await signRefreshToken(doesExist.data[0].userID);
        res.json({ accessToken, refreshToken, user: doesExist.data[0] });
    }
    else{
        const username = req.body.email.split('@')[0];
        const user = new User(req.body.id,username,req.body.email,req.body.name,'','user');
        await user.create();
        delete user.password;
        const accessToken = await signAccessToken(user.userID);
        const refreshToken = await signRefreshToken(user.userID);
        res.json({ accessToken, refreshToken, user });
    }
});

router.post('/github',async(req,res)=>{
    console.log(req.body);
    const doesExist = await User.getWithFilter({ email: req.body.email });
    console.log("doesExist",doesExist);
    if(doesExist){
        const accessToken = await signAccessToken(doesExist.data[0].userID);
        const refreshToken = await signRefreshToken(doesExist.data[0].userID);
        res.json({ accessToken, refreshToken, user: doesExist.data[0] });
    }
    else{
        const username = req.body.email.split('@')[0];
        const user = new User(req.body.id,username,req.body.email,req.body.name,'','user');
        await user.create();
        delete user.password;
        const accessToken = await signAccessToken(user.userID);
        const refreshToken = await signRefreshToken(user.userID);
        res.json({ accessToken, refreshToken, user });
    }
});




module.exports = router;