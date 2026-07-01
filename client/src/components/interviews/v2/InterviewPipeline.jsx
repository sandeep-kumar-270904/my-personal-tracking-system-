import React from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';

export default function InterviewPipeline({ interviews, onCardClick }) {
  // Group by company
  const grouped = interviews.reduce((acc, curr) => {
    if (!acc[curr.company]) acc[curr.company] = [];
    acc[curr.company].push(curr);
    return acc;
  }, {});

  const companies = Object.keys(grouped).map(c => {
    const rounds = grouped[c].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const firstRoundDate = new Date(rounds[0].scheduledAt);
    const lastRoundDate = new Date(rounds[rounds.length - 1].scheduledAt);
    const daysSinceFirst = Math.floor((new Date() - firstRoundDate) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.floor((new Date() - lastRoundDate) / (1000 * 60 * 60 * 24));
    
    const isDead = daysSinceLast > 21 && rounds[rounds.length - 1].outcome === 'PENDING';

    return { company: c, rounds, daysSinceFirst, isDead };
  });

  return (
    <div className="space-y-6">
      {companies.map(c => (
        <div key={c.company} className={`p-5 rounded-xl border ${c.isDead ? 'border-gray-800 bg-gray-900/40 opacity-75' : 'border-gray-800 bg-gray-900'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{c.company}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-md ${c.daysSinceFirst > 30 ? 'bg-amber-900/30 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
              Process: {c.daysSinceFirst} days {c.isDead && '(Stalled)'}
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {c.rounds.map((r, idx) => (
              <React.Fragment key={r._id}>
                <div 
                  onClick={() => onCardClick(r)}
                  className="flex-shrink-0 w-48 p-3 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer hover:border-gray-500 transition-colors"
                >
                  <p className="text-xs text-gray-400 font-medium mb-1">Round {idx + 1}</p>
                  <p className="text-sm font-bold text-white truncate">{r.roundType}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{new Date(r.scheduledAt).toLocaleDateString()}</span>
                    {r.outcome === 'PASSED' && <Check className="w-4 h-4 text-emerald-500" />}
                    {r.outcome === 'FAILED' && <X className="w-4 h-4 text-rose-500" />}
                    {(r.outcome === 'PENDING' || r.outcome === 'AWAITING_RESULT') && <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>
                {idx < c.rounds.length - 1 && (
                  <div className="flex-shrink-0 w-8 h-0.5 bg-gray-700"></div>
                )}
              </React.Fragment>
            ))}
          </div>
          {c.isDead && (
            <div className="mt-3 text-sm text-gray-500 flex items-center">
              Process has stalled. <button className="ml-2 text-indigo-400 hover:text-indigo-300 underline">Send Follow-up</button>
            </div>
          )}
        </div>
      ))}
      
      {companies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No interviews logged yet. Start applying!
        </div>
      )}
    </div>
  );
}
