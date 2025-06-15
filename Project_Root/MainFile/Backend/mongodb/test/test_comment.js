const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ3YzllYWE5NGU3YWFhOTgxMzM5ZjgiLCJ3YWxsZXRJZCI6IjB4REVGOTg3NjU0MzIxIiwiaWF0IjoxNzQ5NTM1MjI4LCJleHAiOjE3NDk1Mzg4Mjh9.htiNqiDNzEB21S5NJtwkEySN4swd8Mtu3D1iTXdF39U';
const postId = '6847ca3ea94e7aaa981339fb';   //  從 get_posts 複製

axios.post('http://localhost:3000/api/comments', {
  postId: postId,
  content: 'This is a test comment.',
  cutoffTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 截止時間設為明天
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(res => {
  console.log('Comment added:', res.data);
})
.catch(err => {
  if (err.response) {
    console.error('API Error:', err.response.status, err.response.data);
  } else {
    console.error('Request failed:', err.message);
  }
});
