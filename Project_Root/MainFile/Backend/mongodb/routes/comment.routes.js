const express = require('express');
const router = express.Router();
const {
  addComment,
  updateComment,
  deleteComment,
  getCommentsByPost,
  likeComment
} = require('../controllers/comment.controller');
const authenticateToken = require('../middleware/authenticateToken');

// 建立留言
router.post('/', authenticateToken, addComment);

// 編輯留言
router.put('/:commentId', authenticateToken, updateComment);

// 刪除留言
router.delete('/:commentId', authenticateToken, deleteComment);

// 查詢某貼文的所有留言
router.get('/post/:postId', getCommentsByPost);

// 喜歡或取消喜歡留言
router.put('/:id/like', authenticateToken, likeComment);

module.exports = router;
