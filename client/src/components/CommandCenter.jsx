import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, Users, FileText, Code2, Loader2, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CommandCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ applications: [], network: [], resumes: [], dsa: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ applications: [], network: [], resumes: [], dsa: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ applications: [], network: [], resumes: [], dsa: [] });
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (type, item) => {
    setIsOpen(false);
    switch (type) {
      case 'application':
        navigate('/applications');
        // You could pass state or use a global store to auto-select this application ID
        break;
      case 'network':
        navigate('/network');
        break;
      case 'resume':
        navigate('/resumes');
        break;
      case 'dsa':
        navigate('/dsa');
        break;
      default:
        break;
    }
  };

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <>
      {/* FAB / Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#ff6b00] to-[#ff007b] text-white rounded-full shadow-[0_0_20px_rgba(255,107,0,0.3)] flex items-center justify-center hover:scale-110 transition-transform z-40 group"
        title="Command Center (Ctrl+K)"
      >
        <Command className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-[#13141f] text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
          Command Center (Ctrl+K)
        </span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[70vh]"
            >
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search applications, network, resumes, DSA topics..." 
                  className="flex-1 bg-transparent text-white focus:outline-none text-lg"
                />
                {isSearching && <Loader2 className="w-5 h-5 text-[#ff6b00] animate-spin" />}
                <div className="hidden md:flex gap-1 text-xs text-slate-500 font-medium">
                  <span className="bg-white/5 px-1.5 py-0.5 rounded">Ctrl</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded">K</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {query.length < 2 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Command className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Type at least 2 characters to search across all your data.</p>
                  </div>
                ) : !hasResults && !isSearching ? (
                  <div className="p-8 text-center text-slate-500">
                    <p>No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="space-y-4 p-2">
                    {/* Applications */}
                    {results.applications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                          <Briefcase className="w-3 h-3" /> Applications
                        </h4>
                        {results.applications.map(app => (
                          <button key={app._id} onClick={() => handleSelect('application', app)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-left transition-colors">
                            <div>
                              <p className="text-sm font-medium text-white">{app.company}</p>
                              <p className="text-xs text-slate-400">{app.role}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">{app.status.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Network */}
                    {results.network.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-4">
                          <Users className="w-3 h-3" /> Network Contacts
                        </h4>
                        {results.network.map(contact => (
                          <button key={contact._id} onClick={() => handleSelect('network', contact)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-left transition-colors">
                            <div>
                              <p className="text-sm font-medium text-white">{contact.name}</p>
                              <p className="text-xs text-slate-400">{contact.company} • {contact.role}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resumes */}
                    {results.resumes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-4">
                          <FileText className="w-3 h-3" /> Resumes
                        </h4>
                        {results.resumes.map(resume => (
                          <button key={resume._id} onClick={() => handleSelect('resume', resume)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-left transition-colors">
                            <p className="text-sm font-medium text-white">{resume.originalName}</p>
                            {resume.isPrimary && <span className="text-xs px-2 py-0.5 rounded bg-[#ff6b00]/20 text-[#ff6b00]">Primary</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* DSA */}
                    {results.dsa.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-4">
                          <Code2 className="w-3 h-3" /> DSA Topics
                        </h4>
                        {results.dsa.map(item => (
                          <button key={item._id} onClick={() => handleSelect('dsa', item)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-left transition-colors">
                            <div>
                              <p className="text-sm font-medium text-white">{item.problemName}</p>
                              <p className="text-xs text-slate-400">{item.topic}</p>
                            </div>
                            <span className="text-xs text-slate-400">{item.difficulty}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-white/5 bg-black/20 text-xs text-slate-500 flex justify-between">
                <span>Use <kbd className="bg-white/5 px-1 rounded mx-1">↑</kbd> <kbd className="bg-white/5 px-1 rounded mx-1">↓</kbd> to navigate</span>
                <span><kbd className="bg-white/5 px-1 rounded mx-1">Enter</kbd> to select</span>
                <span><kbd className="bg-white/5 px-1 rounded mx-1">Esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandCenter;
