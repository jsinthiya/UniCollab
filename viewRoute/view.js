const express = require('express');
const { verifyAccessToken } = require('../v1/util/jwt');
const router = express.Router();

router.get('/result', async (req, res) => {
    const result = await EducationBoardResult(req.query.exam, req.query.year, req.query.board, req.query.roll, req.query.reg);
    res.send(result);
});
router.get('/login', async (req, res) => {
    if(req.cookies.accessToken) return res.redirect('/');
    res.render('auth/sign-in');
});
router.get('/register', async (req, res) => {
    if(req.cookies.accessToken) return res.redirect('/');
    res.render('auth/sign-up');
});
router.get('/logout', async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('user');
    res.redirect('/login');
});
router.get('/', verifyAccessToken,async(req, res) => {
    res.render('home/index');
})
module.exports = router;