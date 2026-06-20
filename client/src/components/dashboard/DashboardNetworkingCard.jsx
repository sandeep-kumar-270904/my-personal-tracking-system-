import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, ChevronDown, ChevronUp, Link as LinkIcon, Briefcase, Mail, MessageSquare, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AnimatedCounter from '../AnimatedCounter';

const fetchNetworkingStats = async () => {
  const res = await api.get('/networking/stats');
  return res.data;
};

const DashboardNetworkingCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['networking', 'stats'],
    queryFn: fetchNetworkingStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stats = data?.data || {};
  const totalContacts = stats.totalContacts || 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`glass-card rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 border-t-4 border-indigo-500/50 relative overflow-hidden group ${isExpanded ? 'col-span-2 md:col-span-3 lg:col-span-full' : ''}`}
    >
      <div className="absolute -right-10 -top-10 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-2xl bg-indigo-500" />
      
      <div 
        className="p-5 flex flex-col gap-3 relative z-10 h-full cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20">
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <button className="text-slate-400 hover:text-white transition-colors p-1 bg-white/5 rounded-md">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
            <AnimatedCounter value={totalContacts} />
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Networking</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-5 text-slate-400 text-sm">Loading networking data...</div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Companies</p>
                    <p className="text-lg font-bold text-white">{stats.companiesCovered || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Outreach</p>
                    <p className="text-lg font-bold text-white">{stats.weeklyGoals?.outreachCompleted || 0} <span className="text-sm text-slate-500">/ {stats.weeklyGoals?.outreachTarget || 10}</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Response Rate</p>
                    <p className={`text-lg font-bold ${stats.responseRate >= 30 ? 'text-emerald-400' : stats.responseRate >= 15 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {stats.responseRate || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Referrals</p>
                    <p className="text-lg font-bold text-white">{stats.activeReferrals || 0}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/networking" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1.5 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg">
                    View full networking <LinkIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardNetworkingCard;
