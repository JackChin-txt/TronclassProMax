const axios = require('axios');

axios.post('http://localhost:3000/api/users/register', {
  username: 'testuser2',
  email: 'test2@example.com',
  walletId: '0xDEF987654321'
})
.then(res => console.log('Registered:', res.data))
.catch(err => console.error('Error:', err.response.data));
