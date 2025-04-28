const express = require('express');
const mongoose = require('mongoose');
const { registerUser } = require('./controllers/registerUser');
const app = express();
const PORT = 3000;

const uri = "mongodb+srv://raysu5195:ltjNcj3e6ZBbhFvp@dbtest.adprosl.mongodb.net/myDatabase";

mongoose.connect(uri)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());

app.post('/api/register', async (req, res) => {
    try {
        const newUser = await registerUser(req.body);
        res.status(201).json({ message: '✅ 註冊成功', userId: newUser._id });
    } catch (error) {
        console.error('❌ 註冊失敗:', error.message);
        res.status(400).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:3000`);
});