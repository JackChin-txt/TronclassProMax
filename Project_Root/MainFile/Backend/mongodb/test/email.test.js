const { sendRewardNotification } = require('../services/email.service');

sendRewardNotification(
  'leoyu93.01.04@gmail.com',
  'Test Email from Tronclass App',
  'This is a system test email. If you are reading this, the content is working.'
);
