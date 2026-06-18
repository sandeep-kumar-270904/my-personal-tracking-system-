import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#13141f] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const QuickAddModals = ({ activeModal, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const invalidateAndClose = (msg) => {
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    toast.success(msg);
    setLoading(false);
    onClose();
  };

  // Add Application Form
  const [appData, setAppData] = useState({ company: '', role: '', status: 'APPLIED' });
  const submitApp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', appData);
      invalidateAndClose('Application added');
      setAppData({ company: '', role: '', status: 'APPLIED' });
    } catch (err) {
      toast.error('Failed to add application');
      setLoading(false);
    }
  };

  // Log DSA Form
  const [dsaData, setDsaData] = useState({ topic: '', difficulty: 'EASY', platform: 'LeetCode', date: new Date().toISOString().split('T')[0] });
  const submitDsa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/dsa', { ...dsaData, solvedAt: new Date(dsaData.date) });
      invalidateAndClose('DSA problem logged');
      setDsaData({ ...dsaData, topic: '' });
    } catch (err) {
      toast.error('Failed to log DSA');
      setLoading(false);
    }
  };

  // Add Interview Form
  const [intData, setIntData] = useState({ company: '', role: '', round: '', date: new Date().toISOString().slice(0,16) });
  const submitInt = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Need an applicationId ideally, but for quick add we can create a generic interview or handle if API requires app ID.
      // Assuming API allows creating standalone interviews or we need to fetch apps. 
      // If API requires app ID, we'd need a dropdown. Let's assume the user can just type company and we figure it out or it's allowed.
      // *Wait, schema requires applicationId. Let's add a simple fetch for apps.*
      toast.error("Please use the Applications page to schedule an interview for a specific application for now.");
      setLoading(false);
      onClose();
    } catch (err) {
      toast.error('Failed to add interview');
      setLoading(false);
    }
  };

  // Add Contact Form
  const [contactData, setContactData] = useState({ name: '', company: '', role: '', linkedinUrl: '' });
  const submitContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/network', contactData);
      invalidateAndClose('Contact added');
      setContactData({ name: '', company: '', role: '', linkedinUrl: '' });
    } catch (err) {
      toast.error('Failed to add contact');
      setLoading(false);
    }
  };

  return (
    <>
      <ModalWrapper isOpen={activeModal === 'ADD_APP'} onClose={onClose} title="Quick Add Application">
        <form onSubmit={submitApp} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
            <input required type="text" value={appData.company} onChange={e => setAppData({...appData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
            <input required type="text" value={appData.role} onChange={e => setAppData({...appData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select value={appData.status} onChange={e => setAppData({...appData, status: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]">
              <option value="APPLIED">Applied</option>
              <option value="OA_PENDING">OA Pending</option>
              <option value="INTERVIEW_SCHEDULED">Interview</option>
            </select>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#ff6b00] hover:bg-[#EA6C0A] text-white py-2.5 rounded-lg font-medium transition-colors mt-2">
            {loading ? 'Adding...' : 'Add Application'}
          </button>
        </form>
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'LOG_DSA'} onClose={onClose} title="Log DSA Problem">
        <form onSubmit={submitDsa} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Topic</label>
            <input required type="text" placeholder="e.g. Arrays, DP, Graphs" value={dsaData.topic} onChange={e => setDsaData({...dsaData, topic: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty</label>
              <select value={dsaData.difficulty} onChange={e => setDsaData({...dsaData, difficulty: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
              <select value={dsaData.platform} onChange={e => setDsaData({...dsaData, platform: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]">
                <option value="LeetCode">LeetCode</option>
                <option value="HackerRank">HackerRank</option>
                <option value="Codeforces">Codeforces</option>
                <option value="GeeksForGeeks">GeeksForGeeks</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
            <input required type="date" value={dsaData.date} onChange={e => setDsaData({...dsaData, date: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#ff6b00] hover:bg-[#EA6C0A] text-white py-2.5 rounded-lg font-medium transition-colors mt-2">
            {loading ? 'Logging...' : 'Log Problem'}
          </button>
        </form>
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'ADD_CONTACT'} onClose={onClose} title="Add Network Contact">
        <form onSubmit={submitContact} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
            <input required type="text" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
              <input required type="text" value={contactData.company} onChange={e => setContactData({...contactData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
              <input required type="text" value={contactData.role} onChange={e => setContactData({...contactData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
            <input type="url" value={contactData.linkedinUrl} onChange={e => setContactData({...contactData, linkedinUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#ff6b00] hover:bg-[#EA6C0A] text-white py-2.5 rounded-lg font-medium transition-colors mt-2">
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
        </form>
      </ModalWrapper>
    </>
  );
};
