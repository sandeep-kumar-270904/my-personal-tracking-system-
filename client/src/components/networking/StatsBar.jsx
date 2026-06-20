import React from 'react';
import { motion } from 'framer-motion';

const StatsBar = ({ stats }) => {
  if (!stats) return null;

  const { totalContacts, companiesCovered, avgResponseRate, strongConnections, referralsReceived, weeklyGoalProgress } = stats;

  const getResponseRateColor = (rate) => {
    if (rate >= 40) return 'text-green-400';
    if (rate >= 20) return 'text-amber-400';
    return 'text-red-400';
  };

  const outreachProgress = weeklyGoalProgress ? `${weeklyGoalProgress.outreachCompleted} / ${weeklyGoalProgress.outreachTarget}` : '0 / 0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-[#13141f] border border-white/5 p-4 rounded-xl shadow-inner mb-6">
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Contacts</span>
        <span className="text-2xl font-bold text-white mt-1">{totalContacts || 0}</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Companies</span>
        <span className="text-2xl font-bold text-white mt-1">{companiesCovered || 0}</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Response Rate</span>
        <span className={`text-2xl font-bold mt-1 ${getResponseRateColor(avgResponseRate)}`}>
          {avgResponseRate ? avgResponseRate.toFixed(1) : 0}%
        </span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Strong Ties</span>
        <span className="text-2xl font-bold text-emerald-400 mt-1">{strongConnections || 0}</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Referrals</span>
        <span className="text-2xl font-bold text-[#ff6b00] mt-1">{referralsReceived || 0}</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 border-r border-white/5 last:border-0">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold text-center">Weekly Outreach</span>
        <span className="text-2xl font-bold text-blue-400 mt-1">{outreachProgress}</span>
      </div>
    </div>
  );
};

export default StatsBar;
