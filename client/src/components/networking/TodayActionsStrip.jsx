import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';

const TodayActionsStrip = ({ recommendations, onActionClick }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Networking Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gradient-to-br from-[#1a1c29] to-[#13141f] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-white/10 text-slate-300 uppercase">
                  {rec.actionType}
                </span>
              </div>
              <h4 className="font-semibold text-white">{rec.contact.name}</h4>
              <p className="text-xs text-slate-400">{rec.contact.role} @ {rec.contact.company}</p>
              <p className="text-sm text-slate-300 mt-3 mb-4">{rec.reason}</p>
            </div>
            
            <button 
              onClick={() => onActionClick(rec.contact)}
              className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5"
            >
              <MessageSquare size={16} />
              Message them
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TodayActionsStrip;
