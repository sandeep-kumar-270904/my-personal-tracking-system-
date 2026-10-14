import React from 'react';
import { Clock, Star, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InterviewList({ interviews, onCardClick }) {
  if (interviews.length === 0) {
    return <div className="text-center py-12 text-gray-500">No interviews logged yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {interviews.map((item, index) => {
        const needsDebrief = item.status === 'COMPLETED' && (!item.debrief || item.debrief.length < 5);
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={item._id}
            onClick={() => onCardClick(item)}
            className={`p-4 rounded-xl border cursor-pointer hover:bg-gray-800 transition-colors ${
              needsDebrief ? 'border-amber-500/50 bg-gray-800/30' : 'border-gray-800 bg-gray-900'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-white text-lg">{item.company}</h3>
                <p className="text-sm text-gray-400">{item.role}</p>
              </div>
              <span className="px-2 py-1 bg-gray-800 rounded text-xs font-medium text-gray-300 border border-gray-700">
                {item.platform}
              </span>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-400">
                {item.roundType}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                item.outcome === 'PASSED' ? 'bg-emerald-900/30 text-emerald-400' :
                item.outcome === 'FAILED' ? 'bg-rose-900/30 text-rose-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {item.outcome}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(item.scheduledAt).toLocaleDateString()}
              </div>
              
              {needsDebrief ? (
                <div className="flex items-center text-amber-500 font-medium">
                  <AlertCircle className="w-4 h-4 mr-1" /> Add Debrief
                </div>
              ) : item.performanceRating ? (
                <div className="flex items-center text-yellow-500">
                  <Star className="w-4 h-4 mr-1 fill-current" /> {item.performanceRating}/10
                </div>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
