const mongoose = require('mongoose');
const readline = require('readline');
const { User } = require('../models');

// 連線到 MongoDB
const uri = "mongodb+srv://raysu5195:ltjNcj3e6ZBbhFvp@dbtest.adprosl.mongodb.net/myDatabase";

async function main() {
    await mongoose.connect(uri)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    try {
        const username = await question('username: ');
        const password = await question('password: ');
        const email = await question('email: ');

        if (!username || !password || !email) {
            console.log('請確實填寫所有欄位');
            rl.close();
            await mongoose.disconnect();
            return;
        }

        const newUser = await User.create({ username, password, email });
        console.log('使用者建立成功<，>User ID:', newUser._id);
    } catch (error) {
        console.error('建立使用者時發生錯誤:', error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
        console.log('已關閉資料庫連線');
    }
}

main();
