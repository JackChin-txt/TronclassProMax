const axios = require('axios');

axios.post('http://localhost:3000/api/auth/login', {
  walletId: '0xDEF987654321'
})
.then(res => {
  console.log('Login successful:', res.data);
})
.catch(err => {
  if (err.response) {
    console.error('API Error:', err.response.status, err.response.data);
  } else {
    console.error('Request failed:', err.message);
  }
});