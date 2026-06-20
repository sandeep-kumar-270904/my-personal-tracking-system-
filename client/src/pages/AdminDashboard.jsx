import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Send, Calendar, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    roles: '',
    eligibleBranches: '',
    description: '',
    deadline: '',
    applyLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/broadcasts', formData);
      toast.success('Broadcast created successfully!');
      setFormData({
        companyName: '',
        roles: '',
        eligibleBranches: '',
        description: '',
        deadline: '',
        applyLink: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-[#00f0ff]" />
          Placement Cell Admin
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Broadcast upcoming placement drives to students.
        </p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 md:p-8 rounded-2xl border border-white/5"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-400" />
          Create New Broadcast
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="input-field py-3 pl-11 pr-4 w-full"
                  placeholder="e.g. Google"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Application Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="input-field py-3 pl-11 pr-4 w-full [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Roles (comma separated)</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={formData.roles}
                  onChange={(e) => setFormData({...formData, roles: e.target.value})}
                  className="input-field py-3 pl-11 pr-4 w-full"
                  placeholder="e.g. Software Engineer, Data Scientist"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Eligible Branches (comma separated)</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={formData.eligibleBranches}
                  onChange={(e) => setFormData({...formData, eligibleBranches: e.target.value})}
                  className="input-field py-3 pl-11 pr-4 w-full"
                  placeholder="e.g. CSE, IT, ECE"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Description / Requirements</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field py-3 px-4 w-full h-32 resize-none"
              placeholder="Provide details about the drive, eligibility criteria, and process..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Apply Link</label>
            <input
              type="url"
              required
              value={formData.applyLink}
              onChange={(e) => setFormData({...formData, applyLink: e.target.value})}
              className="input-field py-3 px-4 w-full"
              placeholder="https://"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-success px-8 py-3 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 animate-spin border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Broadcast Drive
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
