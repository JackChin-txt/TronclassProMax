// services/email.service.js
const transporter = require('../config/mail');

async function sendRewardNotification(to, message) {
  const mailOptions = {
    from: `Reward System <${process.env.GMAIL_USER}>`,
    to,
    subject: 'You have a new reward notification!',
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

module.exports = { sendRewardNotification };
