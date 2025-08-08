const mongoose = require('mongoose');

const RewardItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 獎勵名稱
  description: { type: String },          // 獎勵說明
  image: { type: String },                // 圖片 URL（可選）

  type: {
    type: String,
    enum: ['grade', 'physical', 'digital'], // 成績加分、實體物品、數位檔案
    required: true
  },

  pointsRequired: { type: Number, required: true }, // 所需點數

  year: {
    type: Number,
    required: function () {
      return this.type === 'digital';
    }
  },

  quantity: {
    type: Number,
    required: function () {
      return this.type !== 'grade'; // 成績加分類型不設數量
    }
  },

  userLimit: {
    type: Number,
    default: 1
  },

  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RewardItem', RewardItemSchema);