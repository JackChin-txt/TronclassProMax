const axios = require('axios');

axios.get('http://localhost:3000/api/posts')
  .then(res => {
    console.log('Posts fetched:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Request failed:', err.message);
    }
  });
