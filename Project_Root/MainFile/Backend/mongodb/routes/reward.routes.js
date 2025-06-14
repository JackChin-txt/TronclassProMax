const express = require('express');
const router = express.Router();
const { createReward } = require('../controllers/reward.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, createReward);

module.exports = router;