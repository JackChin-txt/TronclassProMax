const { sendGmail } = require('./mailer');

sendGmail({
  to: 'leoyu93.01.04@gmail.com',
  subject: 'Reward Redemption Notification',
  text: 'This is a test email: A student has just redeemed a reward item.',
});
