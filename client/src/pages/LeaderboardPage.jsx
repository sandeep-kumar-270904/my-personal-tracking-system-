import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Trophy, TrendingUp, TrendingDown, Users, Target, Code, Briefcase, Zap, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardBanner from '../components/dashboard/DashboardBanner';

export default function LeaderboardPage() {
  const { user, login } = useContext(AuthContext); // login updates user context if we pass new user object
  const queryClient = useQueryClient();

  const { data: benchmarks, isLoading, isError, error } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const res = await api.get('/benchmarks');
      return res.data;
    },
    retry: false,
    enabled: !!user?.benchmarkOptIn
  });

  const optInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put('/auth/profile', { benchmarkOptIn: true });
      return res.data;
    },
    onSuccess: (data) => {
      login(data);
      queryClient.invalidateQueries(['benchmarks']);
      toast.success('Successfully opted into peer benchmarking!');
    },
    onError: () => {
      toast.error('Failed to opt in. Please try again.');
    }
  });

  if (!user?.benchmarkOptIn) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Peer Benchmarking</h1>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 text-lg">
            See how your placement preparation stacks up against your classmates in the Class of {user?.gradYear || 'your cohort'}. 
            Compare your DSA progress, application volume, and interview conversion rates.
          </p>

          <div className="bg-slate-900/50 rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto border border-slate-700">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Privacy First
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <p><strong>100% Anonymous:</strong> Your name and specific companies are never shared. You are only represented as aggregated data.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <p><strong>Give to Get:</strong> You must opt-in and share your anonymous data to view the cohort averages.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <p><strong>Minimum Threshold:</strong> Cohort data is only visible if at least 20 students have opted in, ensuring true anonymity.</p>
              </li>
            </ul>
          </div>

          <button
            onClick={() => optInMutation.mutate()}
            disabled={optInMutation.isPending}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 mx-auto disabled:opacity-70"
          >
            {optInMutation.isPending ? 'Opting in...' : 'Opt-in & View Leaderboard'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-2xl mx-auto mt-10">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Not Enough Data Yet</h3>
        <p className="text-slate-300">
          {error?.response?.data?.message || 'Failed to load benchmarks. Check back later!'}
        </p>
      </div>
    );
  }

  const { userStats, cohortStats, deltas } = benchmarks;

  const StatCard = ({ title, userVal, avgVal, delta, icon: Icon, unit = '' }) => {
    const isPositive = delta >= 0;
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-slate-400 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{userVal}{unit}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4 flex justify-between items-center border border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500 mb-1">Cohort Average</p>
            <p className="text-sm font-semibold text-slate-300">{avgVal}{unit}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(delta)}{unit} {isPositive ? 'Above' : 'Below'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <DashboardBanner 
        title="Peer Benchmarking" 
        subtitle={`Comparing against ${cohortStats.totalUsersSampled} anonymous peers in the Class of ${cohortStats.year}`}
        icon={Trophy}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard 
            title="Applications (This Month)"
            userVal={userStats.applicationsThisMonth}
            avgVal={cohortStats.avgApplications}
            delta={deltas.applications}
            icon={Briefcase}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard 
            title="DSA Problems Solved"
            userVal={userStats.dsaSolved}
            avgVal={cohortStats.avgDSASolved}
            delta={deltas.dsaSolved}
            icon={Code}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard 
            title="Interview Conversion"
            userVal={userStats.interviewConversion}
            avgVal={cohortStats.avgInterviewConversion}
            delta={deltas.interviewConversion}
            icon={Target}
            unit="%"
          />
        </motion.div>
      </div>

      <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 flex items-start gap-4">
        <Zap className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-white font-medium mb-2">Insights Engine</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {deltas.applications < 0 ? "You're sending fewer applications than your peers this month. Try setting a weekly goal of 5 applications to keep your pipeline fresh. " : "Great job keeping your application pipeline full! "}
            {deltas.dsaSolved < 0 ? "Consider spending 30 minutes a day on LeetCode to catch up to the cohort average. " : "Your DSA prep is ahead of the curve! "}
            {deltas.interviewConversion < 0 ? "Your conversion rate is lower than average. Focus on mock interviews and behavioral prep to convert more interviews into offers." : "Your interview performance is strong. Keep refining your stories!"}
          </p>
        </div>
      </div>
    </div>
  );
}
