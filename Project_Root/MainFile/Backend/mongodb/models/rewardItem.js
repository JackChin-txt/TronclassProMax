const mongoose = require('mongoose');

const RewardItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  pointsRequired: { type: Number, required: true },
  quantity: { type: Number, required: true },
  userLimit: { type: Number, default: 0 },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('RewardItem', RewardItemSchema);