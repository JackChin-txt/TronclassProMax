const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const {
  User,
  Post,
  Comment,
  RewardItem,
  RedemptionRecord,
  Notification
} = require('../models');

function logError(error, step = 'Unknown Step') {
    const logMessage = `[${new Date().toISOString()}] Step: ${step}\n${error.stack || error}\n\n`;
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
}

const uri = "mongodb+srv://raysu5195:ltjNcj3e6ZBbhFvp@dbtest.adprosl.mongodb.net/myDatabase";

async function show_status() {
    await mongoose.connect(uri);
    try {
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const commentCount = await Comment.countDocuments();
        const rewardItemCount = await RewardItem.countDocuments();
        const redemptionCount = await RedemptionRecord.countDocuments();
        const notificationCount = await Notification.countDocuments();

        console.log('\nDatabase Status:');
        console.log(`- Users: ${userCount}`);
        console.log(`- Posts: ${postCount}`);
        console.log(`- Comments: ${commentCount}`);
        console.log(`- RewardItems: ${rewardItemCount}`);
        console.log(`- RedemptionRecords: ${redemptionCount}`);
        console.log(`- Notifications: ${notificationCount}`);

        console.log('\nSample Data Preview:');

        const users = await User.find().limit(3).lean();
        console.log('\nUsers:', users.map(u => ({
            username: u.username,
            email: u.email,
            points: u.points
        })));

        const posts = await Post.find().limit(3).populate('author', 'username').lean();
        console.log('\nPosts:', posts.map(p => ({
            title: p.title,
            author: p.author?.username,
            tags: p.tags
        })));

        const comments = await Comment.find().limit(3).populate('author', 'username').populate('postId', 'title').lean();
        console.log('\nComments:', comments.map(c => ({
            postTitle: c.postId?.title,
            author: c.author?.username,
            content: c.content
        })));

        const rewards = await RewardItem.find().limit(3).populate('provider', 'username').lean();
        console.log('\nRewardItems:', rewards.map(r => ({
            name: r.name,
            pointsRequired: r.pointsRequired,
            quantity: r.quantity,
            provider: r.provider?.username
        })));

        const redemptions = await RedemptionRecord.find().limit(3).populate('userId', 'username').populate('rewardItemId', 'name').lean();
        console.log('\nRedemptionRecords:', redemptions.map(r => ({
            user: r.userId?.username,
            reward: r.rewardItemId?.name,
            pointsSpent: r.pointsSpent,
            status: r.status
        })));

        const notifications = await Notification.find().limit(3).populate('recipient', 'username').populate('buyer', 'username').lean();
        console.log('\nNotifications:', notifications.map(n => ({
            recipient: n.recipient?.username,
            buyer: n.buyer?.username,
            message: n.message
        })));

    } catch (err) {
        console.error('Error fetching database status:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database (after showing status)');
    }
}

async function delete_all() {
    await mongoose.connect(uri);
    try {
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await RewardItem.deleteMany({});
        await RedemptionRecord.deleteMany({});
        await Notification.deleteMany({});
        console.log('All test data has been successfully deleted');
    } catch (err) {
        console.error('Error deleting test profile:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔒 Disconnected from database');
        await show_status();
    }
}

async function add_test() {
    await mongoose.connect(uri);
    try {
        let user, user2, post, comment, rewardItem, redemption, notification;

        user = await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password: 'secure123',
          points: 100
        });

        user2 = await User.create({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'testpassword2',
          points: 1
        });

        post = await Post.create({
          author: user._id,
          title: 'Sample Question',
          content: 'What is the capital of France?',
          tags: ['geography']
        });

        comment = await Comment.create({
          postId: post._id,
          author: user._id,
          content: 'The capital of France is Paris.',
          likedBy: [user._id],
          cutoffTime: new Date(Date.now() + 86400000)
        });

        rewardItem = await RewardItem.create({
          name: 'Coffee Coupon',
          description: 'Get a free coffee!',
          image: 'https://example.com/coffee.jpg',
          pointsRequired: 30,
          quantity: 10,
          userLimit: 1,
          provider: user._id
        });

        redemption = await RedemptionRecord.create({
          userId: user._id,
          rewardItemId: rewardItem._id,
          quantity: 1,
          pointsSpent: 30,
          status: 'pending'
        });

        notification = await Notification.create({
          recipient: user._id,
          buyer: user2._id,
          message: 'Your reward is being processed.'
        });

        console.log('All test data has been successfully created');
    } catch (err) {
        console.error('Error creating test profile:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
        await show_status();
    }
}

// --- main entry ---
const action = process.argv[2];

if (action === 'add') {
    add_test();
} else if (action === 'delete') {
    delete_all();
} else if (action === 'show') {
    show_status();
} else {
    console.log('Please provide a valid action: add / delete / show');
}
