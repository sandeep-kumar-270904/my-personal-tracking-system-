import { useState, useEffect } from 'react';
import { BookOpen, Code, Database, Monitor, Server, Briefcase, ExternalLink, Search, Bookmark, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultResources = [
  { id: '1', title: 'NeetCode', category: 'DSA', url: 'https://neetcode.io/', desc: 'The best platform for leetcode pattern-based preparation with excellent video explanations.', icon: 'Code', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: '2', title: 'Roadmap.sh', category: 'Web Dev', url: 'https://roadmap.sh/', desc: 'Step by step guides and paths to learn different tools or technologies.', icon: 'Monitor', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: '3', title: 'ByteByteGo', category: 'System Design', url: 'https://bytebytego.com/', desc: 'Excellent resource for learning system design concepts and preparing for architecture rounds.', icon: 'Server', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: '4', title: 'CS50', category: 'CS Core', url: 'https://pll.harvard.edu/course/cs50-introduction-computer-science', desc: 'Harvard’s famous introductory course covering C, Python, SQL, and algorithms.', icon: 'Database', color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: '5', title: 'Pramp', category: 'Interview Prep', url: 'https://www.pramp.com/', desc: 'Practice mock interviews for free with peers. Great for getting comfortable talking while coding.', icon: 'Briefcase', color: 'text-[#ff6b00]', bg: 'bg-[#ff6b00]/10' },
  { id: '6', title: 'Striver’s SDE Sheet', category: 'DSA', url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', desc: 'A curated list of top coding interview questions by TakeUForward, frequently asked by top product companies.', icon: 'Code', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: '7', title: 'Frontend Masters', category: 'Web Dev', url: 'https://frontendmasters.com/', desc: 'In-depth, advanced courses on JavaScript, React, CSS, and modern web architectures.', icon: 'Monitor', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: '8', title: 'Grokking the System Design', category: 'System Design', url: 'https://www.designgurus.io/course/grokking-the-system-design-interview', desc: 'A highly recommended course for understanding distributed systems and scaling concepts.', icon: 'Server', color: 'text-purple-400', bg: 'bg-purple-400/10' }
];

const getIconComponent = (iconName) => {
  switch(iconName) {
    case 'Code': return Code;
    case 'Monitor': return Monitor;
    case 'Server': return Server;
    case 'Database': return Database;
    case 'Briefcase': return Briefcase;
    default: return BookOpen;
  }
};

const categories = ['All', 'Saved', 'DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep'];

const ResourcesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState(defaultResources);
  const [savedIds, setSavedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'DSA', url: '', desc: '' });

  // Load from local storage on mount
  useEffect(() => {
    const localResources = JSON.parse(localStorage.getItem('custom_resources')) || [];
    if (localResources.length > 0) {
      setResources(prev => [...prev, ...localResources]);
    }
    const saved = JSON.parse(localStorage.getItem('saved_resources')) || [];
    setSavedIds(saved);
  }, []);

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(savedId => savedId !== id) : [...prev, id];
      localStorage.setItem('saved_resources', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newRes = {
      id: Date.now().toString(),
      ...formData,
      icon: 'BookOpen',
      color: 'text-white',
      bg: 'bg-white/10'
    };
    
    setResources(prev => [...prev, newRes]);
    const localResources = JSON.parse(localStorage.getItem('custom_resources')) || [];
    localStorage.setItem('custom_resources', JSON.stringify([...localResources, newRes]));
    
    setIsModalOpen(false);
    setFormData({ title: '', category: 'DSA', url: '', desc: '' });
  };

  const filteredResources = resources.filter(res => {
    const isSaved = savedIds.includes(res.id);
    if (activeCategory === 'Saved' && !isSaved) return false;
    
    const matchesCategory = activeCategory === 'All' || activeCategory === 'Saved' || res.category === activeCategory;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 w-full max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-blue-500 w-8 h-8" />
            PrepHub & Resources
          </h1>
          <p className="text-slate-400">Curated materials, roadmaps, and tools to ace your tech interviews.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Submit Resource
        </button>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 shrink-0">
        <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-transparent' 
                  : 'bg-[#13141f] text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat === 'Saved' && <Bookmark className="w-4 h-4 inline-block mr-1.5" />}
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
            className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredResources.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No resources found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredResources.map((res) => {
                const Icon = getIconComponent(res.icon);
                const isSaved = savedIds.includes(res.id);

                return (
                  <motion.div
                    key={res.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 group flex flex-col h-full relative"
                  >
                    <button 
                      onClick={(e) => { e.preventDefault(); toggleSave(res.id); }}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-colors z-20 ${isSaved ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-slate-500 hover:text-white bg-white/5'}`}
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                    </button>

                    <div className="flex items-center justify-between mb-4 relative z-10 pr-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${res.bg}`}>
                        <Icon className={`w-6 h-6 ${res.color}`} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-wider">
                        {res.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">{res.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow relative z-10 line-clamp-3">
                      {res.desc}
                    </p>

                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center w-full py-2.5 bg-[#13141f] hover:bg-[#00f0ff] hover:text-[#13141f] text-slate-300 font-bold rounded-xl transition-all border border-white/10 hover:border-transparent group/btn relative z-10"
                    >
                      Visit Resource
                      <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:text-[#13141f] text-slate-400 transition-colors" />
                    </a>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-lg relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg"><X className="w-5 h-5" /></button>
              
              <h2 className="text-xl font-bold text-white mb-6">Submit a Resource</h2>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Resource Name</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none">
                      {categories.filter(c => c !== 'All' && c !== 'Saved').map(cat => (
                        <option key={cat} value={cat} className="bg-[#13141f]">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">URL</label>
                    <input type="url" required value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="https://" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea required value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-y" placeholder="Why is this resource helpful?" />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-300 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all">Submit Resource</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourcesPage;
