// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error('Uncaught error:', err.stack || err.message);
  
  // 預設錯誤代碼為 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    // 可以加上詳細錯誤資訊（開發用）
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
}

module.exports = errorHandler;