import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

const InterviewCountdownBanner = ({ interview }) => {
  if (!interview) return null;

  // Mock days remaining calculation
  const daysRemaining = Math.max(0, Math.ceil((new Date(interview.interviewDate) - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">Active Prep Mode</span>
            {daysRemaining <= 2 && <span className="bg-rose-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider animate-pulse">Intense Sprint</span>}
          </div>
          <h2 className="text-2xl font-black mb-1">Interview with {interview.companyName} in {daysRemaining} days</h2>
          <p className="text-indigo-100 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(interview.interviewDate).toLocaleDateString()}</p>
        </div>

        <div className="mt-4 md:mt-0 bg-black/20 p-4 rounded-xl backdrop-blur-md min-w-[300px]">
          <h3 className="text-sm font-bold text-indigo-100 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Today's Focus</h3>
          <div className="space-y-2">
            {(interview.prepPlan[0]?.patternsToPractice || ['Dynamic Programming (2 problems)', 'Graphs (1 problem)']).map((task, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  {task}
                </span>
                <button className="text-indigo-200 hover:text-white transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCountdownBanner;
