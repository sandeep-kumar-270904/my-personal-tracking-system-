import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const SeasonSummaryCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seasonSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/season-summary');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl border border-white/5 bg-[#13141f]"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="font-bold text-white text-lg">Season Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Success Rate */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-widest">Success Rate</span>
          </div>
          <div className="text-2xl font-black text-white">{data.successRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Offers / Total Interviews</div>
        </div>

        {/* Avg Time to Offer */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-widest">Avg Time to Offer</span>
          </div>
          <div className="text-2xl font-black text-white">{data.avgTimeToOfferDays}</div>
          <div className="text-xs text-slate-500 mt-1">Days from apply to offer</div>
        </div>

        {/* Total Companies */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">Companies</div>
          <div className="text-2xl font-black text-white">{data.totalCompaniesApplied}</div>
          <div className="text-xs text-slate-500 mt-1">Applied this season</div>
        </div>

        {/* Most Common Rejection */}
        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
          <div className="flex items-center gap-2 text-red-400/80 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-widest">Bottleneck</span>
          </div>
          <div className="text-sm font-bold text-red-300 mt-2 truncate">
            {data.mostCommonRejectionStage}
          </div>
          <div className="text-[10px] text-red-400/60 mt-1 uppercase tracking-wider">Common Rejection Stage</div>
        </div>
      </div>
    </motion.div>
  );
};

export default SeasonSummaryCard;
