const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  cutoffTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  numOfLikes: { type: Number, default: 0},
  replyId:  { type: Number, required: true }
});

module.exports = mongoose.model('Comment', CommentSchema);