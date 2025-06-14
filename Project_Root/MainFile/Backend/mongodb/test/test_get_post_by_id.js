const axios = require('axios');

const postId = '6847cacda94e7aaa981339fd';

axios.get(`http://localhost:3000/api/posts/${postId}`)
  .then(res => {
    console.log('Post fetched:', res.data);
  })
  .catch(err => {
    console.error('Fetch failed:', err.response?.data || err.message);
  });
