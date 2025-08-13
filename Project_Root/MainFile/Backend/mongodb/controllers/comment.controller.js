const Comment = require('../models/comment');

exports.addComment = async (req, res) => {
  try {
    const { postId, content, cutoffTime } = req.body;
    const userId = req.user.userId;

    const comment = new Comment({
      postId,
      author: userId,
      content,
      cutoffTime
    });

    await comment.save();
    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== userId)
      return res.status(403).json({ message: 'Unauthorized to update this comment' });

    comment.content = content;
    await comment.save();

    res.json({ message: 'Comment updated', comment });
  } catch (err) {
    res.status(500).json({ message: 'Error updating comment', error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== userId)
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });

    await Comment.deleteOne({ _id: commentId });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const likedIndex = comment.likedBy.findIndex(uid => uid.toString() === userId);

    if (likedIndex !== -1) {
      comment.likedBy.splice(likedIndex, 1);
      comment.numOfLikes -= 1;
      await comment.save();
      return res.json({ message: 'Like removed', likes: comment.numOfLikes });
    }

    comment.likedBy.push(userId);
    comment.numOfLikes += 1;
    await comment.save();
    res.json({ message: 'Liked', likes: comment.numOfLikes });

  } catch (err) {
    res.status(500).json({ message: 'Error liking comment', error: err.message });
  }
};
