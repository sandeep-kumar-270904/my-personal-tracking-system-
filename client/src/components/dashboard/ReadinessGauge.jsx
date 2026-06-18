import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import api from '../../services/api';

const ReadinessGauge = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await api.get('/dashboard/readiness-score');
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch readiness score", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-center min-h-[220px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff6b00] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const score = data.score;
  let color = '#ef4444'; // Red
  let label = 'Getting Started';
  if (score > 30) { color = '#f59e0b'; label = 'Building Momentum'; } // Amber
  if (score > 60) { color = '#10b981'; label = 'Interview Ready'; } // Green
  if (score > 85) { color = '#3b82f6'; label = 'Placement Ready'; } // Blue

  // Calculate SVG arc (semi-circle)
  const radius = 60;
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full">
      <div 
        className="p-5 flex-1 cursor-pointer hover:bg-white/[0.02] transition-colors relative"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" /> Readiness
          </h3>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>

        <div className="flex flex-col items-center justify-center mt-4">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Background Arc */}
            <svg className="w-32 h-32 absolute top-0 left-0 transform -rotate-180">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference * 2}
                strokeDashoffset={circumference}
              />
            </svg>
            {/* Foreground Arc */}
            <svg className="w-32 h-32 absolute top-0 left-0 transform -rotate-180">
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference * 2}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-1">
              <span className="text-3xl font-bold text-white">{score}</span>
            </div>
          </div>
          <span className="text-xs font-medium mt-2" style={{ color }}>{label}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Applications</span>
                <span className="text-white font-medium">{data.breakdown.applications}/20</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">DSA Practice</span>
                <span className="text-white font-medium">{data.breakdown.dsa}/25</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Active Streak</span>
                <span className="text-white font-medium">{data.breakdown.streak}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Resume Upload</span>
                <span className="text-white font-medium">{data.breakdown.resume}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Weekly Goals</span>
                <span className="text-white font-medium">{data.breakdown.goals}/15</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Interviews</span>
                <span className="text-white font-medium">{data.breakdown.interviews}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Networking</span>
                <span className="text-white font-medium">{data.breakdown.network}/10</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReadinessGauge;
