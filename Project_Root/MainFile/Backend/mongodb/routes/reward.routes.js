const express = require('express');
const router = express.Router();
const { createReward, redeemReward, getRewards, getRewardById, getMyRedemptions } = require('../controllers/reward.controller');
const authenticateToken = require('../middleware/authenticateToken');
router.get('/my-redemptions', authenticateToken, getMyRedemptions);
router.post('/:id/redeem', authenticateToken, redeemReward);
router.post('/', authenticateToken, createReward);

router.get('/', getRewards);
router.get('/:id', getRewardById);


module.exports = router;