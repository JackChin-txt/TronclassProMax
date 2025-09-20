const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試用使用者
const user = {
  username: 'rewardTester',
  email: 'raysu5195@gmail.com',
  walletId: '0xREWARD123456789',
  role: 'student',
  major: '商船學系'
};

let token = '';
let rewardId = '68cef044060c80ab9fb46e64'; // 指定已存在的 rewardId

async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ User already exists, skipping registration.');
    } else {
      throw err;
    }
  }
}

async function loginUser() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    walletId: user.walletId,
    points : 100
  });
  token = res.data.token;
  console.log('Logged in as:', res.data.username);
}

async function redeemReward() {
  try {
    const res = await axios.post(`${BASE_URL}/api/rewards/${rewardId}/redeem`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(' Redemption result:');
    console.log(`Message: ${res.data.message}`);
    console.log(`Points deducted: ${res.data.pointsDeducted}`);

  } catch (err) {
    console.error(' Redemption failed:', err.response?.data || err.message);
  }
}

(async () => {
  try {
    console.log(' Running RedeemReward API test...');
    await registerUser();
    await loginUser();
    await redeemReward();
    console.log('\nAll operations completed.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();
