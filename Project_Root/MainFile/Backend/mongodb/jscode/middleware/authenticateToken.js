/*--------------------------------------------------------------------
This file is for getting token, then decode it for userId and walletId
--------------------------------------------------------------------*/


const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    //HTTP form : Authorization: <type> <credentials>
    //Bearer is one of the types
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No authorization token provided' });
    }

    //get token
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'invalid or expired token' });
    }
}

module.exports = authenticateToken;
