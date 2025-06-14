const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notification.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/', authenticateToken, getNotifications);

module.exports = router;