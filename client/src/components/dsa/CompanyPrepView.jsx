import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

const CompanyPrepView = () => {
  const { data: appIntelligence, isLoading } = useQuery({
    queryKey: ['dsa', 'application-intelligence'],
    queryFn: async () => {
      const res = await api.get('/dsa/application-intelligence');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-32 bg-gray-900 rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="mb-10 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-white">Application Portfolio Intelligence</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">Ranked DSA patterns across all your active applications based on interview urgency and fit score.</p>
      
      {appIntelligence?.rankedPatterns?.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {appIntelligence.rankedPatterns.map((rp, idx) => (
            <motion.div 
              key={idx}
              className="bg-gray-800/80 rounded-xl p-4 border border-gray-700 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  {rp.pattern}
                </h3>
                <span className="text-xs font-bold text-gray-400">Score: {rp.score}</span>
              </div>
              <p className="text-xs text-gray-300">
                {rp.pattern} appears in <span className="text-white font-bold">{rp.applications.length}</span> of your active applications ({rp.applications.join(', ')}). 
                {idx === 0 && <span className="text-rose-400 font-medium ml-1">Highest priority.</span>}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No target companies active. Add applications to see your readiness.</p>
      )}
    </div>
  );
};

export default CompanyPrepView;
