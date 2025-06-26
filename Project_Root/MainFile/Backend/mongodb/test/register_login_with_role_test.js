
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const user = {
  username: 'roleTestUser',
  email: 'roletest@example.com',
  walletId: '0xROLETEST123',
  role: 'mentor' // or 'student'
};

let token = '';

async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('✅ Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ️ User already exists, skipping registration.');
    } else {
      console.error('❌ Registration failed:', err.response?.data || err.message);
      return;
    }
  }
}

async function loginUser() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    walletId: user.walletId
  });
  token = res.data.token;
  console.log('✅ Logged in:', res.data.username);
  console.log('🎓 Role:', res.data.role || '(not returned)');
}

(async () => {
  try {
    console.log('🚀 Testing register + login with role...');
    await registerUser();
    await loginUser();
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
})();
