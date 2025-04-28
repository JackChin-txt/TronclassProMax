const { User } = require('../../models');
const bcrypt = require('bcrypt');

async function registerUser({ username, email, password }) {
    if (!username || !email || !password) {
        throw new Error('缺少必要欄位');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new Error('帳號或Email已被註冊');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({ username, email, password: hashedPassword });
    return newUser;
}

module.exports = { registerUser };