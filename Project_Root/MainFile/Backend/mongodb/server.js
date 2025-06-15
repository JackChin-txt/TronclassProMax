const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// 載入環境變數
dotenv.config();

// 建立 Express 應用
const app = express();
const PORT = process.env.PORT || 3000;

// 連接 MongoDB
connectDB();

// 解析 JSON 請求
app.use(express.json());

// 掛載模組化路由
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/comments', require('./routes/comment.routes'));
app.use('/api/rewards', require('./routes/reward.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// 全域錯誤處理
app.use(errorHandler);

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`[Server is running at http://localhost:${PORT}]`);
});
