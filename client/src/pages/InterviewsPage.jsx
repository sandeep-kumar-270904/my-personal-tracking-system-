import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, MapPin, Video, Phone } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    interviewDate: '',
    round: '',
    notes: '',
    status: 'Scheduled',
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/interviews');
      setInterviews(data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/interviews', formData);
      setInterviews([...interviews, data].sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate)));
      setShowModal(false);
      setFormData({ company: '', interviewDate: '', round: '', notes: '', status: 'Scheduled' });
    } catch (error) {
      console.error('Failed to add interview:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/api/interviews/${id}`, { status });
      setInterviews(interviews.map(i => i._id === id ? data : i));
    } catch (error) {
      console.error('Failed to update interview:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/interviews/${id}`);
      setInterviews(interviews.filter((i) => i._id !== id));
    } catch (error) {
      console.error('Failed to delete interview:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Preparing': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-[#00f0ff] bg-blue-400/10 border-blue-400/20'; // Scheduled
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Interviews</h1>
          <p className="text-slate-400 mt-1">Track your upcoming interviews and prep notes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Interview
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviews.map((interview) => (
          <motion.div
            key={interview._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{interview.company}</h3>
                <p className="text-sm text-[#00f0ff] font-medium">{interview.round}</p>
              </div>
              <button
                onClick={() => handleDelete(interview._id)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center text-slate-300 mb-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <Calendar className="w-5 h-5 text-[#00f0ff] mr-3" />
              <span className="font-medium">
                {new Date(interview.interviewDate).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>

            <p className="text-sm text-slate-400 mb-6 min-h-[40px] line-clamp-2">
              {interview.notes || 'No preparation notes added.'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                {interview.status}
              </span>
              <select
                value={interview.status}
                onChange={(e) => updateStatus(interview._id, e.target.value)}
                className="bg-[#13141f] border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Preparing">Preparing</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </motion.div>
        ))}
      </div>

      {interviews.length === 0 && (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No interviews scheduled</h3>
          <p className="text-slate-500">When you get an interview, track it here to stay prepared.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 rounded-2xl border border-white/5"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Schedule Interview</h2>
            <form onSubmit={handleAddInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Google"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Round Type</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                    placeholder="e.g. Technical 1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Preparation Notes</label>
                <textarea
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Focus on system design..."
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[#13141f] hover:bg-white/[0.05] text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
                >
                  Save Interview
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
