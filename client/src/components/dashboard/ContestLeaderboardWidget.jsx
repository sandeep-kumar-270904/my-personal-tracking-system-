import { Trophy } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'Neal Wu', rating: 3806, attended: 156, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neal', color: 'bg-blue-500', border: 'border-blue-400' },
  { rank: 2, name: 'Miruu', rating: 3702, attended: 120, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Miruu', color: 'bg-pink-500', border: 'border-pink-400' },
  { rank: 3, name: 'Yawn Sean', rating: 3644, attended: 110, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Yawn', color: 'bg-amber-500', border: 'border-amber-400' },
  { rank: 4, name: 'AlexChen', rating: 3611, attended: 107, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AC' },
  { rank: 5, name: 'SarahJ', rating: 3599, attended: 146, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SJ' },
];

const ContestLeaderboardWidget = () => {
  return (
    <div className="glass-card p-5 border border-white/5 bg-[#13141f] relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-yellow-500" /> Contest Leaderboard
        </h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded">Global</span>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-2 mb-6 h-36">
        {/* Rank 2 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#2a2a2a] rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 border border-[#3a3a3a] z-10">2</div>
            <div className={`w-12 h-12 rounded-full border-2 ${mockLeaderboard[1].border} p-0.5 ${mockLeaderboard[1].color} shadow-[0_0_15px_rgba(236,72,153,0.3)]`}>
              <img src={mockLeaderboard[1].avatar} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 truncate w-16 text-center">{mockLeaderboard[1].name}</p>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center -translate-y-4">
          <div className="relative mb-2">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 z-10 animate-bounce text-xs">👑</div>
            <div className={`w-14 h-14 rounded-full border-2 ${mockLeaderboard[0].border} p-0.5 ${mockLeaderboard[0].color} shadow-[0_0_20px_rgba(59,130,246,0.4)]`}>
              <img src={mockLeaderboard[0].avatar} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
          </div>
          <div className="bg-[#2a2a2a] px-2 py-0.5 rounded border border-[#3a3a3a] mt-1">
            <p className="text-[11px] font-bold text-white truncate w-16 text-center">{mockLeaderboard[0].name}</p>
            <p className="text-[9px] text-slate-400 text-center">{mockLeaderboard[0].rating}</p>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#2a2a2a] rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 border border-[#3a3a3a] z-10">3</div>
            <div className={`w-12 h-12 rounded-full border-2 ${mockLeaderboard[2].border} p-0.5 ${mockLeaderboard[2].color} shadow-[0_0_15px_rgba(245,158,11,0.3)]`}>
              <img src={mockLeaderboard[2].avatar} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 truncate w-16 text-center">{mockLeaderboard[2].name}</p>
        </div>
      </div>

      {/* List 4-5 */}
      <div className="space-y-1">
        {mockLeaderboard.slice(3).map((user) => (
          <div key={user.rank} className="flex items-center justify-between py-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 w-3">{user.rank}</span>
              <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full bg-slate-700" />
              <span className="font-medium text-[11px] text-slate-300">{user.name}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">{user.rating}</span>
          </div>
        ))}
      </div>
      <button 
        onClick={() => window.location.href = '/contests'}
        className="w-full mt-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
      >
        View Full Leaderboard
      </button>
    </div>
  );
};

export default ContestLeaderboardWidget;
