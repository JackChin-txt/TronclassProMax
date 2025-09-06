
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
let commentId = '';

async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('✅ Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ️ User already exists, skipping registration.');
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
  console.log('✅ Logged in as:', res.data.username);
}

async function createPost() {
  const res = await axios.post(`${BASE_URL}/api/posts`, postData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  postId = res.data.post._id;
  console.log('✅ Post created:', postId);
}

async function addComment() {
  const res = await axios.post(`${BASE_URL}/api/comments`, {
    postId: postId,
    content: 'This is a test comment full test script.',
    cutoffTime: new Date(Date.now() + 86400000) // +1 day
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  commentId = res.data.comment._id;
  console.log('✅ Comment added:', commentId);
}

async function getCommentsForPost() {
  const res = await axios.get(`${BASE_URL}/api/comments/post/${postId}`);
  console.log(`✅ Retrieved ${res.data.length} comment(s).`);
}

async function likeComment() {
  const res = await axios.put(`${BASE_URL}/api/comments/${commentId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Like toggled, total likes:', res.data.likes);
}

async function updateComment() {
  const res = await axios.put(`${BASE_URL}/api/comments/${commentId}`, {
    content: 'This comment has been updated.'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Comment updated:', res.data.comment.content);
}

async function deleteComment() {
  const res = await axios.delete(`${BASE_URL}/api/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Comment deleted:', res.data.message);
}

(async () => {
  try {
    console.log('🚀 Running full Comment API CRUD test...');
    await registerUser();
    await loginUser();
    await createPost();
    await addComment();
    await getCommentsForPost();
    await likeComment();
    await updateComment();
    await deleteComment();
    console.log('\n✅ All Comment API operations completed successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
})();
