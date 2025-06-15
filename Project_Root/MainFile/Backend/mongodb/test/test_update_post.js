const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ3YzllYWE5NGU3YWFhOTgxMzM5ZjgiLCJ3YWxsZXRJZCI6IjB4REVGOTg3NjU0MzIxIiwiaWF0IjoxNzQ5NTM1MjI4LCJleHAiOjE3NDk1Mzg4Mjh9.htiNqiDNzEB21S5NJtwkEySN4swd8Mtu3D1iTXdF39U';
const postId = '6847ca3ea94e7aaa981339fb';    // 貼文 ID

const updatedPost = {
  title: 'Updated Post Title',
  content: 'This content has been updated by the author.',
  tags: ['updated', 'post']
};

axios.put(`http://localhost:3000/api/posts/${postId}`, updatedPost, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(res => {
  console.log('✅ Post updated:', res.data.post);
})
.catch(err => {
  if (err.response) {
    console.error('❌ API Error:', err.response.status, err.response.data);
  } else {
    console.error('❌ Request failed:', err.message);
  }
});
