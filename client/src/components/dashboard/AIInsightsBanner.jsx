import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AIInsightsBanner = () => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInsights = async (force = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/ai-insights${force ? '?force=true' : ''}`);
      setInsights(res.data.insights);
    } catch (error) {
      console.error("Failed to fetch AI insights", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRefresh = (e) => {
    e.preventDefault();
    fetchInsights(true);
  };

  const insightLines = insights.split('\n').filter(l => l.trim().length > 0);

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden mb-8 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
      
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
        
        {/* Left Icon Area */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">AI Insights</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {insightLines.map((line, idx) => (
                  <p key={idx} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{line.replace(/^[-*]\s*/, '')}</span>
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link 
            to="/ai-analyzer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 font-medium transition-colors"
          >
            Full Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AIInsightsBanner;
