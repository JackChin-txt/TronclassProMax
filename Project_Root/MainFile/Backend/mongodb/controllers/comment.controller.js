const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user');

//新增評論，接收所屬文章的postid，文本，截止時間(可先隨便填)，並回傳comment
exports.addComment = async (req, res) => {
  try {
    const { postId, content, cutoffTime } = req.body;
    const userId = req.user.userId;

    const count = await Comment.countDocuments({ postId });

    const comment = new Comment({
      postId,
      author: userId,
      content,
      cutoffTime,
      replyId: count + 1
    });

    await comment.save();
    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    console.error('Add comment error:', err.message);
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
//以postid查詢其底下的留言
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
// 設定最佳留言，接收commentid，結束後回傳comment
exports.setBestComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // 找出該留言
    const comment = await Comment.findById(commentId).populate('postId');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const post = await Post.findById(comment.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // 只有該 Post 作者能設最佳解
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to set best reply' });
    }

    // 將同一篇文章下的其他最佳留言清除
    await Comment.updateMany(
      { postId: post._id, bestReply: true },
      { $set: { bestReply: false } }
    );

    // 設定當前留言為最佳解
    comment.bestReply = true;
    await comment.save();

    // 更新 Post 狀態為有最佳解
    post.bestReply = true;
    await post.save();

    //  更新留言作者的 points (假設加 10 點)
    const commentAuthor = await User.findById(comment.author._id);
    if (commentAuthor) {
      commentAuthor.points = (commentAuthor.points || 0) + 10; 
      await commentAuthor.save();
    }

    // 回傳comment(包含replyid)
    res.json({ message: 'Best comment set successfully', comment });
  } catch (err) {
    console.error('Set best comment error:', err.message);
    res.status(500).json({ message: 'Error setting best comment', error: err.message });
  }
};
