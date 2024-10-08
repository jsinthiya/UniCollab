const express = require('express');
const { verifyAccessToken } = require('../util/jwt');
const DashboardController = require('../Controllers/Dashboard.Controller');
const router = express.Router();

router.get('/feed',verifyAccessToken,DashboardController.fetch);
router.get('/search',DashboardController.search);

module.exports = router;