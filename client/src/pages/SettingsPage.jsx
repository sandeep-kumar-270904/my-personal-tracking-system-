import { useState, useContext, useEffect } from 'react';
import { User, Bell, Shield, LogOut, Save, Download, Moon, Sun } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

const SettingsPage = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college: user?.college || '',
    branch: user?.branch || '',
    gradYear: user?.gradYear || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        college: user.college || '',
        branch: user.branch || '',
        gradYear: user.gradYear || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => await api.put('/auth/profile', data),
    onSuccess: (res) => {
      setUser(res.data);
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile')
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Gather all necessary data
      const [apps, res, dsa, ints, net, goals, offers, events] = await Promise.all([
        api.get('/applications'),
        api.get('/resumes'),
        api.get('/dsa'),
        api.get('/interviews'),
        api.get('/network'),
        api.get('/goals'),
        api.get('/offers'),
        api.get('/events')
      ]);

      const exportData = {
        profile: user,
        applications: apps.data,
        resumes: res.data,
        dsa: dsa.data,
        interviews: ints.data,
        network: net.data,
        goals: goals.data,
        offers: offers.data,
        events: events.data,
        exportedAt: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `studenttracker_export_${new Date().getTime()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account settings, preferences, and data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'profile' ? 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <User className="w-5 h-5" /> Profile
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'preferences' ? 'bg-amber-500/10 text-amber-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Bell className="w-5 h-5" /> Preferences
          </button>
          <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'data' ? 'bg-emerald-500/10 text-emerald-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Download className="w-5 h-5" /> Data & Privacy
          </button>
          <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'account' ? 'bg-red-500/10 text-red-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Shield className="w-5 h-5" /> Account
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
              <form onSubmit={handleSave} className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00f0ff] to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg border-2 border-white/10">
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{formData.name}</h3>
                    <p className="text-sm text-slate-400 mb-2">{formData.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10">Student</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input type="text" className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input type="email" className="w-full bg-[#13141f]/50 border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed" value={formData.email} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">College / University</label>
                    <input type="text" className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" value={formData.college} onChange={(e) => setFormData({...formData, college: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                      <input type="text" className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Grad Year</label>
                      <input type="text" className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" value={formData.gradYear} onChange={(e) => setFormData({...formData, gradYear: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto flex justify-end">
                  <button disabled={updateProfileMutation.isPending} type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#00f0ff] hover:bg-blue-400 disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-colors shadow-lg">
                    {updateProfileMutation.isPending ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 space-y-8 h-full">
              <h2 className="text-xl font-bold text-white mb-6">Application Preferences</h2>
              
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">Theme Mode</h3>
                  <p className="text-sm text-slate-400 mt-1">Toggle between dark and light mode appearances.</p>
                </div>
                <div className="flex bg-[#13141f] p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setTheme('dark')} 
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme('light')} 
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white">Email Notifications</h3>
                  <p className="text-sm text-slate-400 mt-1">Receive updates about your application deadlines.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff] border border-white/10"></div>
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 h-full">
              <h2 className="text-xl font-bold text-white mb-6">Data & Privacy</h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                      <Download className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">Export My Data</h3>
                      <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">Download a complete copy of all your data stored in StudentTracker, including applications, resumes, networking contacts, goals, and offers in JSON format.</p>
                      <button 
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-lg transition-colors border border-emerald-500/30 flex items-center gap-2"
                      >
                        {isExporting ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                        {isExporting ? 'Preparing Export...' : 'Export JSON Data'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-red-500/20 h-full">
              <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-white">Log out of all devices</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">You will be logged out of this session immediately.</p>
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-[#13141f] hover:bg-white/10 text-white font-bold rounded-lg transition-colors border border-white/10">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>

                <div className="pt-6 border-t border-red-500/10">
                  <h3 className="font-bold text-red-400">Delete Account</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors border border-red-500/20">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
