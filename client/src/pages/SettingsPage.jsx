import { useState, useContext, useEffect } from 'react';
import { User, Bell, Shield, LogOut, Save, Download, Moon, Sun, Activity, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

const SettingsPage = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    branch: user?.branch || '',
    gradYear: user?.gradYear || '',
    benchmarkOptIn: user?.benchmarkOptIn || false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        branch: user.branch || '',
        gradYear: user.gradYear || '',
        benchmarkOptIn: user.benchmarkOptIn || false
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

  const handleConnectGoogle = async () => {
    try {
      const { data } = await api.get('/events/sync/google/auth-url');
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast.error('Failed to get Google authorization URL');
    }
  };

  const handleManualSync = async () => {
    const loadToast = toast.loading('Syncing with Google Calendar...');
    try {
      await api.post('/events/sync/google/trigger');
      toast.success('Sync completed successfully!', { id: loadToast });
    } catch (err) {
      toast.error('Sync failed', { id: loadToast });
    }
  };

  const handleUpdateSyncSettings = async (settings) => {
    const loadToast = toast.loading('Saving sync preferences...');
    try {
      const res = await api.post('/events/sync/google/settings', {
        syncDirection: settings.syncDirection !== undefined ? settings.syncDirection : user.googleCalendarSync?.syncDirection,
        googleCalendarId: settings.googleCalendarId !== undefined ? settings.googleCalendarId : user.googleCalendarSync?.googleCalendarId
      });
      setUser(prev => ({ ...prev, googleCalendarSync: res.data.settings }));
      toast.success('Preferences saved', { id: loadToast });
    } catch (err) {
      toast.error('Failed to save preferences', { id: loadToast });
    }
  };

  const handleDisconnectGoogle = async () => {
    const removeEvents = window.confirm("Do you want to delete all previously pushed StudentTracker events from your Google Calendar?");
    const loadToast = toast.loading('Disconnecting Google Calendar...');
    try {
      await api.post(`/events/sync/google/disconnect?removeEvents=${removeEvents}`);
      setUser(prev => ({
        ...prev,
        googleCalendarSync: {
          connected: false,
          accessToken: '',
          refreshToken: '',
          expiryDate: 0,
          syncDirection: 'both',
          calendarId: '',
          googleCalendarId: 'primary'
        }
      }));
      toast.success('Google Calendar disconnected successfully', { id: loadToast });
    } catch (err) {
      toast.error('Failed to disconnect Google Calendar', { id: loadToast });
    }
  };

  const handleUpdateCalendarSettings = async (settings) => {
    const loadToast = toast.loading('Saving calendar preferences...');
    try {
      const res = await api.put('/auth/calendar-settings', settings);
      setUser(prev => ({
        ...prev,
        calendarSettings: res.data.calendarSettings
      }));
      toast.success('Calendar preferences saved', { id: loadToast });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save calendar preferences', { id: loadToast });
    }
  };

  const generateShareLink = (mode = 'full', name = 'Share Link') => {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    const token = Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
    
    const newLinks = [...(user?.calendarSettings?.shareLinks || [])];
    newLinks.push({ token, mode, name, createdAt: new Date() });
    handleUpdateCalendarSettings({ shareLinks: newLinks });
  };

  const revokeShareLink = (tokenToRevoke) => {
    if (window.confirm('Are you sure you want to revoke this public sharing link? The old link will stop working immediately.')) {
      const newLinks = (user?.calendarSettings?.shareLinks || []).filter(l => l.token !== tokenToRevoke);
      handleUpdateCalendarSettings({ shareLinks: newLinks });
    }
  };

  const generateRecruiterLink = () => {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    const token = Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
    
    // Default config: valid for 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const newLinks = [...(user?.calendarSettings?.recruiterLinks || [])];
    newLinks.push({ 
      token, 
      startDate, 
      endDate, 
      duration: 60,
      createdAt: new Date() 
    });
    handleUpdateCalendarSettings({ recruiterLinks: newLinks });
  };

  const revokeRecruiterLink = (tokenToRevoke) => {
    if (window.confirm('Are you sure you want to revoke this recruiter booking link?')) {
      const newLinks = (user?.calendarSettings?.recruiterLinks || []).filter(l => l.token !== tokenToRevoke);
      handleUpdateCalendarSettings({ recruiterLinks: newLinks });
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const connectCalendar = async () => {
        const loadToast = toast.loading('Connecting Google Calendar...');
        try {
          const res = await api.post('/events/sync/google/callback', { code });
          setUser(prev => ({ ...prev, googleCalendarSync: res.data.settings }));
          toast.success('Google Calendar connected successfully!', { id: loadToast });
          setActiveTab('preferences');
        } catch (err) {
          toast.error('Failed to connect Google Calendar', { id: loadToast });
        }
      };
      connectCalendar();
    }
  }, [setUser]);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/data/json', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `studenttracker_export_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export JSON data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/data/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applications.csv');
      document.body.appendChild(link);
      link.click();
      toast.success('Applications exported as CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const response = await api.get('/data/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placement_report.pdf');
      document.body.appendChild(link);
      link.click();
      toast.success('PDF report generated', { id: 'pdf' });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Importing data...', { id: 'import' });
      const { data } = await api.post('/data/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Imported ${data.count} applications`, { id: 'import' });
      queryClient.invalidateQueries(['applications']);
    } catch (error) {
      toast.error('Failed to import CSV', { id: 'import' });
    }
    e.target.value = ''; // reset file input
  };

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await api.get('/applications/audit-logs');
      return res.data;
    },
    enabled: activeTab === 'audit'
  });

  const handleRequestDataDeletion = async () => {
    if (!window.confirm("Are you sure you want to request data deletion? This action may be irreversible once processed.")) return;
    setIsDeletingData(true);
    try {
      await api.post('/applications/request-data-deletion');
      toast.success('Data deletion request submitted successfully. You will receive an email confirmation.');
    } catch (error) {
      toast.error('Failed to submit data deletion request.');
    } finally {
      setIsDeletingData(false);
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
          <button onClick={() => setActiveTab('public_profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'public_profile' ? 'bg-[#ff6b00]/10 text-[#ff6b00] shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <User className="w-5 h-5" /> Public Profile
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'preferences' ? 'bg-amber-500/10 text-amber-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Bell className="w-5 h-5" /> Preferences
          </button>
          <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'data' ? 'bg-emerald-500/10 text-emerald-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Download className="w-5 h-5" /> Data & Privacy
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'audit' ? 'bg-blue-500/10 text-blue-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Activity className="w-5 h-5" /> Audit & Compliance
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp Phone Number</label>
                    <input type="tel" className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +1234567890" />
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

          {activeTab === 'public_profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 space-y-8 h-full">
              <h2 className="text-xl font-bold text-[#ff6b00] mb-2 flex items-center gap-2"><User className="w-5 h-5"/> Public Profile Settings</h2>
              <p className="text-sm text-slate-400 mb-6">Create a shareable link to show off your placement journey to recruiters and peers.</p>
              
              <form onSubmit={handleSave} className="space-y-6 flex-1 flex flex-col h-[calc(100%-80px)]">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-[#ff6b00] transition-colors">
                    <span className="px-4 py-2.5 bg-[#13141f]/80 text-slate-500 border-r border-white/10 select-none">studenttracker.app/u/</span>
                    <input 
                      type="text" 
                      className="w-full bg-[#13141f] px-4 py-2.5 text-white focus:outline-none" 
                      placeholder="johndoe"
                      value={formData.username || ''} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">This will be your unique public URL.</p>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h3 className="font-bold text-white">Enable Public Profile</h3>
                    <p className="text-sm text-slate-400 mt-1">Allow anyone with the link to view your profile.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.isPublicProfile || false}
                      onChange={(e) => setFormData({...formData, isPublicProfile: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff6b00] border border-white/10"></div>
                  </label>
                </div>

                <div className="space-y-4 pt-4 opacity-100 transition-opacity">
                  <h3 className="font-bold text-slate-300">Visibility Settings</h3>
                  
                  {[
                    { key: 'showApplicationsCount', label: 'Show Applications Count' },
                    { key: 'showDSAStats', label: 'Show DSA Stats' },
                    { key: 'showStreak', label: 'Show Solving Streak' },
                    { key: 'showTargetCompanies', label: 'Show Target Companies' },
                    { key: 'isOpenToOpportunities', label: 'Show "Open to Opportunities" Badge' }
                  ].map(({key, label}) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.publicProfileSettings?.[key] ?? true}
                          onChange={(e) => setFormData({
                            ...formData, 
                            publicProfileSettings: {
                              ...formData.publicProfileSettings,
                              [key]: e.target.checked
                            }
                          })}
                        />
                        <div className="w-9 h-5 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff6b00] border border-white/10"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto flex justify-between items-center">
                  {formData.username && formData.isPublicProfile ? (
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/u/${formData.username}`);
                        toast.success('Profile link copied to clipboard!');
                      }}
                      className="text-sm font-bold text-[#ff6b00] hover:text-[#ff6b00]/80 transition-colors"
                    >
                      Copy Profile Link
                    </button>
                  ) : <div></div>}
                  <button disabled={updateProfileMutation.isPending} type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#ff6b00] hover:bg-[#ff6b00]/80 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg">
                    {updateProfileMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                    Save Changes
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

              {/* WhatsApp Nudges */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" /> WhatsApp Nudges
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm">Receive immediate alerts for high-stakes moments like rescheduled drives.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={user?.notificationPreferences?.whatsappAlerts || false} 
                    onChange={(e) => updateProfileMutation.mutate({ 
                      notificationPreferences: { 
                        ...user?.notificationPreferences, 
                        whatsappAlerts: e.target.checked 
                      } 
                    })}
                  />
                  <div className="w-11 h-6 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff] border border-white/10"></div>
                </label>
              </div>

              {/* Display Timezone Dropdown */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white">Display Timezone</h3>
                  <p className="text-sm text-slate-400 mt-1">Select your preferred display timezone for calendar events.</p>
                </div>
                <div className="relative">
                  <select 
                    value={user?.calendarSettings?.timezone || 'Asia/Kolkata'}
                    onChange={(e) => handleUpdateCalendarSettings({ timezone: e.target.value })}
                    className="bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] text-sm appearance-none min-w-[200px]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              {/* Prep Suggestions Opt-out */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white">Smart Prep Block Suggestions</h3>
                  <p className="text-sm text-slate-400 mt-1">Automatically find free slots and suggest blocking prep time for interviews.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={!(user?.calendarSettings?.disablePrepSuggestions)}
                    onChange={(e) => handleUpdateCalendarSettings({ disablePrepSuggestions: !e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff] border border-white/10"></div>
                </label>
              </div>

              {/* Public Sharing Links Section */}
              <div className="py-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Public Calendar Sharing</h3>
                    <p className="text-sm text-slate-400 mt-1">Generate read-only unauthenticated views of your calendar.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => generateShareLink('full', 'Full Detail Link')}
                      className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl text-xs transition-colors"
                    >
                      + Full Link
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateShareLink('summary', 'Summary Only')}
                      className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl text-xs transition-colors"
                    >
                      + Summary Link
                    </button>
                  </div>
                </div>

                {user?.calendarSettings?.shareLinks && user.calendarSettings.shareLinks.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {user.calendarSettings.shareLinks.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-[#13141f] rounded-xl border border-white/10 relative">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm text-white">{link.name || 'Share Link'}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${link.mode === 'summary' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {link.mode} Mode
                            </span>
                          </div>
                          <input 
                            type="text" 
                            readOnly
                            value={`${window.location.origin}/cal/share/${link.token}`}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0 justify-center">
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/cal/share/${link.token}`);
                              toast.success('Share link copied to clipboard!');
                            }}
                            className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-xs transition-all whitespace-nowrap"
                          >
                            Copy
                          </button>
                          <button 
                            type="button"
                            onClick={() => revokeShareLink(link.token)}
                            className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-xs transition-colors whitespace-nowrap"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-sm text-slate-500">
                    No active share links. Generate one to allow family or mentors to track your progress.
                  </div>
                )}
              </div>

              {/* Recruiter Booking Links Section */}
              <div className="py-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Recruiter Booking Links</h3>
                    <p className="text-sm text-slate-400 mt-1">Generate self-serve booking links that pull from your free slots.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={generateRecruiterLink}
                    className="px-3 py-2 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] font-bold rounded-xl text-xs transition-colors"
                  >
                    + Generate Link
                  </button>
                </div>

                {user?.calendarSettings?.recruiterLinks && user.calendarSettings.recruiterLinks.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {user.calendarSettings.recruiterLinks.map((link, idx) => {
                      const isExpired = new Date(link.endDate) < new Date();
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-[#13141f] rounded-xl border border-white/10 relative">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-sm text-white">Booking Link</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                            </div>
                            <input 
                              type="text" 
                              readOnly
                              value={`${window.location.origin}/book/${link.token}`}
                              className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none mb-2"
                            />
                            <div className="text-[10px] text-slate-500 flex gap-4 font-medium">
                              <span>Duration: {link.duration}m</span>
                              <span>Expires: {new Date(link.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0 justify-center">
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/book/${link.token}`);
                                toast.success('Booking link copied to clipboard!');
                              }}
                              className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-xs transition-all whitespace-nowrap"
                            >
                              Copy
                            </button>
                            <button 
                              type="button"
                              onClick={() => revokeRecruiterLink(link.token)}
                              className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-xs transition-colors whitespace-nowrap"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-sm text-slate-500">
                    No active recruiter booking links.
                  </div>
                )}
              </div>

              {/* Google Calendar Sync */}
              <div className="pt-6 border-t border-white/5 space-y-6">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#00f0ff]" />
                    Google Calendar Integration
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Synchronize your StudentTracker placement events with your personal Google Calendar.
                  </p>
                </div>

                {!user?.googleCalendarSync?.connected ? (
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">Not Connected</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Connect your Google account to sync interviews and deadlines.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-5 py-2.5 bg-[#00f0ff] hover:bg-blue-400 text-slate-900 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shrink-0 self-start md:self-center"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected to Google Calendar
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Dedicated Calendar: <strong className="text-white">StudentTracker</strong>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={handleManualSync}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center gap-1.5"
                          >
                            Sync Now
                          </button>
                          <button 
                            type="button"
                            onClick={handleDisconnectGoogle}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors border border-red-500/20"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>

                      {/* Sync Direction Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Sync Direction</label>
                          <select 
                            value={user.googleCalendarSync?.syncDirection || 'both'}
                            onChange={(e) => handleUpdateSyncSettings({ syncDirection: e.target.value })}
                            className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] text-sm appearance-none"
                          >
                            <option value="both">Two-Way Sync (Push & Pull)</option>
                            <option value="push">Push Only (StudentTracker ➔ Google)</option>
                            <option value="pull">Pull Only (Google ➔ StudentTracker)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Google Source Calendar</label>
                          <input 
                            type="text"
                            placeholder="primary"
                            value={user.googleCalendarSync?.googleCalendarId || 'primary'}
                            onBlur={(e) => handleUpdateSyncSettings({ googleCalendarId: e.target.value })}
                            className="w-full bg-[#13141f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 h-full overflow-y-auto custom-scrollbar">
              <h2 className="text-xl font-bold text-white mb-6">Data & Privacy</h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                      <Download className="w-6 h-6" />
                    </div>
                    <div className="flex-1 w-full">
                      <h3 className="font-bold text-white">Export My Data</h3>
                      <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">Download a copy of your data in various formats for backup or analysis.</p>
                      
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={handleExportJson}
                          disabled={isExporting}
                          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-lg transition-colors border border-emerald-500/30 flex items-center gap-2"
                        >
                          {isExporting ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                          Export JSON
                        </button>
                        
                        <button 
                          onClick={handleExportCsv}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold rounded-lg transition-colors border border-blue-500/30 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                        
                        <button 
                          onClick={handleExportPdf}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-bold rounded-lg transition-colors border border-purple-500/30 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export PDF Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                      <Save className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">Import Data</h3>
                      <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">Upload a CSV file of your past applications to bulk import them.</p>
                      
                      <label className="cursor-pointer px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-lg transition-colors border border-amber-500/30 inline-flex items-center gap-2">
                        <Save className="w-4 h-4" /> Import CSV
                        <input 
                          type="file" 
                          accept=".csv"
                          onChange={handleImportCsv}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Anonymous Benchmarking</h3>
                        <p className="text-sm text-slate-400 mt-1 mb-2 leading-relaxed">
                          Opt-in to contribute your anonymized application metrics to the global benchmark pool. This enables the Benchmarking widget on your dashboard, allowing you to see how your progress compares with peers anonymously. Your personal identifiable data is never shared.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.benchmarkOptIn || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setFormData({ ...formData, benchmarkOptIn: val });
                          updateProfileMutation.mutate({ benchmarkOptIn: val });
                        }}
                      />
                      <div className="w-11 h-6 bg-[#13141f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 border border-white/10"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-400 shrink-0">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">Request Data Deletion (GDPR/CCPA)</h3>
                      <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">Initiate a formal request to permanently delete all your tracking data, logs, and associated information from our servers.</p>
                      
                      <button 
                        onClick={handleRequestDataDeletion}
                        disabled={isDeletingData}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors border border-red-500/20 flex items-center gap-2"
                      >
                        {isDeletingData ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                        Request Deletion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-6 h-6 text-blue-400" /> Audit Log</h2>
              <p className="text-slate-400 text-sm mb-6">A chronological history of all updates and activities on your applications for compliance tracking.</p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {isLoadingAudit ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
                  </div>
                ) : !auditLogs || auditLogs.length === 0 ? (
                  <div className="text-center p-8 text-slate-500">No audit logs found.</div>
                ) : (
                  auditLogs.map(log => (
                    <div key={log._id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{log.action}</span>
                          <span className="text-xs text-slate-500">on application</span>
                          <span className="text-xs text-slate-300 font-medium">{log.applicationId}</span>
                        </div>
                        <p className="text-sm text-slate-300">{log.details}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
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
