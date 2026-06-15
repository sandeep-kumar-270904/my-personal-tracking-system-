import { useState, useEffect } from 'react';
import { FileText, Plus, Star, Trash2 } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const ResumesPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fileUrl: '',
    isPrimary: false,
    notes: '',
  });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes');
      setResumes(data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResume = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/resumes', formData);
      if (data.isPrimary) {
        setResumes(resumes.map(r => ({ ...r, isPrimary: false })).concat(data));
      } else {
        setResumes([data, ...resumes]);
      }
      setShowModal(false);
      setFormData({ title: '', fileUrl: '', isPrimary: false, notes: '' });
      fetchResumes(); // re-fetch to ensure correct sorting/primary state
    } catch (error) {
      console.error('Failed to add resume:', error);
    }
  };

  const setPrimary = async (id) => {
    try {
      await api.put(`/api/resumes/${id}`, { isPrimary: true });
      fetchResumes();
    } catch (error) {
      console.error('Failed to update resume:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/resumes/${id}`);
      setResumes(resumes.filter((r) => r._id !== id));
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Resume Manager</h1>
          <p className="text-slate-400 mt-1">Manage and track your resume versions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Resume
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((resume) => (
          <motion.div
            key={resume._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="glass-card flex flex-col h-full p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group relative"
          >
            {resume.isPrimary && (
              <div className="absolute -top-3 -right-3 bg-yellow-500 text-white p-1.5 rounded-full shadow-lg">
                <Star className="w-4 h-4 fill-current" />
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FileText className="w-8 h-8 text-[#00f0ff]" />
              </div>
              <button
                onClick={() => handleDelete(resume._id)}
                className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-200 mb-1">{resume.title}</h3>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{resume.notes || 'No notes provided.'}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00f0ff] hover:text-blue-300 text-sm font-medium"
              >
                View File
              </a>
              {!resume.isPrimary && (
                <button
                  onClick={() => setPrimary(resume._id)}
                  className="text-xs px-3 py-1 bg-[#13141f] hover:bg-white/[0.05] text-slate-300 rounded-full transition-colors"
                >
                  Set Primary
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {resumes.length === 0 && (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No resumes yet</h3>
          <p className="text-slate-500">Upload your first resume version to get started.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 rounded-2xl border border-white/5"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add Resume Version</h2>
            <form onSubmit={handleAddResume} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Version Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Frontend Dev 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Upload Resume (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-[#00f0ff] hover:file:bg-blue-500/20"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, fileUrl: URL.createObjectURL(file) });
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Drive Link / URL</label>
                <input
                  type="url"
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tailored for startup roles..."
                ></textarea>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  className="w-4 h-4 rounded border-white/10 bg-[#0a0a0f]/50 text-[#ff6b00] focus:ring-blue-500 focus:ring-offset-slate-900"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                />
                <label htmlFor="isPrimary" className="ml-2 text-sm text-slate-300">Set as Primary Resume</label>
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
                  Save Resume
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResumesPage;
