import React from 'react';
import { Target, Send, MessageCircle, UserPlus } from 'lucide-react';

const WeeklyGoalsCard = ({ goals, onEdit }) => {
  if (!goals) return null;

  const metrics = [
    { label: 'Outreach', current: goals.outreachCompleted || 0, target: goals.outreachTarget || 10, icon: <Send size={14}/>, color: 'bg-blue-500' },
    { label: 'Responses', current: goals.responsesReceived || 0, target: goals.responsesTarget || 3, icon: <MessageCircle size={14}/>, color: 'bg-emerald-500' },
    { label: 'Referrals', current: goals.referralsReceived || 0, target: goals.referralsTarget || 1, icon: <Target size={14}/>, color: 'bg-[#ff6b00]' },
    { label: 'New Contacts', current: goals.newContactsAdded || 0, target: goals.newContactsTarget || 5, icon: <UserPlus size={14}/>, color: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Goals</h3>
        <button onClick={onEdit} className="text-xs text-[#ff6b00] hover:text-[#ff8533] font-medium">Edit</button>
      </div>
      
      <div className="flex gap-4">
        {metrics.map((m, idx) => {
          const progress = m.target > 0 ? Math.min(100, (m.current / m.target) * 100) : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">{m.icon} {m.label}</span>
                <span className="font-medium text-white">{m.current}/{m.target}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${m.color} rounded-full`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyGoalsCard;
