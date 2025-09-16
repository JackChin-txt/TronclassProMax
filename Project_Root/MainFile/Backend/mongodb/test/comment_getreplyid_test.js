const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試用使用者
const user = {
  username: 'commentTester',
  email: 'commenttester@example.com',
  walletId: '0xcomment123456789',
  role: 'student',
  major: "商船學系"
};

let token = '';
let testPostId = '';

//註冊使用者
 
async function registerUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users/register`, user);
    console.log('Registered:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ User already exists, skipping registration.');
    } else {
      throw err;
    }
  }
}

//登入使用者

async function loginUser() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    walletId: user.walletId
  });
  token = res.data.token;
  console.log('Logged in as:', res.data.username);
}

//建立一篇測試文章

async function getOrCreateTestPost() {
  // 先取得使用者文章
  const res = await axios.get(`${BASE_URL}/api/posts?author=${user.username}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.data.length > 0) {
    testPostId = res.data[0]._id;
    console.log('ℹ 使用現有文章，ID:', testPostId);
  } else {
    // 沒有文章就建立新文章
    const newPost = await axios.post(`${BASE_URL}/api/posts`, {
      title: '測試文章 - ' + Date.now(),
      content: '這是一篇自動建立的測試文章',
      tags: ['test', 'api']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testPostId = newPost.data.post._id;
    console.log('✅ 已建立測試文章，ID:', testPostId);
  }
}

//新增多個評論並檢查 replyId
 
async function addMultipleCommentsAndCheckReplyIds() {
  const commentsToAdd = [
    '這是第 1 個測試評論',
    '這是第 2 個測試評論',
    '這是第 3 個測試評論'
  ];

  for (let i = 0; i < commentsToAdd.length; i++) {
    const comment = {
      postId: testPostId,
      content: commentsToAdd[i],
      cutoffTime: new Date()
    };

    const res = await axios.post(`${BASE_URL}/api/comments`, comment, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const created = res.data.comment;
    console.log(`已建立評論 ${i + 1}:`, created.content);
    console.log(`replyId: ${created.replyId}`);

  }
}

//主程式
 
(async () => {
  try {
    console.log('Running API test...');
    await registerUser();
    await loginUser();
    await getOrCreateTestPost();
    await addMultipleCommentsAndCheckReplyIds();

    console.log('\nAll API operations completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
})();
