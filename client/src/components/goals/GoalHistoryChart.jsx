import React from 'react';
import { format } from 'date-fns';

const GoalHistoryChart = ({ history, period }) => {
  if (!history || history.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-slate-500 italic">
        No past history yet.
      </div>
    );
  }

  // Find max value to scale the bars
  const maxVal = Math.max(...history.map(h => Math.max(h.final_completed_value, h.target_value_at_period)), 1);

  return (
    <div className="flex items-end gap-2 h-16 pt-2">
      {history.map((snap, idx) => {
        const heightPct = Math.min((snap.final_completed_value / maxVal) * 100, 100);
        const targetHeightPct = Math.min((snap.target_value_at_period / maxVal) * 100, 100);
        const isMet = snap.final_completed_value >= snap.target_value_at_period;
        
        let label = '';
        if (period === 'weekly') {
          // Format as "Jan 1"
          label = format(new Date(snap.period_start), 'MMM d');
        } else {
          label = format(new Date(snap.period_start), 'MMM yyyy');
        }

        return (
          <div key={snap._id} className="group relative flex-1 flex flex-col items-center justify-end h-full">
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-[#1a1b26] border border-white/10 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-10">
              <div className="font-bold mb-0.5">{label}</div>
              {snap.final_completed_value} / {snap.target_value_at_period} {isMet ? '✅' : ''}
            </div>

            {/* Target line indicator */}
            <div 
              className="absolute w-full border-t border-dashed border-white/20"
              style={{ bottom: `${targetHeightPct}%` }}
            />

            {/* Progress Bar */}
            <div 
              className={`w-full max-w-[20px] rounded-t-sm transition-all ${
                isMet ? 'bg-[#00f0ff]' : 'bg-slate-500'
              }`}
              style={{ height: `${heightPct}%`, minHeight: '2px' }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GoalHistoryChart;
