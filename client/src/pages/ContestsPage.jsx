import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Clock, ExternalLink, Code2, Search, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ContestsPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllContests();
  }, []);

  // Helper to generate the next N occurrences of a specific day of the week
  const getNextDates = (dayOfWeek, hour, count, biweekly = false) => {
    const dates = [];
    let d = new Date();
    d.setHours(hour, 0, 0, 0);
    // Find next matching day
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
    
    // LeetCode Weekly: Sundays at 8:00 AM (IST) -> 2:30 AM UTC
    const lcWeeklies = getNextDates(0, 8, 3).map((date, i) => ({
      name: `LeetCode Weekly Contest ${390 + i}`,
      site: 'LeetCode',
      start_time: date.toISOString(),
      duration: 5400, // 1.5 hours
      url: 'https://leetcode.com/contest/'
    }));

    // LeetCode Biweekly: Saturdays at 8:00 PM (IST) -> 2:30 PM UTC
    const lcBiweeklies = getNextDates(6, 20, 2, true).map((date, i) => ({
      name: `LeetCode Biweekly Contest ${125 + i}`,
      site: 'LeetCode',
      start_time: date.toISOString(),
      duration: 5400,
      url: 'https://leetcode.com/contest/'
    }));

    // CodeChef Starters: Wednesdays at 8:00 PM (IST)
    const ccStarters = getNextDates(3, 20, 3).map((date, i) => ({
      name: `CodeChef Starters ${130 + i} (Rated)`,
      site: 'CodeChef',
      start_time: date.toISOString(),
      duration: 7200, // 2 hours
      url: 'https://www.codechef.com/contests'
    }));

    generated.push(...lcWeeklies, ...lcBiweeklies, ...ccStarters);
    return generated;
  };

  const fetchAllContests = async () => {
    setLoading(true);
    try {
      // 1. Fetch Codeforces with a 3-second timeout
      let cfContests = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://codeforces.com/api/contest.list', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (data.status === 'OK') {
          cfContests = data.result
            .filter(c => c.phase === 'BEFORE')
            .map(c => ({
              name: c.name,
              site: 'Codeforces',
              start_time: new Date(c.startTimeSeconds * 1000).toISOString(),
              duration: c.durationSeconds,
              url: `https://codeforces.com/contest/${c.id}`
            }));
        }
      } catch (err) {
        console.warn('Codeforces fetch failed or timed out:', err);
      }

      // 2. Combine with Predictable Contests
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

  const platforms = ['All', 'LeetCode', 'Codeforces', 'CodeChef'];
  
  const filteredContests = contests.filter(c => {
    const matchesPlatform = filter === 'All' || c.site === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex font-['Plus_Jakarta_Sans']">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 relative overflow-hidden min-h-screen">
        {/* Abstract Glow Effects */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#00f0ff]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 left-[20%] w-[600px] h-[600px] bg-[#ff007b]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Real-Time Tracking
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#3b82f6]">Contests</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl">
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
                  className="w-full bg-[#13141f] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </header>

          {/* Filters */}
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
                 <div className="absolute inset-0 border-4 border-[#00f0ff]/20 border-b-[#00f0ff] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContests.map((contest, idx) => {
                const startDate = new Date(contest.start_time);
                const isWithin24h = (startDate - new Date()) < 24 * 60 * 60 * 1000;
                const colors = getPlatformColors(contest.site);

                return (
                  <motion.div 
                    key={contest.name + idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass-card p-6 rounded-2xl border ${colors.border} bg-[#0a0a0f]/80 backdrop-blur-xl transition-all group flex flex-col h-full hover:-translate-y-1 hover:${colors.glow}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                          <Code2 className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${colors.text}`}>{contest.site}</p>
                          <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight" title={contest.name}>{contest.name}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-grow">
                      <div className="flex items-center gap-3 text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Calendar className={`w-5 h-5 ${colors.text} shrink-0`} />
                        <span className="text-sm font-medium">
                          {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{formatDuration(contest.duration)}</span>
                        </div>
                        {isWithin24h && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-[11px] font-bold border border-red-500/30 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Next 24h
                          </div>
                        )}
                      </div>
                    </div>

                    <a 
                      href={contest.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full py-3.5 px-4 bg-[#13141f] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:bg-white/5 group-hover:${colors.border} mt-auto`}
                    >
                      Compete Now <ExternalLink className="w-4 h-4" />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContestsPage;
