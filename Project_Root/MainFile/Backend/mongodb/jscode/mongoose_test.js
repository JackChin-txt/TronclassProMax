//---this file is about to test whether database is worked or not---*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
/*---load models when need to use data to database---*/
const {
  User,
  Post,
  Comment,
  RewardItem,
  RedemptionRecord,
  Notification
} = require('../models');

/*---return error log for debug---*/
function logError(error, step = 'Unknown Step') {
    const logMessage = `[${new Date().toISOString()}] ❌ Step: ${step}\n${error.stack || error}\n\n`;
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
}

/*---database uri---*/
const uri = "mongodb+srv://raysu5195:ltjNcj3e6ZBbhFvp@dbtest.adprosl.mongodb.net/myDatabase";

/*---delete all data in database(except models) ---*/
async function delete_all(){
    await mongoose.connect(uri);
    try {
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await RewardItem.deleteMany({});
        await RedemptionRecord.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ All test data has been successfully deleted');
    } catch (err) {
        console.error('❌ err deleting test profile:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔒 Disconnected from database');
    }
}
/*---add test data into database---*/
async function add_test() {
    await mongoose.connect(uri);
    try {
      let user, user2, post, comment, rewardItem, redemption, notification;//only can be used in this function
  
      try {
        user = await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password: 'secure123',
          points: 100
        });
      } catch (err) {
        logError(err, 'Create User');
        throw err;
      }
  
      try {
        user2 = await User.create({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'testpassword2',
          points: 1
        });
      } catch (err) {
        logError(err, 'Create User2');
        throw err;
      }
  
      try {
        post = await Post.create({
          author: user._id,
          title: 'Sample Question',
          content: 'What is the capital of France?',
          tags: ['geography']
        });
      } catch (err) {
        logError(err, 'Create Post');
        throw err;
      }
  
      try {
        comment = await Comment.create({
          postId: post._id,
          author: user._id,
          content: 'The capital of France is Paris.',
          likedBy: [user._id],
          cutoffTime: new Date(Date.now() + 86400000)
        });
      } catch (err) {
        logError(err, 'Create Comment');
        throw err;
      }
  
      try {
        rewardItem = await RewardItem.create({
          name: 'Coffee Coupon',
          description: 'Get a free coffee!',
          image: 'https://example.com/coffee.jpg',
          pointsRequired: 30,
          quantity: 10,
          userLimit: 1,
          provider: user._id
        });
      } catch (err) {
        logError(err, 'Create RewardItem');
        throw err;
      }
  
      try {
        redemption = await RedemptionRecord.create({
          userId: user._id,
          rewardItemId: rewardItem._id,
          quantity: 1,
          pointsSpent: 30,
          status: 'pending'
        });
      } catch (err) {
        logError(err, 'Create RedemptionRecord');
        throw err;
      }
  
      try {
        notification = await Notification.create({
          recipient: user._id,
          buyer: user2._id,
          message: 'Your reward is being processed.'
        });
      } catch (err) {
        logError(err, 'Create Notification');
        throw err;
      }
  
      console.log('✅ All test data has been successfully created');
  
    } catch (err) {
      console.error('❌ err creating test profile:', err.message);
    } finally {
      await mongoose.disconnect();
      console.log('🔒 Disconnected from database');
    }
  }
delete_all();
//add_test();
