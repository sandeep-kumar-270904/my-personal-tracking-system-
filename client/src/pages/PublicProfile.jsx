import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Briefcase, Code, Flame, Target, MapPin, GraduationCap, Building2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const fetchPublicProfile = async (username) => {
  const { data } = await api.get(`/public/profile/${username}`);
  return data.profile;
};

const PublicProfile = () => {
  const { username } = useParams();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => fetchPublicProfile(username),
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white flex-col gap-4">
        <Helmet><title>Profile Not Found</title></Helmet>
        <h1 className="text-3xl font-bold">Profile Not Found</h1>
        <p className="text-slate-400">This profile doesn't exist or is set to private.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 selection:bg-[#ff6b00]/30 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{profile.name}'s Placement Journey</title>
        <meta name="description" content={`Check out ${profile.name}'s placement journey and progress on StudentTracker.`} />
      </Helmet>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header Profile Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                {profile.college && (
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-[#ff6b00]"/> {profile.college}</span>
                )}
                {profile.branch && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400"/> {profile.branch}</span>
                )}
                {profile.gradYear && (
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-400"/> Class of {profile.gradYear}</span>
                )}
              </div>
            </div>
            {profile.isOpenToOpportunities && (
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Open to Opportunities
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.applicationsCount !== undefined && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-3xl font-black text-white">{profile.applicationsCount}</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Applications Sent</p>
            </motion.div>
          )}

          {profile.dsaProblemsSolved !== undefined && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-3xl font-black text-white">{profile.dsaProblemsSolved}</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">DSA Problems Solved</p>
            </motion.div>
          )}

          {profile.currentStreak !== undefined && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-red-500/5 to-transparent">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-white flex items-baseline gap-2">
                {profile.currentStreak} <span className="text-sm text-slate-400">Days</span>
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Current Solving Streak</p>
            </motion.div>
          )}
        </div>

        {/* Target Companies */}
        {profile.targetCompanies && profile.targetCompanies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 md:p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" /> Target Companies
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.targetCompanies.map((company, idx) => (
                <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium text-sm">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-slate-500 text-sm">Powered by <span className="font-bold text-white">StudentTracker</span></p>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicProfile;
