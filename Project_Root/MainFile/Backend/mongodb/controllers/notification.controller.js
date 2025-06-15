const { Notification } = require('../models');

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('buyer', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getNotifications };