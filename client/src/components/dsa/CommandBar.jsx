import React, { useState } from 'react';
import { Search, Flame, Calendar, CalendarDays, Hash, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CommandBar = ({ overview, onOpenQuickLog, onStartSession }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const lower = input.toLowerCase();
      if (lower.includes('start session')) {
        onStartSession();
      } else {
        // Quick log with pre-filled title
        onOpenQuickLog(input);
      }
      setInput('');
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Command Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
        </div>
        <input
          type="text"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-lg shadow-lg"
          placeholder="Log a problem, start a session, or ask about your progress..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono font-medium">Enter ↵</kbd>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="flex flex-wrap gap-4 mt-6">
        <StatPill 
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          label="Streak"
          value={`${overview?.currentStreak || 0} days`}
          animate={overview?.currentStreak > 0}
        />
        <StatPill 
          icon={<Calendar className="w-4 h-4 text-cyan-500" />}
          label="Today"
          value={`${overview?.todayCount || 0} problems`}
        />
        <StatPill 
          icon={<CalendarDays className="w-4 h-4 text-purple-500" />}
          label="This Week"
          value={`${overview?.thisWeekCount || 0} problems`}
        />
        <StatPill 
          icon={<Hash className="w-4 h-4 text-green-500" />}
          label="Total"
          value={`${overview?.totalProblemsSolved || 0} problems`}
        />
        <StatPill 
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          label="Study Time"
          value={`${Math.round((overview?.studyTimeThisWeek || 0) / 60)} hrs`}
        />
      </div>
    </div>
  );
};

const StatPill = ({ icon, label, value, animate }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-full px-4 py-2 hover:bg-gray-800 transition-colors"
  >
    <div className={animate ? 'animate-pulse' : ''}>{icon}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  </motion.div>
);

export default CommandBar;
