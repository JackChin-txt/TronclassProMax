const { User } = require('../models');

// POST /api/users/register
async function register(req, res) {
  const { username, email, walletId, role, major } = req.body;

  try {
    // 基本欄位檢查
    if (!username || !email || !walletId || !major) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 檢查重複帳號
    const existingUser = await User.findOne({ walletId });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 建立使用者
    const newUser = await User.create({
      username,
      email,
      walletId,
      role: role || 'student', // 預設為 student
      major
    });

    res.status(201).json({ message: 'User registered', userId: newUser._id });
  } catch (err) {
    console.error(' Registration error:', err);

    // 重複 key 錯誤處理
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return res.status(409).json({ message: `Duplicate field: ${field}` });
    }

    // Enum 轉型錯誤（如 major 不在列舉中）
    if (err.name === 'ValidationError') {
      const field = Object.keys(err.errors)[0];
      return res.status(400).json({ message: `Invalid ${field}: ${err.errors[field].message}` });
    }

    res.status(500).json({ message: 'Server error' });
  }
}


async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-__v'); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get my profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMyName(req, res) {
  try {
    const user = await User.findById(req.user.userId); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username });
  } catch (err) {
    console.error('Get my name error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// controllers/user.controller.js
//const User = require('../models/user.model'); // 實際路徑照你們專案調

// ...原本的 register, getMyProfile, getMyName, getMyPoints...

async function syncMyOnchainPoints(req, res) {
  try {
    const { walletId, balanceRaw } = req.body;

    if (!walletId || !balanceRaw) {
      return res.status(400).json({ error: '缺少 walletId 或 balanceRaw' });
    }

    // authenticateToken 應該已經把 user id 放在 req.user 裡
    console.log('syncMyOnchainPoints req.user =', req.user);

    // 你的 middleware 看起來是用 userId 這個欄位
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) {
      return res.status(401).json({ error: '未授權' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    // 再確認一次這個 user 綁定的錢包和前端傳來的一致
    if ((user.walletId || '').toLowerCase() !== walletId.toLowerCase()) {
      return res.status(403).json({ error: '錢包位址不符' });
    }

    // 把 DB 的點數欄位更新成「鏈上的 raw 值」
    // 欄位名稱你可以自己決定，例如 pointsRaw
    user.pointsRaw = balanceRaw;

    user.points = Number(balanceRaw) / 1e18;

    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error('syncMyOnchainPoints error:', err);
    return res.status(500).json({ error: '內部錯誤' });
  }
}


async function getMyPoints(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('points');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ points: user.points });
  } catch (err) {
    console.error('Get my points error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = { 
  register,
  getMyProfile,
  getMyName,
  getMyPoints,
  syncMyOnchainPoints 
};