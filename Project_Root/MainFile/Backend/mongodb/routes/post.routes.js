const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
} = require('../controllers/post.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, createPost);
router.get('/', getAllPosts);

router.get('/:id', getPostById);

router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;
