import React, { useState } from 'react';
import { Users, Plus, Key, TrendingUp, Flame } from 'lucide-react';

const StudyGroupPanel = () => {
  const [isInGroup, setIsInGroup] = useState(true); // Mock state
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data
  const leaderboard = [
    { name: 'Coder772', problems: 42, streak: 12 },
    { name: 'You', problems: 31, streak: 8 },
    { name: 'NinjaX', problems: 15, streak: 2 }
  ];

  const activity = [
    { user: 'Coder772', action: 'solved their first Hard in DP', time: '2m ago' },
    { user: 'NinjaX', action: 'hit a 3 day streak', time: '1h ago' },
    { user: 'You', action: 'mastered Graphs', time: '5h ago' }
  ];

  if (!isInGroup) {
    return (
      <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-6 text-center">
        <Users className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Study Groups</h3>
        <p className="text-gray-400 text-sm mb-4">Students who study together improve 3x faster. Join an anonymous group.</p>
        <div className="flex justify-center gap-3">
          <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Create Group
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-gray-700">
            <Key className="w-4 h-4" /> Join via Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Cohort Alpha (Invite: <span className="text-indigo-400">X9B2K</span>)</h3>
            <p className="text-xs text-gray-400">3 Members • 88 problems this week</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white px-3 py-1 bg-gray-800 rounded-lg text-xs font-bold">
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50">
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-yellow-500" /> Weekly Leaderboard
            </h4>
            <div className="space-y-3">
              {leaderboard.map((member, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${member.name === 'You' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold w-4">{idx + 1}</span>
                    <span className={`font-bold ${member.name === 'You' ? 'text-indigo-400' : 'text-white'}`}>{member.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-300 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-cyan-400" /> {member.problems}
                    </span>
                    <span className="text-sm text-gray-300 font-medium flex items-center gap-1 w-12">
                      <Flame className="w-3 h-3 text-orange-400" /> {member.streak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-4">Live Activity</h4>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
              {activity.map((log, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-gray-700 bg-gray-900 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-gray-800 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-xs ${log.user === 'You' ? 'text-indigo-400' : 'text-white'}`}>{log.user}</span>
                      <time className="text-[10px] font-medium text-gray-500">{log.time}</time>
                    </div>
                    <div className="text-xs text-gray-400">{log.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icon
function TrophyIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}

export default StudyGroupPanel;
