import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import api from '../../services/api';

const ResourceReviews = ({ resourceId }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['resources', resourceId, 'reviews'],
    queryFn: async () => {
      const res = await api.get(`/resources/${resourceId}/reviews`);
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/resources/${resourceId}/reviews`, { rating, comment });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', resourceId, 'reviews']);
      queryClient.invalidateQueries(['resources']); // Refresh overall stats
      setIsExpanded(false);
      setComment('');
      setRating(0);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) submitMutation.mutate();
  };

  const displayReviews = showAll ? reviews : reviews.slice(0, 5);

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              (hoverRating || ratingValue) >= star ? 'text-yellow-400' : 'text-slate-600'
            }`}
          >
            <Star className={`w-5 h-5 ${((hoverRating || ratingValue) >= star) ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <h3 className="text-lg font-bold text-white mb-4">What students say</h3>

      {!isExpanded ? (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full py-3 bg-[#1a1b26] border border-white/10 hover:border-white/20 text-slate-300 rounded-xl font-medium transition-colors mb-6 text-sm"
        >
          Write a Review
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#1a1b26] p-4 rounded-xl border border-white/10 mb-6">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rating</label>
            {renderStars(rating, true)}
          </div>
          <div className="mb-3 relative">
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              placeholder="Share what you found useful... (max 200 characters)"
              className="w-full bg-[#13141f] border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
            />
            <span className="absolute bottom-3 right-3 text-[10px] text-slate-500">
              {comment.length}/200
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={rating === 0 || submitMutation.isPending}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {submitMutation.isPending ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/4"></div>
                <div className="h-3 bg-white/5 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {displayReviews.map(review => (
            <div key={review.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                {review.user?.avatar ? (
                  <img src={review.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  review.user?.firstName?.charAt(0) || 'S'
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{review.user?.firstName || 'Student'}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mb-2 scale-75 origin-left">
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {reviews.length > 5 && !showAll && (
            <button 
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all {reviews.length} reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceReviews;
