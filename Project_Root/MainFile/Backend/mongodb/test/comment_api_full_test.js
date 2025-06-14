const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const user = {
  username: 'commentTester',
  email: 'commenttester@example.com',
  walletId: '0xCOMMENT123456789'
};

const postData = {
  title: 'Comment Test Post',
  content: 'A post used for testing comments.',
  tags: ['comment', 'test']
};

let token = '';
let postId = '';

async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('User already exists, skipping registration.');
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

async function createPost() {
  const res = await axios.post(`${BASE_URL}/api/posts`, postData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  postId = res.data.post._id;
  console.log('Post created:', postId);
}

async function addComment() {
  const res = await axios.post(`${BASE_URL}/api/comments`, {
    postId: postId,
    content: 'This is a test comment full test script.',
    cutoffTime: new Date(Date.now() + 86400000) // +1 day
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Comment added:', res.data.comment.content);
}

(async () => {
  try {
    console.log('Running Comment API test...\n');
    await registerUser();
    await loginUser();
    await createPost();
    await addComment();
    console.log('\nComment API test completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();