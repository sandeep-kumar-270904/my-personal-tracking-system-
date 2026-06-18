import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit2, Trash2, Calendar, Link as LinkIcon, Building2, Briefcase, FileText, CheckCircle2, History, AlertCircle, FilePlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fetchApplicationDetails = async (id) => {
  if (!id) return null;
  const res = await api.get(`/applications/${id}`);
  return res.data;
};

const ApplicationDetailDrawer = ({ isOpen, onClose, applicationId, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details'); // details, timeline
  const [newNote, setNewNote] = useState('');

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => fetchApplicationDetails(applicationId),
    enabled: !!applicationId && isOpen,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note) => {
      await api.patch(`/applications/${applicationId}`, { noteForTimeline: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      setNewNote('');
      toast.success('Note added to timeline');
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
            {isLoading || !app ? (
              <div className="w-full flex justify-between">
                <div className="h-6 w-32 bg-white/10 animate-pulse rounded"></div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  <img src={`https://logo.clearbit.com/${app.company.replace(/ /g, '').toLowerCase()}.com`} alt={app.company} className="w-12 h-12 rounded-xl bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{app.company}</h2>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> {app.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={onEdit} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-4 border-b border-white/5 gap-6">
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'details' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'timeline' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading || !app ? (
              <div className="space-y-4">
                <div className="h-20 bg-white/5 animate-pulse rounded-xl"></div>
                <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
              </div>
            ) : activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Status</p>
                    <p className="text-sm font-bold text-white">{app.status.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Date Applied</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Priority</p>
                    <p className={`text-sm font-bold ${app.priority === 'HIGH' ? 'text-red-400' : app.priority === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {app.priority}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Source</p>
                    <p className="text-sm font-bold text-white">{app.source}</p>
                  </div>
                </div>

                {app.link && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Application Link</h3>
                    <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline text-sm break-all">
                      {app.link}
                    </a>
                  </div>
                )}

                {app.jobDescriptionUrl && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Job Description Link</h3>
                    <a href={app.jobDescriptionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                      {app.jobDescriptionUrl}
                    </a>
                  </div>
                )}

                {app.tags && app.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded bg-white/10 text-slate-300 text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {app.notes && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</h3>
                    <div className="text-sm text-slate-400 whitespace-pre-wrap">{app.notes}</div>
                  </div>
                )}

                {app.interviews && app.interviews.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Linked Interviews</h3>
                    <div className="space-y-3">
                      {app.interviews.map(int => (
                        <div key={int._id} className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-purple-400 text-sm">{int.type} Interview</p>
                            <p className="text-xs text-slate-400">{new Date(int.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded border ${int.status === 'COMPLETED' ? 'border-green-500/20 text-green-500' : 'border-purple-500/20 text-purple-400'}`}>
                            {int.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 relative">
                {/* Timeline rendering */}
                <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-white/10"></div>
                {app.timeline && app.timeline.map((event, index) => (
                  <div key={event._id} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#13141f] border-2 border-[#ff6b00] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#ff6b00]"></div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <p className="font-semibold text-white text-sm">{event.event}</p>
                      <p className="text-xs text-slate-500 mb-2">{new Date(event.createdAt).toLocaleString()}</p>
                      {event.note && (
                        <div className="text-sm text-slate-300 bg-white/5 p-2 rounded border border-white/5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.note}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Footer for Timeline */}
          {activeTab === 'timeline' && app && (
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a timeline note..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
                  onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && addNoteMutation.mutate(newNote)}
                />
                <button 
                  onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || addNoteMutation.isLoading}
                  className="bg-[#ff6b00] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#ff6b00]/90 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApplicationDetailDrawer;
