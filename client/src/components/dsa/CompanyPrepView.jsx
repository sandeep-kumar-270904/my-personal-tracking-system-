import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, MessageSquare, Download } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

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

              {/* Networking V5: Contact Tips Callout */}
              {idx === 0 && (
                <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3.5 h-3.5" /> What your contacts say
                      </h4>
                      <p className="text-xs text-indigo-200/80 italic">
                        "They really drill down into edge cases for Two Pointers, especially around handling duplicates." - <span className="font-semibold text-indigo-300">Alex Chen (Google)</span>
                      </p>
                    </div>
                    <button 
                      onClick={async () => {
                        const loadingToast = toast.loading("Importing insights...");
                        try {
                          await api.post('/dsa/insights/import-from-contact', { contactId: 'mock123', tips: ['Handle duplicates in Two Pointers'] });
                          toast.success("Tip added to DSA notes!", { id: loadingToast });
                        } catch (err) {
                          toast.error("Failed to import tip", { id: loadingToast });
                        }
                      }}
                      className="shrink-0 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md transition-colors"
                      title="Import tip to DSA notes"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
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
