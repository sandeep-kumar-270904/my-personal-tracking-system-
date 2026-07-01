import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Heart, CornerDownRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResourceComments = ({ resourceId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['resourceComments', resourceId],
    queryFn: async () => {
      const { data } = await api.get(`/discussion/resource/${resourceId}`);
      return data;
    }
  });

  const postCommentMutation = useMutation({
    mutationFn: async ({ content, parentComment }) => {
      const { data } = await api.post(`/discussion/resource/${resourceId}`, { content, parentComment });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceComments', resourceId] });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Comment posted!');
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }) => {
      if (isLiked) {
        await api.delete(`/discussion/${commentId}/like`);
      } else {
        await api.post(`/discussion/${commentId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceComments', resourceId] });
    }
  });

  const handleSubmit = (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    postCommentMutation.mutate({ content, parentComment: parentId });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500">Loading discussion...</div>;
  }

  const renderComment = (comment, isReply = false) => (
    <div key={comment._id} className={`flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mt-6'}`}>
      <Link to={`/network/student/${comment.author._id}`} className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
          {comment.author.name.charAt(0).toUpperCase()}
        </div>
      </Link>
      
      <div className="flex-1">
        <div className="bg-[#1a1b26] p-4 rounded-2xl rounded-tl-none border border-white/5 relative group">
          <div className="flex justify-between items-start mb-1">
            <Link to={`/network/student/${comment.author._id}`} className="font-bold text-white hover:underline">
              {comment.author.name}
            </Link>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-4 mt-3">
            <button 
              onClick={() => toggleLikeMutation.mutate({ commentId: comment._id, isLiked: comment.userLiked })}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.userLiked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
            >
              <Heart className={`w-4 h-4 ${comment.userLiked ? 'fill-current' : ''}`} />
              {comment.likesCount || 0}
            </button>
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors"
              >
                <CornerDownRight className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {replyingTo === comment._id && (
          <form onSubmit={(e) => handleSubmit(e, comment._id)} className="mt-4 flex gap-3 ml-4">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-[#13141f] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
            <button 
              type="submit" 
              disabled={!replyContent.trim() || postCommentMutation.isPending}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Reply
            </button>
          </form>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="border-t border-white/10 pt-8 mt-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        Discussion ({comments.length})
      </h3>

      <form onSubmit={(e) => handleSubmit(e)} className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1a1b26] border border-white/5 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts or ask a question about this resource..."
            className="w-full bg-[#1a1b26] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none h-24 custom-scrollbar"
          />
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={!newComment.trim() || postCommentMutation.isPending}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {postCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-6 mt-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No comments yet. Be the first to start the discussion!
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default ResourceComments;
