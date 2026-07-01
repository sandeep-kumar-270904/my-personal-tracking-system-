import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Calendar, Clock, ExternalLink, Code2, Search, Bell, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ContestsPage = () => {
  const queryClient = useQueryClient();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAllContests();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveEventMutation = useMutation({
    mutationFn: async (data) => await api.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar']);
      toast.success('Reminder added to Calendar');
    },
    onError: () => toast.error('Failed to set reminder')
  });

  const attendMutation = useMutation({
    mutationFn: async (data) => await api.post('/contests/participate', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('Contest participation logged! Goals updated.');
    },
    onError: () => toast.error('Failed to log participation')
  });

  const getNextDates = (dayOfWeek, hour, count, biweekly = false) => {
    const dates = [];
    let d = new Date();
    d.setHours(hour, 0, 0, 0);
    while (d.getDay() !== dayOfWeek) {
      d.setDate(d.getDate() + 1);
    }
    for (let i = 0; i < count; i++) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + (biweekly ? 14 : 7));
    }
    return dates;
  };

  const generatePredictableContests = () => {
    const generated = [];
    const lcWeeklies = getNextDates(0, 8, 3).map((date, i) => ({
      name: `LeetCode Weekly Contest ${390 + i}`, site: 'LeetCode', start_time: date.toISOString(), duration: 5400, url: 'https://leetcode.com/contest/'
    }));
    const lcBiweeklies = getNextDates(6, 20, 2, true).map((date, i) => ({
      name: `LeetCode Biweekly Contest ${125 + i}`, site: 'LeetCode', start_time: date.toISOString(), duration: 5400, url: 'https://leetcode.com/contest/'
    }));
    const ccStarters = getNextDates(3, 20, 3).map((date, i) => ({
      name: `CodeChef Starters ${130 + i} (Rated)`, site: 'CodeChef', start_time: date.toISOString(), duration: 7200, url: 'https://www.codechef.com/contests'
    }));
    generated.push(...lcWeeklies, ...lcBiweeklies, ...ccStarters);
    return generated;
  };

  const fetchAllContests = async () => {
    setLoading(true);
    try {
      let cfContests = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('https://codeforces.com/api/contest.list', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.status === 'OK') {
          cfContests = data.result
            .filter(c => c.phase === 'BEFORE')
            .map(c => ({
              name: c.name, site: 'Codeforces', start_time: new Date(c.startTimeSeconds * 1000).toISOString(), duration: c.durationSeconds, url: `https://codeforces.com/contest/${c.id}`
            }));
        }
      } catch (err) {
        console.warn('Codeforces fetch failed:', err);
      }
      const predictable = generatePredictableContests();
      const allContests = [...cfContests, ...predictable].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      setContests(allContests);
    } catch (err) {
      setError('Unable to load contests at this time.');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColors = (site) => {
    switch (site.toLowerCase()) {
      case 'leetcode': return { border: 'border-yellow-500/50', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]', text: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'codeforces': return { border: 'border-blue-500/50', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', text: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'codechef': return { border: 'border-[#ff6b00]/50', glow: 'shadow-[0_0_15px_rgba(255,107,0,0.2)]', text: 'text-[#ff6b00]', bg: 'bg-[#ff6b00]/10' };
      default: return { border: 'border-emerald-500/50', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', text: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getCountdown = (startDate) => {
    const diff = startDate - currentTime;
    if (diff <= 0) return 'Started';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const platforms = ['All', 'LeetCode', 'Codeforces', 'CodeChef'];
  const filteredContests = contests.filter(c => {
    const matchesPlatform = filter === 'All' || c.site === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="relative overflow-hidden min-h-full">
      <div className="max-w-6xl mx-auto relative z-10 p-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Real-Time Tracking
            </div>
            <h1 className="text-[28px] font-semibold text-white mb-1">
              Contests
            </h1>
            <p className="text-[14px] text-slate-400 max-w-2xl">
              Never miss a rated contest. Track upcoming assessments from LeetCode, Codeforces, and CodeChef.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search contests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#13141f] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => setFilter(platform)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === platform 
                  ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400' 
                  : 'bg-[#13141f] text-slate-400 border border-white/10 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
        ) : error ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-red-500/30 bg-red-500/10">
            <Trophy className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-red-400 mb-2">{error}</h3>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
            <Code2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No contests found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredContests.map((contest, idx) => {
                const startDate = new Date(contest.start_time);
                const colors = getPlatformColors(contest.site);
                const countdown = getCountdown(startDate);

                return (
                  <motion.div 
                    key={contest.name + idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass-card p-6 rounded-2xl border ${colors.border} bg-[#0a0a0f]/80 backdrop-blur-xl transition-all flex flex-col h-full hover:-translate-y-1 hover:${colors.glow}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                          <Code2 className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div className="pr-2">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${colors.text}`}>{contest.site}</p>
                          <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight" title={contest.name}>{contest.name}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-grow">
                      <div className="flex items-center justify-between text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <Calendar className={`w-5 h-5 ${colors.text} shrink-0`} />
                          <span className="text-sm font-medium">
                            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-slate-400 font-bold">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{formatDuration(contest.duration)}</span>
                        </div>
                        
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#13141f] rounded-lg text-sm font-bold border border-white/10 tracking-widest font-mono ${countdown.includes(':') ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                          {countdown}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                      {/* Networking V5: Find Teammates */}
                      <button 
                        onClick={() => window.location.href = `/networking?tab=messages&type=find_teammates&contest=${encodeURIComponent(contest.name)}`}
                        className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" /> Find Teammates in Network
                      </button>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => saveEventMutation.mutate({ title: contest.name, type: 'Event', date: contest.start_time, description: `URL: ${contest.url}`, emailReminder: true })}
                          className="flex items-center justify-center p-3.5 bg-white/5 text-slate-300 font-bold rounded-xl transition-all border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 group"
                          title="Add to Calendar"
                        >
                          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <a 
                          href={contest.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`flex-1 py-3.5 px-4 bg-[#13141f] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:bg-white/5`}
                        >
                          Compete <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <button 
                        onClick={() => attendMutation.mutate({ name: contest.name, site: contest.site, url: contest.url })}
                        disabled={attendMutation.isPending}
                        className="w-full py-2 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-4 h-4" /> Mark as Attended
                      </button>

                      {/* Networking V5: Shareable Completion */}
                      <button 
                        onClick={() => {
                          const message = `I just registered for ${contest.name}! Who else is competing? Let's discuss problems afterwards.`;
                          navigator.clipboard.writeText(message);
                          toast.success('Shareable message copied to clipboard!');
                        }}
                        className="w-full py-2 mt-1 text-slate-400 hover:text-white text-xs transition-colors flex items-center justify-center gap-1 underline decoration-white/30 underline-offset-4"
                      >
                        Generate Shareable Status
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
