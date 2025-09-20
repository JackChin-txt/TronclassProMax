const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試用使用者
const user = {
  username: 'rewardTester',
  email: 'rewardtester@example.com',
  walletId: '0xREWARD123456789',
  role: 'mentor',
  major: "商船學系"
};

let token = '';
let rewardId = '';

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
    points : 20
  });
  token = res.data.token;
  console.log('Logged in as:', res.data.username);
}

async function createReward() {
  const rewardData = {
    name: 'Test Reward',
    description: 'A reward for testing createReward API.',
    image: 'https://example.com/test-reward.png',
    type: 'physical',
    pointsRequired: 50,
    quantity: 10,
    userLimit: 2,
    provider: 'Reward Provider'
  };

  const res = await axios.post(`${BASE_URL}/api/rewards`, rewardData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  rewardId = res.data.reward._id;
  console.log('Reward created:', rewardId);
}

async function getRewards() {
  const res = await axios.get(`${BASE_URL}/api/rewards`, {
    params: { sortBy: 'pointsRequired', order: 'asc' } // 測試排序
  });

  console.log(`Retrieved ${res.data.length} reward(s):`);
  res.data.forEach((reward, index) => {
    console.log(` ${index + 1}. ${reward.name} - ${reward.pointsRequired} points (id: ${reward._id})`);
  });
}

async function getRewardById() {
  const res = await axios.get(`${BASE_URL}/api/rewards/${rewardId}`);
  console.log('Single reward retrieved:', res.data.name);
}

async function getMyRedemptions() {
  const res = await axios.get(`${BASE_URL}/api/rewards/my-redemptions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Retrieved ${res.data.length} redemption(s) for user.`);
}

(async () => {
  try {
    console.log('🚀 Running full Reward API test...');
    await registerUser();
    await loginUser();
    await createReward();
    await getRewards();
    await getRewardById();
    await getMyRedemptions();
    console.log('\n All Reward API operations completed successfully.');
  } catch (err) {
    console.error(' Test failed:', err.response?.data || err.message);
  }
})();
