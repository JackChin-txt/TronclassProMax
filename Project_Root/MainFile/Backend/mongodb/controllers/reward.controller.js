// controllers/reward.controller.js
const { RewardItem } = require('../models');

async function createReward(req, res) {
  const { name, description, image, pointsRequired, quantity, userLimit } = req.body;

  try {
    const reward = await RewardItem.create({
      name,
      description,
      image,
      pointsRequired,
      quantity,
      userLimit,
      provider: req.user.userId,
    });

    res.status(201).json({ message: 'Reward item created', reward });
  } catch (err) {
    console.error('Create reward error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createReward };