import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const PlacementTimelinePanel = () => {
  const [targetDate, setTargetDate] = useState('');
  const [currentDepth, setCurrentDepth] = useState('SURFACE');

  const calculateTimeline = () => {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const today = new Date();
    const weeksRemaining = Math.round((target - today) / (1000 * 60 * 60 * 24 * 7));
    
    // Logic: 
    // From SURFACE to REFERRAL takes ~6 weeks (Initial -> Follow up -> Value add -> Ask)
    // From ACQUAINTANCE takes ~4 weeks
    // From CONNECTION takes ~2 weeks
    // From RELATIONSHIP takes ~1 week
    
    const requiredWeeks = {
      'SURFACE': 6,
      'ACQUAINTANCE': 4,
      'CONNECTION': 2,
      'RELATIONSHIP': 1
    }[currentDepth];

    const isOnTrack = weeksRemaining >= requiredWeeks;

    return {
      weeksRemaining,
      requiredWeeks,
      isOnTrack,
      startDate: new Date(target.getTime() - (requiredWeeks * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()
    };
  };

  const timeline = calculateTimeline();

  return (
    <div className="bg-[#13141f] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-blue-400" size={20} />
        <h3 className="font-bold text-white">Reverse Timeline Calculator</h3>
      </div>
      
      <p className="text-xs text-slate-400 mb-4">Work backwards from your target application date to know exactly when to start networking.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Target Application Date</label>
          <input 
            type="date" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg p-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Current Contact Depth</label>
          <select 
            value={currentDepth}
            onChange={(e) => setCurrentDepth(e.target.value)}
            className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg p-2 focus:outline-none focus:border-blue-500"
          >
            <option value="SURFACE">Surface (0 interactions)</option>
            <option value="ACQUAINTANCE">Acquaintance (1 interaction)</option>
            <option value="CONNECTION">Connection (Multiple)</option>
            <option value="RELATIONSHIP">Relationship (Advocate)</option>
          </select>
        </div>
      </div>

      {timeline && (
        <div className={`p-4 rounded-lg border ${timeline.isOnTrack ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-start gap-3">
            {timeline.isOnTrack ? <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />}
            <div>
              <h4 className={`text-sm font-bold mb-1 ${timeline.isOnTrack ? 'text-emerald-400' : 'text-red-400'}`}>
                {timeline.isOnTrack ? 'You are on track' : 'You are behind schedule'}
              </h4>
              <p className="text-xs text-slate-300 mb-3">
                You have {timeline.weeksRemaining} weeks until your target date. 
                Building a genuine referral from the {currentDepth.toLowerCase()} level takes roughly {timeline.requiredWeeks} weeks.
              </p>
              
              <div className="flex flex-col gap-2 relative">
                <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-white/10" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-blue-500 flex items-center justify-center" />
                  <div className="text-xs text-slate-300"><strong className="text-white">{timeline.startDate}</strong>: Start Outreach</div>
                </div>
                
                {currentDepth === 'SURFACE' && (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-purple-500 flex items-center justify-center" />
                    <div className="text-xs text-slate-300">Add value / Share work</div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-[#ff6b00] flex items-center justify-center" />
                  <div className="text-xs text-slate-300"><strong className="text-white">{new Date(targetDate).toLocaleDateString()}</strong>: Ask for Referral</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTimelinePanel;
