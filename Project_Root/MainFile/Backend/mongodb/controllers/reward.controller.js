const { RewardItem, RedemptionRecord, User } = require('../models');
const { sendRewardNotification } = require('../services/email.service');

// ✅ createReward 定義
async function createReward(req, res) {
  const {
    name,
    description,
    image,
    type,
    pointsRequired,
    year,
    quantity,
    userLimit
  } = req.body;

  try {
    if (!name || !type || pointsRequired === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (type === 'digital' && !year) {
      return res.status(400).json({ message: 'Year is required for digital rewards' });
    }

    if (type === 'physical' && (quantity === undefined || quantity <= 0)) {
      return res.status(400).json({ message: 'Quantity is required for physical rewards' });
    }

    const reward = await RewardItem.create({
      name,
      description,
      image,
      type,
      pointsRequired,
      year: type === 'digital' ? year : undefined,
      quantity: type === 'grade' ? undefined : quantity,
      userLimit: userLimit || 1,
      provider: req.user.userId
    });

    res.status(201).json({ message: 'Reward item created', reward });
  } catch (err) {
    console.error('Create reward error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// ✅ redeemReward 定義
async function redeemReward(req, res) {
  const rewardId = req.params.id;
  const userId = req.user.userId;

  try {
    const reward = await RewardItem.findById(rewardId);
    const user = await User.findById(userId);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    const redemptionCount = await RedemptionRecord.countDocuments({
      userId,
      rewardItemId: rewardId
    });

    if (reward.userLimit > 0 && redemptionCount >= reward.userLimit) {
      return res.status(403).json({ message: 'Redemption limit reached' });
    }

    if (user.points < reward.pointsRequired) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    if (reward.type !== 'grade' && reward.quantity <= 0) {
      return res.status(400).json({ message: 'Reward out of stock' });
    }

    await RedemptionRecord.create({
      userId,
      rewardItemId: reward._id,
      quantity: 1,
      pointsSpent: reward.pointsRequired
    });

    user.points -= reward.pointsRequired;
    await user.save();

    if (reward.type !== 'grade') {
      reward.quantity -= 1;
      await reward.save();
    }

    await sendRewardNotification(
      user.email,
      'Reward Redemption Confirmation',
      `Hi ${user.username}, you have successfully redeemed the reward: "${reward.name}". Please wait for further instructions.`
    );

    res.status(200).json({ message: 'Reward redeemed and email sent' });
  } catch (err) {
    console.error('Redeem reward error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// ✅ 匯出兩個函式
module.exports = {
  createReward,
  redeemReward
};
