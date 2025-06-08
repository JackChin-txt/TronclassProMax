const { Post } = require('../../models');

async function createPost(req, res) {
    const { title, content, tags } = req.body;

    try {
        const post = await Post.create({
            author: req.user.userId, // decode from authMiddleware
            title,
            content,
            tags,
        });

        res.status(201).json({ message: 'create post successful', post });
    } catch (err) {
        console.error('create post failed:', err.message);
        res.status(500).json({ message: 'server error' });
    }
}

module.exports = createPost;
