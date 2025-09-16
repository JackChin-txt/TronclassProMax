const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { register, getMyProfile, getMyName, getMyPoints } = require('../controllers/user.controller');

router.post('/register', register);
router.get('/me', authenticateToken, getMyProfile);
router.get('/me/name', authenticateToken, getMyName);
router.get('/me/points', authenticateToken, getMyPoints);

module.exports = router;