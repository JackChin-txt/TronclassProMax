const { User } = require('../models');
const jwt = require('jsonwebtoken');

// 接收 walletId + points，若帳號存在則回傳 message, token, userId, username, role ，並修正餘額
async function login(req, res) {
  const { walletId, points } = req.body;

  try {
    if (!walletId) {
      return res.status(400).json({ message: 'walletId is required' });
    }

    const user = await User.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ message: 'Wallet not registered' });
    }
    
    //修正餘額
    if (typeof points === 'number') {
      user.points = points;
      await user.save();
    }
    
    const token = jwt.sign(
      { userId: user._id, walletId: user.walletId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // 回傳 message, token, userId, username, role
    res.json({
      message: 'Login successful',
      token,
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };