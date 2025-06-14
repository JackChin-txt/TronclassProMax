// test/mongoose_test.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

const {
  User,
  Post,
  Comment,
  RewardItem,
  RedemptionRecord,
  Notification,
} = require('../models');

async function showStatus() {
  await connectDB();

  try {
    const [userCount, postCount, commentCount, rewardCount, redemptionCount, notificationCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      RewardItem.countDocuments(),
      RedemptionRecord.countDocuments(),
      Notification.countDocuments(),
    ]);

    console.log('\nDatabase Status:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Posts: ${postCount}`);
    console.log(`- Comments: ${commentCount}`);
    console.log(`- RewardItems: ${rewardCount}`);
    console.log(`- RedemptionRecords: ${redemptionCount}`);
    console.log(`- Notifications: ${notificationCount}`);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

async function deleteAll() {
  await connectDB();

  try {
    await Promise.all([
      User.deleteMany(),
      Post.deleteMany(),
      Comment.deleteMany(),
      RewardItem.deleteMany(),
      RedemptionRecord.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('All collections cleared.');
  } catch (err) {
    console.error('Error deleting documents:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

async function addTestData() {
  await connectDB();

  try {
    const user1 = await User.create({
      username: 'demo1',
      email: 'demo1@example.com',
      walletId: '0xTESTWALLET1',
      points: 100,
    });

    const post = await Post.create({
      author: user1._id,
      title: 'Test Post Title',
      content: 'This is a test post for verification.',
      tags: ['test', 'demo'],
    });

    const comment = await Comment.create({
      postId: post._id,
      author: user1._id,
      content: 'This is a test comment.',
      cutoffTime: new Date(Date.now() + 86400000),
    });

    const reward = await RewardItem.create({
      name: 'Test Reward',
      description: 'Free reward item',
      image: 'https://example.com/image.jpg',
      pointsRequired: 50,
      quantity: 5,
      userLimit: 1,
      provider: user1._id,
    });

    const redemption = await RedemptionRecord.create({
      userId: user1._id,
      rewardItemId: reward._id,
      quantity: 1,
      pointsSpent: 50,
      status: 'pending',
    });

    const notification = await Notification.create({
      recipient: user1._id,
      buyer: user1._id,
      message: 'Your test reward is being processed.',
    });

    console.log('Sample test data added.');
  } catch (err) {
    console.error('Error adding test data:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// 取得指令
const action = process.argv[2];

if (action === 'add') {
  addTestData();
} else if (action === 'delete') {
  deleteAll();
} else if (action === 'show') {
  showStatus();
} else {
  console.log('⚠️ Please provide a valid action: add / delete / show');
}