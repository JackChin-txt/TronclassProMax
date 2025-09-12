const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  cutoffTime: { type: Date },
  bestReply: { type: Boolean, default: false }
});

module.exports = mongoose.model('Post', PostSchema);