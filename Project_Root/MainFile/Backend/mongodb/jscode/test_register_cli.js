const mongoose = require('mongoose');
const readline = require('readline');
const { User } = require('../models');

// Connect to MongoDB
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
        const username = await question('Username: ');
        const password = await question('Password: ');
        const email = await question('Email: ');

        if (!username || !password || !email) {
            console.log('Please fill in all fields');
            rl.close();
            await mongoose.disconnect();
            return;
        }

        const newUser = await User.create({ username, password, email });
        console.log('✅ User created successfully. User ID:', newUser._id);
    } catch (error) {
        console.error('Error creating user:', error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

main();
