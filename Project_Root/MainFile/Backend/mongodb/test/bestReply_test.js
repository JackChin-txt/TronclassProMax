const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試用使用者
const user = {
  username: 'commentTester',
  email: 'commenttester@example.com',
  walletId: '0xCOMMENT123456789',
  role: 'mentor',
  major: "商船學系"
};

let token = '';
let postId = '';
let commentId = '';

// 註冊使用者
async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log(' Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ User already exists, skipping registration.');
    } else {
      throw err;
    }
  }
}

// 登入使用者
async function loginUser() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    walletId: user.walletId,
    points: 100
  });
  token = res.data.token;
  console.log(' Logged in as:', res.data.username);
}

// 建立文章
async function createPost() {
  const postData = {
    title: 'Test Post',
    content: 'This is a test post for Comment API',
    tags: ['test', 'comment']
  };

  const res = await axios.post(`${BASE_URL}/api/posts`, postData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  postId = res.data.post._id;
  console.log(' Post created:', postId);
}

// 新增留言
async function addComment() {
  const commentData = {
    postId,
    content: 'This is a test comment',
    cutoffTime: new Date()
  };

  const res = await axios.post(`${BASE_URL}/api/comments`, commentData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  commentId = res.data.comment._id;
  console.log(` Comment added: ${commentId}, replyId: ${res.data.comment.replyId}`);
}

// 設為最佳留言
async function setBestComment() {
  const res = await axios.put(`${BASE_URL}/api/comments/${commentId}/best`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(' Comment set as best reply:', res.data);
}

// 取得文章所有留言
async function getComments() {
  const res = await axios.get(`${BASE_URL}/api/comments/post/${postId}`);
  console.log(` Comments for post ${postId}:`);
  res.data.forEach(c => {
    console.log(`- [${c.replyId}] ${c.content} (bestReply: ${c.bestReply})`);
  });
}

// 執行測試流程
(async () => {
  try {
    console.log(' Running Comment API test with existing post...');
    await registerUser();
    await loginUser();
    await createPost();
    await addComment();
    await setBestComment();
    await getComments();
    console.log('\n Comment API test completed successfully.');
  } catch (err) {
    console.error(' Test failed:', err.response?.data || err.message);
  }
})();
