import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

const CompanyPrepView = () => {
  const { data: companyPatterns, isLoading } = useQuery({
    queryKey: ['dsa', 'company-patterns'],
    queryFn: async () => {
      const res = await api.get('/dsa/company-patterns');
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
        <h2 className="text-lg font-bold text-white">Target Company Prep</h2>
      </div>
      
      {companyPatterns?.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {companyPatterns.map((cp, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="min-w-[250px] bg-gray-800/80 rounded-xl p-4 border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-white">{cp.company}</h3>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Readiness</p>
                  <p className="text-xl font-bold text-emerald-400">{cp.readinessScore}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Top Pattern</p>
                  <p className="text-sm font-medium text-gray-200">{cp.patterns[0]?.pattern.replace(/_/g, ' ')}</p>
                </div>
              </div>
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
