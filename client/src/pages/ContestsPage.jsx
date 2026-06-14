import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Clock, ExternalLink, Code2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ContestsPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      // Kontests API provides free live upcoming coding contests
      const response = await fetch('https://kontests.net/api/v1/all');
      if (!response.ok) {
        throw new Error('Failed to fetch contests');
      }
      const data = await response.json();
      
      // Filter out completed contests and sort by start time
      const upcoming = data
        .filter(contest => new Date(contest.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      
      setContests(upcoming);
    } catch (err) {
      console.error(err);
      setError('Unable to load live contests at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (site) => {
    switch (site.toLowerCase()) {
      case 'leetcode': return <Code2 className="text-yellow-500 w-6 h-6" />;
      case 'codeforces': return <Code2 className="text-red-500 w-6 h-6" />;
      case 'codechef': return <Code2 className="text-orange-500 w-6 h-6" />;
      case 'hackerrank': return <Code2 className="text-green-500 w-6 h-6" />;
      case 'hackerearth': return <Code2 className="text-blue-500 w-6 h-6" />;
      default: return <Trophy className="text-emerald-500 w-6 h-6" />;
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) return `${Math.floor(h / 24)} days`;
    if (h === 0) return `${m} mins`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const platforms = ['All', ...new Set(contests.map(c => c.site))];
  const filteredContests = filter === 'All' ? contests : contests.filter(c => c.site === filter);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 border-b border-slate-700/50 pb-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-500 w-8 h-8" />
              Live Coding Contests
            </h1>
            <p className="text-slate-400">Never miss a rated contest. Track upcoming assessments from LeetCode, Codeforces, and more.</p>
          </header>

          {loading ? (
             <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
             </div>
          ) : error ? (
            <div className="text-center py-20 glass rounded-2xl border border-red-500/30 bg-red-500/10">
              <Trophy className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-red-400 mb-2">{error}</h3>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                {platforms.map(platform => (
                  <button
                    key={platform}
                    onClick={() => setFilter(platform)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                      filter === platform 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map((contest, idx) => {
                  const startDate = new Date(contest.start_time);
                  const isWithin24h = (startDate - new Date()) < 24 * 60 * 60 * 1000;

                  return (
                    <motion.div 
                      key={contest.name + idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass p-6 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-all group flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-800 rounded-xl border border-slate-700/50">
                            {getPlatformIcon(contest.site)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{contest.site}</p>
                            <h3 className="text-lg font-bold text-white line-clamp-2" title={contest.name}>{contest.name}</h3>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 flex-grow">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-sm">
                            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm">Duration: {formatDuration(contest.duration)}</span>
                        </div>
                        {isWithin24h && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Starting Soon
                          </div>
                        )}
                      </div>

                      <a 
                        href={contest.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-blue-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] mt-auto"
                      >
                        Register Now <ExternalLink className="w-4 h-4" />
                      </a>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContestsPage;
