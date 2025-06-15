const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ3YzllYWE5NGU3YWFhOTgxMzM5ZjgiLCJ3YWxsZXRJZCI6IjB4REVGOTg3NjU0MzIxIiwiaWF0IjoxNzQ5NTM1MjI4LCJleHAiOjE3NDk1Mzg4Mjh9.htiNqiDNzEB21S5NJtwkEySN4swd8Mtu3D1iTXdF39U';
const postId = '6847cacda94e7aaa981339fd';

axios.delete(`http://localhost:3000/api/posts/${postId}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(res => {
  console.log('✅ Post deleted:', res.data.message);
})
.catch(err => {
  console.error('❌ Delete failed:', err.response?.data || err.message);
});
