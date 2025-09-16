const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試用使用者
const user = {
  username: 'pointTester',
  email: 'pointtester@example.com',
  walletId: '0xPOINT123456789',
  role: 'student',
  major: "商船學系"
};

let token = '';

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
    walletId: user.walletId
  });
  token = res.data.token;
  console.log('Logged in as:', res.data.username);
}

async function getMyProfile() {
  const res = await axios.get(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('My profile:', res.data);
}

async function getMyName() {
  const res = await axios.get(`${BASE_URL}/api/users/me/name`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('My name:', res.data.username);
}

async function getMyPoints() {
  const res = await axios.get(`${BASE_URL}/api/users/me/points`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('My points:', res.data.points);
}

(async () => {
  try {
    console.log('Running User API test...');
    await registerUser();
    await loginUser();
    await getMyProfile();
    await getMyName();
    await getMyPoints();

    console.log('\nAll User API operations completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();
