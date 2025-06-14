const express = require('express');
const router = express.Router();
const { addComment } = require('../controllers/comment.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, addComment);

module.exports = router;