const { User } = require('../../models');
const jwt = require('jsonwebtoken');

async function loginUser(req, res) {
    const { walletId } = req.body;

    try {
        if (!walletId) {
            return res.status(400).json({ message: 'need walletId' });
        }

        const user = await User.findOne({ walletId });
        if (!user) {
            return res.status(404).json({ message: 'wallet has not been registered' });
        }

        const token = jwt.sign(
            { userId: user._id, walletId: user.walletId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'login successful', token, username: user.username });
    } catch (error) {
        console.error('login failed:', error.message);
        res.status(500).json({ message: 'server error' });
    }
}

module.exports = loginUser;