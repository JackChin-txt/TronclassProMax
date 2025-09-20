const express = require('express');
const router = express.Router();
const { createReward, redeemReward, getRewards, getRewardById, getMyRedemptions } = require('../controllers/reward.controller');
const authenticateToken = require('../middleware/authenticateToken');

// 獲取自己兌換紀錄
router.get('/my-redemptions', authenticateToken, getMyRedemptions);

// 以商品id兌換物品
router.post('/:id/redeem', authenticateToken, redeemReward);

// 創建商品
router.post('/', authenticateToken, createReward);

// 獲取所有商品資料
router.get('/', getRewards);

// 以商品id獲得商品資訊
router.get('/:id', getRewardById);


module.exports = router;