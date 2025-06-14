const { User } = require('../models');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { walletId } = req.body;

  try {
    if (!walletId) {
      return res.status(400).json({ message: 'walletId is required' });
    }

    const user = await User.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ message: 'Wallet not registered' });
    }

    const token = jwt.sign(
      { userId: user._id, walletId: user.walletId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token, username: user.username });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };