const express = require('express');
const router = express.Router();
const { createReward, redeemReward } = require('../controllers/reward.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/:id/redeem', authenticateToken, redeemReward);
router.post('/', authenticateToken, createReward);

module.exports = router;