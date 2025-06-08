const { User } = require('../../models');
const bcrypt = require('bcrypt');

async function registerUser({ username, email, walletId }) {
    if (!username || !email || !walletId) {
        throw new Error('Missing required fields');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }, { walletId }] });
    if (existingUser){
        if (existingUser.username === username) {
            return res.status(409).json({ message: 'username has been used' });
        } else if (existingUser.email === email) {
            return res.status(409).json({ message: 'email has been used' });
        } else if( existingUser.walletId === walletId){
            return res.status(409).json({ message: 'wallet has been used' });
        }
    }
    const newUser = await User.create({ username, email, walletId });
    return newUser;
}

module.exports = registerUser;
