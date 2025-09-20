const { Post } = require('../models');
// 創建貼文，接收標題，內文，標籤，回傳完整post
async function createPost(req, res) {
  const { title, content, tags } = req.body;

  try {
    const post = await Post.create({
      author: req.user.userId,
      title,
      content,
      tags,
    });

    res.status(201).json({ message: 'Post created', post });
  } catch (err) {
    console.error('Create post error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getAllPosts(req, res) {
  try {
    const posts = await Post.find().populate('author', 'username');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
}

async function updatePost(req, res) {
  const { id } = req.params;
  const { title, content, tags } = req.body;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 驗證是否為作者本人
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not the author of this post' });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;

    await post.save();

    res.status(200).json({ message: 'Post updated', post });
  } catch (err) {
    console.error('Update post error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// 查詢單篇貼文
async function getPostById(req, res) {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).populate('author', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (err) {
    console.error('Get post by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// 刪除貼文（僅限作者）
async function deletePost(req, res) {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not the author of this post' });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  deletePost
};