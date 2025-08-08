const axios = require('axios');

const API_AUTH = 'http://localhost:3000/api/auth';
const API_USER = 'http://localhost:3000/api/users';
const API_REWARD = 'http://localhost:3000/api/rewards';

// 測試用帳號
const testUser = {
  username: 'testuser123',
  email: `testuser${Date.now()}@example.com`,
  walletId: `wallet_testuser${Date.now()}`,
  major: '商船學系'
};

const testReward = {
  name: 'Test Free Reward',
  description: 'This is a free reward for testing',
  type: 'physical',
  pointsRequired: 0,
  quantity: 10
};

let token = '';
let rewardId = '';

async function registerUser() {
  try {
    await axios.post(`${API_USER}/register`, testUser);
    console.log('Registered test user');
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('User already exists, skipping registration');
    } else {
      throw err;
    }
  }
}

async function loginUser() {
  const res = await axios.post(`${API_AUTH}/login`, {
    walletId: testUser.walletId
  });
  token = res.data.token;
  console.log('Logged in, token acquired');
}

async function createReward() {
  console.log('Sending reward:', testReward);

  const res = await axios.post(`${API_REWARD}`, testReward, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  rewardId = res.data.reward._id;
  console.log('Reward created:', rewardId);
}

async function redeemReward() {
  const res = await axios.post(`${API_REWARD}/${rewardId}/redeem`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  console.log('Reward redeemed and email sent:', res.data.message);
}

(async () => {
  try {
    console.log('Starting full redemption flow test...');
    await registerUser();
    await loginUser();
    await createReward();
    await redeemReward();
    console.log('All steps completed successfully');
  } catch (err) {
    console.error('Test failed:', err.response?.data?.message || err.message);
  }
})();