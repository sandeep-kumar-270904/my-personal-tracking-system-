import { useState, useContext } from 'react';
import { User, Bell, Shield, LogOut, Save } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college: user?.college || '',
    branch: user?.branch || '',
    gradYear: user?.gradYear || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/auth/profile', formData);
      setUser(res.data);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-500/10 text-[#00f0ff]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'preferences' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Preferences</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'account' ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Account</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                    {formData.name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button type="button" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                    <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                    <input type="email" className="input-field opacity-50 cursor-not-allowed" value={formData.email} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">College / University</label>
                    <input type="text" className="input-field" value={formData.college} onChange={(e) => setFormData({...formData, college: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Branch</label>
                      <input type="text" className="input-field" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Grad Year</label>
                      <input type="text" className="input-field" value={formData.gradYear} onChange={(e) => setFormData({...formData, gradYear: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button disabled={isSaving} type="submit" className="flex items-center gap-2 px-6 py-3 bg-[#00f0ff] hover:bg-blue-400 disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-colors">
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 space-y-8">
              <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
              
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-medium text-white">Email Notifications</h3>
                  <p className="text-sm text-slate-400 mt-1">Receive updates about your application deadlines.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <h3 className="font-medium text-white">Weekly Progress Report</h3>
                  <p className="text-sm text-slate-400 mt-1">Get a weekly summary of your DSA and application progress.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff]"></div>
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 rounded-2xl border border-red-500/20">
              <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-white">Log out of all devices</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">You will be logged out of this session immediately.</p>
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>

                <div className="pt-6 border-t border-red-500/10">
                  <h3 className="font-medium text-red-400">Delete Account</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors border border-red-500/20">
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
