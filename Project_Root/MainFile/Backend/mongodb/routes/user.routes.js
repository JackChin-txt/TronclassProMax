const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { register, getMyProfile, getMyName, getMyPoints, syncMyOnchainPoints } = require('../controllers/user.controller');

// 註冊
router.post('/register', register);

// 獲取自己所有資料(user.js的內容)
router.get('/me', authenticateToken, getMyProfile);

// 獲取自己名字
router.get('/me/name', authenticateToken, getMyName);

// 獲取自己點數(資料庫的)
router.get('/me/points', authenticateToken, getMyPoints);

// 從鏈上同步點數到 DB
router.post('/me/points/sync-onchain', authenticateToken, syncMyOnchainPoints);
module.exports = router;