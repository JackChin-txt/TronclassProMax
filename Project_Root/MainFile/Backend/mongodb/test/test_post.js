const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ3YzllYWE5NGU3YWFhOTgxMzM5ZjgiLCJ3YWxsZXRJZCI6IjB4REVGOTg3NjU0MzIxIiwiaWF0IjoxNzQ5NTM1MjI4LCJleHAiOjE3NDk1Mzg4Mjh9.htiNqiDNzEB21S5NJtwkEySN4swd8Mtu3D1iTXdF39U';

axios.post('http://localhost:3000/api/posts', {
  title: 'My First Post',
  content: 'This is my first post created after login.',
  tags: ['test', 'example']
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(res => {
  console.log('Post created:', res.data);
})
.catch(err => {
  if (err.response) {
    console.error('API Error:', err.response.status, err.response.data);
  } else {
    console.error('Request failed:', err.message);
  }
});
