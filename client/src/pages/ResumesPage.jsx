import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Star, Trash2, X, Download, Eye, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const fetchResumes = async () => {
  const { data } = await api.get('/resumes');
  return data;
};

const ResumePerformanceBar = ({ resumeId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['resumePerformance', resumeId],
    queryFn: async () => {
      const res = await api.get(`/resumes/${resumeId}/performance`);
      return res.data;
    }
  });

  if (isLoading) return <div className="h-6 w-full animate-pulse bg-white/5 rounded"></div>;
  if (!data) return null;

  const totalApps = data.totalApplications;
  if (totalApps === 0) return <div className="text-xs text-slate-500 text-center">No applications tracked</div>;

  const shortlistRate = Math.round((data.shortlistedCount / totalApps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-400">Performance</span>
        <span className={shortlistRate > 20 ? 'text-emerald-400' : 'text-slate-300'}>{shortlistRate}% Shortlist</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
        <div style={{ width: `${shortlistRate}%` }} className="h-full bg-emerald-500"></div>
        <div style={{ width: `${Math.round((data.rejectedCount / totalApps) * 100)}%` }} className="h-full bg-red-500"></div>
        <div className="h-full bg-slate-600 flex-1"></div>
      </div>
    </div>
  );
};

const ResumesPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    versionTag: 'v1',
    isPrimary: false,
  });

  const { data: resumes = [], isLoading, isError } = useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadData) => {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      return await api.post('/resumes', uploadData, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      toast.success('Resume uploaded successfully!');
      setShowModal(false);
      setFile(null);
      setFormData({ versionTag: 'v1', isPrimary: false });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      toast.success('Resume deleted');
      setResumeToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete resume');
    }
  });

  const primaryMutation = useMutation({
    mutationFn: async (id) => await api.put(`/resumes/${id}`, { isPrimary: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      toast.success('Primary resume updated');
    },
    onError: () => {
      toast.error('Failed to set primary resume');
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    const data = new FormData();
    data.append('resume', file);
    data.append('versionTag', formData.versionTag);
    data.append('isPrimary', formData.isPrimary);

    uploadMutation.mutate(data);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      e.target.value = null;
      return;
    }
    setFile(selectedFile);
  };

  if (isLoading) {
    return (
      <div className="p-8 w-full max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={FileText} heading="Error" subtext="Failed to load resumes." />;
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFullUrl = (filePath) => {
    // Determine the base URL depending on environment
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove '/api' to get the root URL
    const rootUrl = baseUrl.replace(/\/api$/, '');
    return `${rootUrl}${filePath}`;
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resumes</h1>
          <p className="text-slate-400">Manage your resume versions and tailor them to specific roles.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Upload Resume
        </button>
      </header>

      {resumes.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          heading="No resumes uploaded" 
          subtext="Upload your first resume in PDF format to start." 
          ctaText="Upload Resume"
          ctaAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <motion.div
              key={resume._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card flex flex-col h-full p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 relative group"
            >
              {resume.isPrimary && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-bold">
                  <Star className="w-3 h-3 fill-current" /> Primary
                </div>
              )}
              {!resume.isPrimary && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setResumeToDelete(resume._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 pr-20 truncate">{resume.originalName}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-6 font-medium">
                <span className="bg-white/5 px-2 py-0.5 rounded-md">{resume.versionTag}</span>
                <span>{formatSize(resume.size)}</span>
                <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                <a
                  href={getFullUrl(resume.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" /> Preview
                </a>
                <a
                  href={getFullUrl(resume.filePath)}
                  download
                  className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                {!resume.isPrimary && (
                  <button
                    onClick={() => primaryMutation.mutate(resume._id)}
                    className="flex items-center justify-center px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                    title="Set as Primary"
                  >
                    Set Primary
                  </button>
                )}
              </div>
              <div className="mt-4 border-t border-white/5 pt-4">
                <ResumePerformanceBar resumeId={resume._id} />
              </div>
            </motion.div>
          ))}
          
          {/* Mock "Tailor Resume" Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center justify-center h-full p-6 rounded-2xl border border-dashed border-[#ff6b00]/50 hover:border-[#ff6b00] hover:bg-[#ff6b00]/5 transition-all duration-300 cursor-pointer group min-h-[220px]"
            onClick={() => window.location.href = '/ai-analyzer'}
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff6b00] to-[#ff007b] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tailor Your Resume</h3>
            <p className="text-sm text-center text-slate-400">Paste a Job Description and let AI tailor your resume for a perfect match.</p>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!resumeToDelete}
        onClose={() => setResumeToDelete(null)}
        onConfirm={() => deleteMutation.mutate(resumeToDelete)}
        title="Delete Resume"
        message="Are you sure you want to delete this resume version? This action cannot be undone."
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">Upload Resume</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpload} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">PDF File</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      required 
                    />
                    <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-xl px-4 py-8 flex flex-col items-center justify-center text-center hover:border-[#ff6b00]/50 transition-colors">
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      {file ? (
                        <p className="text-sm font-medium text-[#00f0ff]">{file.name}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white mb-1">Click to browse or drag and drop</p>
                          <p className="text-xs text-slate-500">PDF only (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Version Tag</label>
                  <input 
                    type="text" 
                    value={formData.versionTag}
                    onChange={(e) => setFormData({...formData, versionTag: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors" 
                    placeholder="e.g. Frontend v2, Final..."
                    required 
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-[#13141f] text-[#ff6b00] focus:ring-[#ff6b00] focus:ring-offset-[#13141f]"
                  />
                  <div>
                    <label htmlFor="isPrimary" className="text-sm font-medium text-white block">Set as Primary</label>
                    <p className="text-xs text-slate-400">This version will be sent for new applications by default.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadMutation.isPending || !file}
                    className="bg-[#ff6b00] hover:bg-[#EA6C0A] text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                    Upload
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumesPage;
