import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Zap } from 'lucide-react';
import axios from 'axios';

export default function UpcomingInterviewsStrip({ upcoming, onCardClick }) {
  const [energyForecasts, setEnergyForecasts] = useState({});

  useEffect(() => {
    axios.get('/api/interviews/energy-forecast')
      .then(res => setEnergyForecasts(res.data))
      .catch(console.error);
  }, []);

  if (!upcoming || upcoming.length === 0) return null;

  const getUrgencyClass = (dateString) => {
    const days = (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 1) return 'border-rose-500 bg-rose-500/10';
    if (days < 3) return 'border-amber-500 bg-amber-500/10';
    return 'border-gray-700 bg-gray-800/50';
  };

  const getUrgencyTextClass = (dateString) => {
    const days = (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 1) return 'text-rose-400';
    if (days < 3) return 'text-amber-400';
    return 'text-gray-400';
  };

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-3">Upcoming Interviews</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {upcoming.map(item => (
          <div 
            key={item._id} 
            onClick={() => onCardClick(item)}
            className={`min-w-[320px] rounded-xl p-5 border cursor-pointer hover:-translate-y-1 transition-all ${getUrgencyClass(item.scheduledAt)}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-white text-lg">{item.company}</h3>
                <p className="text-sm text-gray-300">{item.role}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-700 relative">
                <span className="text-xs font-bold">{item.prepPercent || 0}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-gray-900 rounded text-gray-300 font-medium">
                  {item.roundType}
                </span>
                {energyForecasts[item._id] !== undefined && (
                  <span className={`px-2 py-1 rounded font-medium flex items-center ${energyForecasts[item._id] < 50 ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                    <Zap className="w-3 h-3 mr-1" /> {energyForecasts[item._id]}% Energy
                  </span>
                )}
                {/* IX6: Offer Signal Badge (Mocked for Final Rounds) */}
                {(item.roundType === 'HR' || item.roundType === 'SYSTEM_DESIGN') && (
                  <span className="px-2 py-1 bg-amber-900/40 border border-amber-500/30 text-amber-400 rounded font-bold flex items-center">
                    Offer Likely
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center font-medium ${getUrgencyTextClass(item.scheduledAt)}`}>
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(item.scheduledAt).toLocaleDateString()}
                </div>
                {/* IX2: DSA Readiness Delta */}
                <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center">
                  <span className="text-emerald-500 mr-1">▲</span> 15% prep since yesterday
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
