const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const user = {
  username: 'rewardTester',
  email: 'rewardtester@example.com',
  walletId: '0xREWARDUSER123'
};

const rewardItem = {
  name: 'Free dinner',
  description: 'Get dinner for free.',
  image: 'https://example.com/dinner.jpg',
  pointsRequired: 10,
  quantity: 5,
  userLimit: 1
};

let token = '';

async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('User already exists, skipping registration.');
    } else {
      throw err;
    }
  }
}

async function loginUser() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    walletId: user.walletId
  });
  token = res.data.token;
  console.log('Logged in as:', res.data.username);
}

async function createReward() {
  const res = await axios.post(`${BASE_URL}/api/rewards`, rewardItem, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Reward created:', res.data.reward.name);
}

(async () => {
  try {
    console.log('Running Reward API test...\n');
    await registerUser();
    await loginUser();
    await createReward();
    console.log('\nReward API test completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();