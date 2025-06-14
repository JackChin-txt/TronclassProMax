const { User } = require('../models');

async function register(req, res) {
  const { username, email, walletId } = req.body;

  try {
    if (!username || !email || !walletId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }, { walletId }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = await User.create({ username, email, walletId });
    res.status(201).json({ message: 'User registered', userId: newUser._id });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register };