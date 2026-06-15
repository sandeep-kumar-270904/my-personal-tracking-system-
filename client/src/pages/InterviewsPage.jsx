import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Trash2, User, Clock, FileText, X, Maximize2, Minimize2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const fetchInterviews = async () => {
  const { data } = await api.get('/interviews');
  return data;
};

const InterviewsPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedInterviewForNotes, setSelectedInterviewForNotes] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [interviewToDelete, setInterviewToDelete] = useState(null);

  const [formData, setFormData] = useState({
    company: '', interviewDate: '', round: '', notes: '', status: 'Scheduled', interviewer: '', followUpDate: ''
  });

  const { data: interviews = [], isLoading, isError } = useQuery({
    queryKey: ['interviews'], queryFn: fetchInterviews
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => await api.post('/interviews', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      toast.success('Interview added');
      setShowModal(false);
      setFormData({ company: '', interviewDate: '', round: '', notes: '', status: 'Scheduled', interviewer: '', followUpDate: '' });
    },
    onError: () => toast.error('Failed to add interview')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => await api.put(`/interviews/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      toast.success('Updated successfully');
    },
    onError: () => toast.error('Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/interviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      toast.success('Interview deleted');
      setInterviewToDelete(null);
    },
    onError: () => toast.error('Failed to delete')
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Preparing': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/20';
    }
  };

  const handleOpenNotes = (interview) => {
    setSelectedInterviewForNotes(interview);
    setNotesValue(interview.notes || '');
    setIsEditingNotes(false);
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (selectedInterviewForNotes) {
      updateMutation.mutate({ 
        id: selectedInterviewForNotes._id, 
        updates: { notes: notesValue } 
      });
      setIsEditingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 w-full max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={Calendar} heading="Error" subtext="Failed to load interviews." />;
  }

  const sortedInterviews = [...interviews].sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Interviews</h1>
          <p className="text-slate-400">Track upcoming interviews and keep comprehensive prep notes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Interview
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {sortedInterviews.length === 0 ? (
          <EmptyState 
            icon={Calendar} 
            heading="No interviews scheduled" 
            subtext="When you get an interview, track it here to stay prepared." 
            ctaText="Schedule Interview"
            ctaAction={() => setShowModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInterviews.map((interview) => (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 group relative flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{interview.company}</h3>
                    <p className="text-sm text-[#00f0ff] font-medium">{interview.round}</p>
                  </div>
                  <button onClick={() => setInterviewToDelete(interview._id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 -mt-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 text-slate-300 mb-5 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-[#00f0ff] mr-3" />
                    <span className="font-medium text-sm">
                      {new Date(interview.interviewDate).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {interview.interviewer && (
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 text-emerald-400 mr-3" />
                      <span>{interview.interviewer}</span>
                    </div>
                  )}
                  {interview.followUpDate && (
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 text-amber-400 mr-3" />
                      <span>Follow-up: {new Date(interview.followUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div 
                  className="mb-6 bg-[#13141f] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors flex items-start gap-3 group/notes flex-1 min-h-[80px]"
                  onClick={() => handleOpenNotes(interview)}
                >
                  <FileText className="w-5 h-5 text-slate-500 group-hover/notes:text-[#00f0ff] transition-colors flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prep Notes</h4>
                      <Maximize2 className="w-3 h-3 text-slate-600 group-hover/notes:text-[#00f0ff] transition-colors" />
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {interview.notes || 'Click to add markdown notes...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(interview.status)}`}>
                    {interview.status}
                  </span>
                  <select
                    value={interview.status}
                    onChange={(e) => updateMutation.mutate({ id: interview._id, updates: { status: e.target.value } })}
                    className="bg-transparent border border-white/10 text-slate-300 hover:text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff6b00] cursor-pointer transition-colors"
                  >
                    <option value="Scheduled" className="bg-[#13141f]">Scheduled</option>
                    <option value="Preparing" className="bg-[#13141f]">Preparing</option>
                    <option value="Done" className="bg-[#13141f]">Done</option>
                    <option value="Cancelled" className="bg-[#13141f]">Cancelled</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!interviewToDelete}
        onClose={() => setInterviewToDelete(null)}
        onConfirm={() => deleteMutation.mutate(interviewToDelete)}
        title="Delete Interview"
        message="Are you sure you want to delete this interview?"
      />

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">Schedule Interview</h2>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name</label>
                  <input type="text" required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" placeholder="e.g. Google" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Date & Time</label>
                    <input type="datetime-local" required value={formData.interviewDate} onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Round Type</label>
                    <input type="text" required value={formData.round} onChange={(e) => setFormData({ ...formData, round: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" placeholder="e.g. System Design" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Interviewer Name</label>
                    <input type="text" value={formData.interviewer} onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Follow-up Date</label>
                    <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]" />
                  </div>
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="bg-[#ff6b00] hover:bg-[#EA6C0A] text-white font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50">Schedule</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Notes Modal */}
      <AnimatePresence>
        {showNotesModal && selectedInterviewForNotes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/5 bg-[#13141f]/80 backdrop-blur shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#ff6b00]" />
                    {selectedInterviewForNotes.company} - {selectedInterviewForNotes.round} Notes
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {new Date(selectedInterviewForNotes.interviewDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingNotes ? (
                    <button onClick={() => setIsEditingNotes(true)} className="btn-primary flex items-center gap-2 py-2 text-sm">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <button onClick={handleSaveNotes} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm transition-colors">
                      Save Changes
                    </button>
                  )}
                  <button onClick={() => setShowNotesModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Minimize2 className="w-5 h-5"/>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                {isEditingNotes ? (
                  <div className="flex-1 flex flex-col p-4 md:p-6 border-r border-white/5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      Markdown Editor
                      <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noreferrer" className="text-[#00f0ff] hover:underline normal-case font-normal text-xs">Formatting Guide</a>
                    </label>
                    <textarea 
                      autoFocus
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="flex-1 w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-[#ff6b00] font-mono text-sm resize-none custom-scrollbar"
                      placeholder="# System Design Prep&#10;&#10;## Topics to cover...&#10;- [ ] Load balancing&#10;- [ ] Caching"
                    />
                  </div>
                ) : null}

                <div className={`flex-1 flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar bg-black/20 ${!isEditingNotes && 'md:w-full'}`}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {isEditingNotes ? 'Live Preview' : 'Notes'}
                  </label>
                  <div className="prose prose-invert prose-orange max-w-none flex-1 w-full bg-transparent p-0">
                    {notesValue ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {notesValue}
                      </ReactMarkdown>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <FileText className="w-12 h-12 mb-3" />
                        <p>No notes written yet.</p>
                        {!isEditingNotes && (
                          <button onClick={() => setIsEditingNotes(true)} className="text-[#00f0ff] mt-2 hover:underline">Start writing</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default InterviewsPage;
