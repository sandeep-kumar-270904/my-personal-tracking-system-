const ResourceComment = require('../models/ResourceComment');
const ResourceCommentLike = require('../models/ResourceCommentLike');

const getComments = async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Fetch top-level comments
    const comments = await ResourceComment.find({ resource: resourceId, parentComment: null })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 });

    // For each comment, fetch its replies
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
      const replies = await ResourceComment.find({ parentComment: comment._id })
        .populate('author', 'name profilePicture')
        .sort({ createdAt: 1 });
      
      const userLiked = await ResourceCommentLike.exists({ comment: comment._id, user: req.user._id });

      return {
        ...comment.toObject(),
        userLiked: !!userLiked,
        replies: await Promise.all(replies.map(async r => {
          const rLiked = await ResourceCommentLike.exists({ comment: r._id, user: req.user._id });
          return { ...r.toObject(), userLiked: !!rLiked };
        }))
      };
    }));

    res.status(200).json(commentsWithReplies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

const postComment = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { content, parentComment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await ResourceComment.create({
      resource: resourceId,
      author: req.user._id,
      content,
      parentComment: parentComment || null
    });

    const populatedComment = await ResourceComment.findById(comment._id).populate('author', 'name profilePicture');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error posting comment', error: error.message });
  }
};

const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const existingLike = await ResourceCommentLike.findOne({ comment: commentId, user: req.user._id });
    if (!existingLike) {
      await ResourceCommentLike.create({ comment: commentId, user: req.user._id });
      await ResourceComment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
    }
    res.status(200).json({ message: 'Comment liked' });
  } catch (error) {
    res.status(500).json({ message: 'Error liking comment', error: error.message });
  }
};

const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const existingLike = await ResourceCommentLike.findOneAndDelete({ comment: commentId, user: req.user._id });
    if (existingLike) {
      await ResourceComment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
    }
    res.status(200).json({ message: 'Comment unliked' });
  } catch (error) {
    res.status(500).json({ message: 'Error unliking comment', error: error.message });
  }
};

module.exports = {
  getComments,
  postComment,
  likeComment,
  unlikeComment
};
