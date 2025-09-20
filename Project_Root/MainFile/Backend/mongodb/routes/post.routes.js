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
// 新增貼文
router.post('/', authenticateToken, createPost);

// 獲取所有貼文
router.get('/', getAllPosts);

// 以userid獲取貼文
router.get('/:id', getPostById);

// 更新貼文
router.put('/:id', authenticateToken, updatePost);

//刪除貼文
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;
