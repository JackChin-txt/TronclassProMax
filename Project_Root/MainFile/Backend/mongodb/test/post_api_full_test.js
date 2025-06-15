const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const user = {
  username: 'postApiTester',
  email: 'postapitest@example.com',
  walletId: '0xPOSTAPITEST123'
};

const newPost = {
  title: 'Full Test: Create Post',
  content: 'This post is created as part of full CRUD test.',
  tags: ['crud', 'test']
};

const updatedPost = {
  title: 'Full Test: Updated Title',
  content: 'This content has been updated successfully.',
  tags: ['updated', 'api']
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
  const res = await axios.post(`${BASE_URL}/api/posts`, newPost, {
    headers: { Authorization: `Bearer ${token}` }
  });
  postId = res.data.post._id;
  console.log('Post created:', postId);
}

async function getAllPosts() {
  const res = await axios.get(`${BASE_URL}/api/posts`);
  console.log(`Fetched ${res.data.length} post(s).`);
}

async function getPostById() {
  const res = await axios.get(`${BASE_URL}/api/posts/${postId}`);
  console.log('Fetched single post:', res.data.title);
}

async function updatePost() {
  const res = await axios.put(`${BASE_URL}/api/posts/${postId}`, updatedPost, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Post updated:', res.data.post.title);
}

async function deletePost() {
  const res = await axios.delete(`${BASE_URL}/api/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Post deleted:', res.data.message);
}

(async () => {
  try {
    console.log('Running full Post API CRUD test...\n');
    await registerUser();
    await loginUser();
    await createPost();
    await getAllPosts();
    await getPostById();
    await updatePost();
    await deletePost();
    console.log('\nAll Post API CRUD operations completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();