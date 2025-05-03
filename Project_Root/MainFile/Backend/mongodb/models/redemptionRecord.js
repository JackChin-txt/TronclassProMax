const mongoose = require('mongoose');

const RedemptionRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardItem', required: true },
  quantity: { type: Number, required: true },
  pointsSpent: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  delivedAt: { type: Date }
});

module.exports = mongoose.model('RedemptionRecord', RedemptionRecordSchema);