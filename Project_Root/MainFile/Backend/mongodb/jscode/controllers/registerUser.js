const { User } = require('../../models');
const bcrypt = require('bcrypt');

async function registerUser({ username, email, password }) {
    if (!username || !email || !password) {
        throw new Error('Missing required fields');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new Error('Username or email already registered');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({ username, email, password: hashedPassword });
    return newUser;
}

module.exports = { registerUser };
