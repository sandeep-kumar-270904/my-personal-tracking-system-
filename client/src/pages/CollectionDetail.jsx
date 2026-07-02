import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from "../services/api";
import { ArrowLeft, Play, CheckCircle2, Share2, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collections', id],
    queryFn: async () => {
      const res = await api.get(`/collections/${id}`);
      return res.data;
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async () => await api.post(`/collections/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', id] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (resourceId) => await api.post(`/resources/${resourceId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', id] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
    }
  });

  if (isLoading) {
    return <div className="p-8 w-full max-w-4xl mx-auto flex items-center justify-center h-screen text-slate-400">Loading collection...</div>;
  }

  if (!collection) {
    return <div className="p-8 text-center text-white">Collection not found.</div>;
  }

  const completedCount = collection.items.filter(item => item.hasCompleted).length;
  const totalCount = collection.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextIncomplete = collection.items.find(item => !item.hasCompleted);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Collection link copied to clipboard!');
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pb-10">
      <button onClick={() => navigate('/resources')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </button>

      <div className="bg-[#13141f] border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">{collection.name}</h1>
            <p className="text-xl text-slate-400 mb-6 font-medium">{collection.tagline}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><BookOpen className="w-4 h-4 text-indigo-400"/> {totalCount} Resources</span>
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Clock className="w-4 h-4 text-emerald-400"/> {collection.estimatedTime}</span>
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Users className="w-4 h-4 text-blue-400"/> {collection.enrolledCount} Enrolled</span>
            </div>
          </div>
          
          <div className="flex flex-col items-stretch md:items-end gap-3 min-w-[200px]">
            {!collection.isEnrolled ? (
              <button 
                onClick={() => enrollMutation.mutate()}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all border border-indigo-400/50 flex items-center justify-center gap-2"
              >
                Enroll to Start
              </button>
            ) : progress === 100 ? (
              <div className="w-full py-3 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Collection Completed!
              </div>
            ) : nextIncomplete ? (
              <a 
                href={nextIncomplete.resourceId?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all border border-emerald-400/50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Continue Step {nextIncomplete.order}
              </a>
            ) : null}
            <button onClick={handleShare} className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Share Collection
            </button>
          </div>
        </div>

        {collection.isEnrolled && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-slate-300">Your Progress</span>
              <span className="text-emerald-400">{completedCount} of {totalCount} ({progress}%)</span>
            </div>
            <div className="w-full h-3 bg-[#0f1015] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Timeline connector line */}
        <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-white/10 z-0"></div>

        <div className="space-y-6 relative z-10">
          {collection.items.map((item, idx) => {
            const isCompleted = item.hasCompleted;
            const res = item.resourceId;
            if (!res) return null; // Defensive check
            
            return (
              <div key={item._id} className="flex gap-6">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-4 border-[#0f1015] z-10 transition-colors ${
                    isCompleted ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                    collection.isEnrolled && nextIncomplete?._id === item._id ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 
                    'bg-[#1a1b26] text-slate-500 border-white/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : item.order}
                  </div>
                </div>

                <div className={`flex-1 glass-card p-6 rounded-2xl border transition-all ${
                    isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 
                    collection.isEnrolled && nextIncomplete?._id === item._id ? 'border-indigo-500/50 bg-indigo-500/5' : 
                    'border-white/5 hover:border-white/10'
                }`}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white/5 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
                          {res.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          res.difficulty === 'Beginner' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 
                          res.difficulty === 'Advanced' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 
                          'bg-[#eab308]/20 text-[#eab308]'
                        }`}>
                          {res.difficulty}
                        </span>
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isCompleted ? 'text-slate-300 line-through decoration-slate-500/50' : 'text-white'}`}>{res.title}</h3>
                      <p className={`text-sm line-clamp-2 ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>{res.description}</p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <a 
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-lg text-sm border border-blue-500/20 flex items-center justify-center gap-2 transition-colors"
                      >
                        Open Resource <ArrowRight className="w-4 h-4" />
                      </a>
                      {collection.isEnrolled && (
                        <button 
                          onClick={() => completeMutation.mutate(res._id)}
                          className={`px-4 py-2 font-bold rounded-lg text-sm border transition-colors flex items-center justify-center gap-2 ${
                            isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-[#1a1b26] text-slate-300 border-white/10 hover:border-emerald-500/50 hover:text-emerald-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetail;
