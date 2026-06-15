import { useState } from 'react';
import { BookOpen, Code, Database, Monitor, Server, Briefcase, ExternalLink, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const resources = [
  {
    title: 'NeetCode',
    category: 'DSA',
    url: 'https://neetcode.io/',
    desc: 'The best platform for leetcode pattern-based preparation with excellent video explanations.',
    icon: Code,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    title: 'Roadmap.sh',
    category: 'Web Dev',
    url: 'https://roadmap.sh/',
    desc: 'Step by step guides and paths to learn different tools or technologies.',
    icon: Monitor,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    title: 'ByteByteGo',
    category: 'System Design',
    url: 'https://bytebytego.com/',
    desc: 'Excellent resource for learning system design concepts and preparing for architecture rounds.',
    icon: Server,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    title: 'CS50',
    category: 'CS Core',
    url: 'https://pll.harvard.edu/course/cs50-introduction-computer-science',
    desc: 'Harvard’s famous introductory course covering C, Python, SQL, and algorithms.',
    icon: Database,
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  {
    title: 'Pramp',
    category: 'Interview Prep',
    url: 'https://www.pramp.com/',
    desc: 'Practice mock interviews for free with peers. Great for getting comfortable talking while coding.',
    icon: Briefcase,
    color: 'text-[#ff6b00]',
    bg: 'bg-[#ff6b00]/10'
  },
  {
    title: 'Striver’s SDE Sheet',
    category: 'DSA',
    url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/',
    desc: 'A curated list of top coding interview questions by TakeUForward, frequently asked by top product companies.',
    icon: Code,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    title: 'Frontend Masters',
    category: 'Web Dev',
    url: 'https://frontendmasters.com/',
    desc: 'In-depth, advanced courses on JavaScript, React, CSS, and modern web architectures.',
    icon: Monitor,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    title: 'Grokking the System Design',
    category: 'System Design',
    url: 'https://www.designgurus.io/course/grokking-the-system-design-interview',
    desc: 'A highly recommended course for understanding distributed systems and scaling concepts.',
    icon: Server,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
];

const categories = ['All', 'DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep'];

const ResourcesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = resources.filter(res => {
    const matchesCategory = activeCategory === 'All' || res.category === activeCategory;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-blue-500 w-8 h-8" />
            PrepHub & Resources
          </h1>
          <p className="text-slate-400">Curated materials, roadmaps, and tools to ace your tech interviews.</p>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-transparent' 
                  : 'bg-[#13141f] text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search resources..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredResources.map((res, index) => {
            const Icon = res.icon;
            return (
              <motion.div
                key={res.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
              >
                {/* Background glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${res.bg}`}>
                    <Icon className={`w-6 h-6 ${res.color}`} />
                  </div>
                  <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-full text-xs font-medium border border-white/10">
                    {res.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 relative z-10">{res.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow relative z-10">
                  {res.desc}
                </p>

                <a 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 group/btn relative z-10"
                >
                  Visit Resource
                  <ExternalLink className="w-4 h-4 ml-2 text-slate-400 group-hover/btn:text-white transition-colors" />
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No resources found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
