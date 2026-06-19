import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, TrendingDown } from 'lucide-react';
import api from '../../../services/api';

const ThinkingVelocityChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await api.get('/dsa/thinking-velocity');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, []);

  if (loading) return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;

  // Simple mock visualization without recharts to keep dependencies low, or we can use standard div bars
  const maxVelocity = Math.max(...data.map(d => d.velocity), 30);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-cyan-400">
          <Timer className="w-5 h-5" />
          <h2 className="text-xl font-bold text-white">Thinking Velocity</h2>
        </div>
        <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
          <TrendingDown className="w-4 h-4" /> 33% Faster
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6">Average time to identify the correct approach (minutes)</p>

      <div className="flex items-end gap-6 h-40">
        {data.map((point, idx) => {
          const heightPercent = (point.velocity / maxVelocity) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2 group">
              <div className="w-full relative flex justify-center items-end h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.velocity}m ({point.volume} probs)
                </div>
                {/* Bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.5, type: 'spring' }}
                  className="w-12 bg-cyan-500/80 rounded-t-lg group-hover:bg-cyan-400 transition-colors"
                />
              </div>
              <span className="text-xs font-bold text-gray-500">{point.week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThinkingVelocityChart;
