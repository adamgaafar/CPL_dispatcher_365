const prisma = require('../config/database');
n
const notify = async (receiverId, type, title, message, data = null) => {
  try {
    await prisma.notification.create({
      data: { receiverId, type, title, message, data: data ? JSON.stringify(data) : null }
    });
  } catch (e) { console.error('Notification error:', e); }
};


exports.createPost = async (req, res) => {
  try {
    const { content, images, postType, category } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await prisma.communityPost.create({
      data: {
        authorId: req.user.id,
        content: content.trim(),
        images: images ? JSON.stringify(images) : null,
        postType: postType || 'general',
        category: category || 'general'
      },
      include: {
        author: { select: { id: true, fullName: true, profileImage: true } }
      }
    });

    res.status(201).json({
      success: true,
      data: { ...post, images: post.images ? JSON.parse(post.images) : [] }
    });

  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ success: false, message: 'Error creating post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, postType, category, sortBy = 'latest', search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (postType) where.postType = postType;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { contains: search, mode: 'insensitive' },
        { contains: search, mode: 'insensitive' }
      ];
    }

    const orderBy = {
      latest: { createdAt: 'desc' },
      popular: { likesCount: 'desc' },
      discussed: { commentsCount: 'desc' }
    }[sortBy] || { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where, skip, take: parseInt(limit), orderBy,
        include: {
          author: { select: { id: true, fullName: true, profileImage: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.communityPost.count({ where })
    ]);

    // Increment views
    posts.forEach(p => {
      prisma.communityPost.update({ where: { id: p.id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});
    });

    res.json({
      success: true,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total },
      data: posts.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] }))
    });

  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching posts' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, fullName: true, profileImage: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, fullName: true, profileImage: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: { id: true, fullName: true, profileImage: true } } }
            }
          }
        },
        _count: { select: { likes: true, comments: true } }
      }
    });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    await prisma.communityPost.update({ where: { id: postId }, data: { viewsCount: { increment: 1 } } });

    res.json({
      success: true,
      data: { ...post, images: post.images ? JSON.parse(post.images) : [] }
    });

  } catch (error) {
    console.error('Get Post Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching post' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, images, postType, category } = req.body;

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        content: content?.trim() || undefined,
        images: images !== undefined ? JSON.stringify(images) : undefined,
        postType: postType || undefined,
        category: category || undefined
      },
      include: { author: { select: { id: true, fullName: true, profileImage: true } } }
    });

    res.json({ success: true, data: { ...updated, images: updated.images ? JSON.parse(updated.images) : [] } });

  } catch (error) {
    console.error('Update Post Error:', error);
    res.status(500).json({ success: false, message: 'Error updating post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.communityPost.delete({ where: { id: postId } });
    res.json({ success: true, message: 'Post deleted' });

  } catch (error) {
    console.error('Delete Post Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

// ============================================
// COMMENTS
// ============================================

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment required' });

    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, postId: true } });
      if (!parent || parent.postId !== postId) return res.status(400).json({ success: false, message: 'Invalid parent comment' });
    }

    const comment = await prisma.comment.create({
      data: { postId, authorId: req.user.id, content: content.trim(), parentId: parentId || null },
      include: { author: { select: { id: true, fullName: true, profileImage: true } } }
    });

    await prisma.communityPost.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });

    // Notify
    if (post.authorId !== req.user.id) {
      await notify(post.authorId, 'comment', 'New Comment', `${req.user.fullName} commented on your post`, { postId });
    }

    res.status(201).json({ success: true, data: comment });

  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment required' });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { author: { select: { id: true, fullName: true, profileImage: true } } }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    console.error('Update Comment Error:', error);
    res.status(500).json({ success: false, message: 'Error updating comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, authorId: true, postId: true } });
    
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.comment.delete({ where: { id: commentId } });
    
    // Count deleted (comment + replies)
    const totalDeleted = await prisma.comment.count({ where: { OR: [{ id: commentId }, { parentId: commentId }] } });
    await prisma.communityPost.update({ where: { id: comment.postId }, data: { commentsCount: { decrement: totalDeleted } } });

    res.json({ success: true, message: 'Comment deleted' });

  } catch (error) {
    console.error('Delete Comment Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
};

// ============================================
// LIKES
// ============================================

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
    
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      await prisma.communityPost.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
      return res.json({ success: true, liked: false, message: 'Unliked' });
    }

    await prisma.like.create({ data: { userId: req.user.id, postId } });
    await prisma.communityPost.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });

    if (post.authorId !== req.user.id) {
      await notify(post.authorId, 'like', 'New Like', `${req.user.fullName} liked your post`, { postId });
    }

    res.json({ success: true, liked: true, message: 'Liked!' });

  } catch (error) {
    console.error('Toggle Like Error:', error);
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
};

// ============================================
// SEARCH
// ============================================

exports.search = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q?.trim()) return res.status(400).json({ success: false, message: 'Search query required' });

    const searchTerm = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, users] = await Promise.all([
      prisma.communityPost.findMany({
        where: {
          OR: [
            { contains: searchTerm, mode: 'insensitive' },
            { contains: searchTerm, mode: 'insensitive' }
          ]
        },
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, profileImage: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { contains: searchTerm, mode: 'insensitive' },
            { contains: searchTerm, mode: 'insensitive' }
          ]
        },
        take: 5,
        select: { id: true, fullName: true, profileImage: true }
      })
    ]);

    res.json({
      success: true,
      query: searchTerm,
      data: {
        posts: posts.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] })),
        users
      }
    });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ success: false, message: 'Error searching' });
  }
};