const { Comment } = require('../models');

async function addComment(req, res) {
  const { postId, content, cutoffTime } = req.body;

  try {
    const comment = await Comment.create({
      postId,
      content,
      author: req.user.userId,
      cutoffTime,
    });

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { addComment };