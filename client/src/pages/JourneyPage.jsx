import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Code, Calendar, CheckCircle2, Activity, Download, Filter } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow, format } from 'date-fns';

const JourneyPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchTimeline();
  }, [filter]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timeline/unified?type=${filter}&limit=100`);
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching timeline', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/timeline/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'My_Placement_Season_Story.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'APPLICATION': return <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"><Briefcase className="w-5 h-5 text-blue-400" /></div>;
      case 'INTERVIEW': return <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30"><Calendar className="w-5 h-5 text-amber-400" /></div>;
      case 'DSA': return <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30"><Code className="w-5 h-5 text-purple-400" /></div>;
      case 'OFFER': return <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>;
      default: return <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center border border-slate-500/30"><Activity className="w-5 h-5 text-slate-400" /></div>;
    }
  };

  const filters = ['ALL', 'APPLICATION', 'INTERVIEW', 'DSA', 'OFFER', 'CONTACT', 'CONTEST'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-[#ff6b00]/30 relative">
      
      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c33]">Journey</span>
            </h1>
            <p className="text-lg text-slate-400">
              The complete story of your placement season.
            </p>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
          >
            <Download className="w-4 h-4" /> Export Story to PDF
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-[#ff6b00] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {f === 'ALL' ? 'All Activity' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading your story...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
            <p className="text-slate-400">Start applying and tracking to build your story.</p>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-0">
            {/* Vertical Line */}
            <div className="absolute left-[34px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#ff6b00] via-white/10 to-transparent -translate-x-1/2"></div>
            
            <div className="space-y-12">
              {events.map((event, idx) => (
                <motion.div 
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between w-full relative ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="w-full md:w-[45%] flex justify-end">
                    <div className={`w-full glass-card p-6 rounded-2xl border border-white/5 hover:border-[#ff6b00]/30 transition-colors ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                      <div className={`flex items-center gap-3 mb-3 ${idx % 2 === 0 ? 'justify-start' : 'md:justify-end justify-start'}`}>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#ff6b00] bg-[#ff6b00]/10 px-3 py-1 rounded-full">
                          {event.sourceTable} {event.eventType}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h4 className="text-xl font-medium text-white mb-2">{event.title}</h4>
                      {event.description && <p className="text-slate-400 text-sm leading-relaxed">{event.description}</p>}
                      <p className="text-xs text-slate-600 mt-4">{format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  
                  <div className="absolute left-[34px] md:left-1/2 -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(255,107,0,0.3)]">
                    {getIcon(event.sourceTable)}
                  </div>
                  
                  <div className="w-full md:w-[45%] hidden md:block"></div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JourneyPage;
