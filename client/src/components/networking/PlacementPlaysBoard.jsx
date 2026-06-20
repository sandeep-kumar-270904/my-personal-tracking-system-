import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Star, Copy, ExternalLink, ThumbsUp, Flame, Users, Search, PlayCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PlacementPlaysBoard = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['networking-plays'],
    queryFn: async () => {
      const res = await api.get('/networking/plays');
      return res.data;
    }
  });

  const { data: savedPlays = [] } = useQuery({
    queryKey: ['saved-plays'],
    queryFn: async () => {
      const res = await api.get('/networking/plays/saved');
      return res.data;
    }
  });

  const savePlayMutation = useMutation({
    mutationFn: (playId) => api.post(`/networking/plays/${playId}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-plays']);
      toast.success('Play saved to your library');
    }
  });

  const usePlayMutation = useMutation({
    mutationFn: (playId) => api.post(`/networking/plays/${playId}/use`),
    onSuccess: () => {
      queryClient.invalidateQueries(['networking-plays']);
    }
  });

  const isSaved = (playId) => savedPlays.some(sp => sp.playId._id === playId);

  const filteredPlays = plays.filter(play => {
    const matchesSearch = play.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          play.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || play.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading library...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <BookOpen className="text-purple-400" />
          Placement Plays Board
        </h2>
        <p className="text-slate-300 max-w-2xl text-sm mb-6">
          A living library of high-leverage networking moves. Don't just send generic messages. Run proven plays sourced from successful alumni and community members.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search for plays (e.g., 'Group Chat', 'Ghosted')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors md:w-48"
          >
            <option value="ALL">All Categories</option>
            <option value="COLD_OUTREACH">Cold Outreach</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="REFERRAL">Referral Request</option>
            <option value="INTERVIEW_PREP">Interview Prep</option>
            <option value="ALUMNI">Alumni Specific</option>
            <option value="COMMUNITY">Community / Events</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPlays.map(play => (
          <motion.div 
            key={play._id}
            whileHover={{ y: -4 }}
            className="bg-[#13141f] border border-white/5 hover:border-white/20 rounded-2xl p-5 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  play.effectivenessScore > 80 ? 'bg-[#ff6b00]/20 text-[#ff6b00]' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {play.category.replace('_', ' ')}
                </span>
                {play.isCommunitySourced && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Users size={10} /> Community
                  </span>
                )}
              </div>
              <button 
                onClick={() => savePlayMutation.mutate(play._id)}
                disabled={isSaved(play._id)}
                className={`p-1.5 rounded-full transition-colors ${isSaved(play._id) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                title={isSaved(play._id) ? "Saved" : "Save Play"}
              >
                <Star size={16} className={isSaved(play._id) ? 'fill-current' : ''} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{play.title}</h3>
            <p className="text-sm text-slate-300 mb-4 flex-1">{play.description}</p>

            <div className="bg-[#0a0a0f] rounded-lg p-4 border border-white/5 mb-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {play.template}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><PlayCircle size={14} /> {play.usageCount} uses</span>
                <span className="flex items-center gap-1"><Flame size={14} className="text-[#ff6b00]" /> {play.effectivenessScore}% success</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(play.template);
                    toast.success('Template copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 border border-white/10"
                >
                  <Copy size={14} /> Copy
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(play.template);
                    usePlayMutation.mutate(play._id);
                    toast.success('Play activated!');
                  }}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded transition-colors flex items-center gap-1 border border-purple-500/30"
                >
                  Run Play
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlacementPlaysBoard;
