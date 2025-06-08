const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

require('dotenv').config({ path: '../.env' });

const registerUser = require('./controllers/registerUser');
const loginUser = require('./controllers/loginUser');
const authenticateToken = require('./middleware/authenticateToken');
const createPost = require('./controllers/createPost');

const app = express();
const PORT = 3000;

const uri = "mongodb+srv://raysu5195:ltjNcj3e6ZBbhFvp@dbtest.adprosl.mongodb.net/myDatabase";

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

/*---register api---*/
app.post('/api/register', async (req, res) => {
    try {
        const newUser = await registerUser(req.body);
        res.status(201).json({ message: 'Registration successful', userId: newUser._id });
    } catch (error) {
        console.error('Registration failed:', error.message);
        res.status(400).json({ message: error.message });
    }
});

/*---login api---*/
app.post('/api/login', loginUser);


/*---post api---*/
app.post('/api/post', authenticateToken, createPost);
//app.get('/api/post', getPost);


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



