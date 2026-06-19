import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const LeetCodeSyncModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState('LEETCODE');
  const [username, setUsername] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const syncMutation = useMutation({
    mutationFn: async (data) => {
      const endpoint = data.platform === 'LEETCODE' ? '/dsa/sync/leetcode' : '/dsa/sync/gfg';
      const payload = data.platform === 'LEETCODE' ? { leetcodeUsername: data.username } : { gfgUsername: data.username };
      const res = await api.post(endpoint, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setStatusMsg(data.message);
      queryClient.invalidateQueries(['dsa']);
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 3000);
    },
    onError: (err) => {
      setStatusMsg(err.response?.data?.message || 'Sync failed');
    }
  });

  const handleSync = (e) => {
    e.preventDefault();
    setStatusMsg('');
    syncMutation.mutate({ platform, username });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              Connect Platform
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSync} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                type="button" 
                onClick={() => setPlatform('LEETCODE')}
                className={`py-2 rounded-lg font-semibold text-sm border ${platform === 'LEETCODE' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                LeetCode
              </button>
              <button 
                type="button" 
                onClick={() => setPlatform('GFG')}
                className={`py-2 rounded-lg font-semibold text-sm border ${platform === 'GFG' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                GeeksForGeeks
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{platform} Username</label>
              <input 
                type="text" 
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={platform === 'LEETCODE' ? 'e.g. neetcode' : 'e.g. coder123'}
              />
            </div>

            {statusMsg && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${syncMutation.isError ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {syncMutation.isError ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <p>{statusMsg}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={syncMutation.isPending}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {syncMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Syncing...</> : 'Connect & Sync'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LeetCodeSyncModal;
