import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Code, Zap, AlertTriangle, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import useDSASessionStore from '../../store/dsaSessionStore';

const QuickLogModal = ({ isOpen, onClose, initialTitle }) => {
  const queryClient = useQueryClient();
  const sessionStore = useDSASessionStore();

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    topic: 'Arrays',
    difficulty: 'MEDIUM',
    platform: 'LEETCODE',
    timeToApproach: '',
    timeToSolve: '',
    confidenceLevel: 'OKAY',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, title: initialTitle || '' }));
    }
  }, [isOpen, initialTitle]);

  const { data: mistakesData } = useQuery({
    queryKey: ['dsa', 'mistake-patterns'],
    queryFn: async () => {
      const res = await api.get('/dsa/mistake-patterns');
      return res.data;
    },
    enabled: isOpen
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/dsa/problems', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['dsa']);
      if (sessionStore.isActive) {
        sessionStore.logSolve(data.topic);
      }
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Quick Log</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); logMutation.mutate(formData); }} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Problem Title *</label>
              <input 
                type="text" 
                required
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Topic *</label>
                <select 
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                >
                  <option value="Arrays">Arrays</option>
                  <option value="Two Pointers">Two Pointers</option>
                  <option value="Sliding Window">Sliding Window</option>
                  <option value="Stack">Stack</option>
                  <option value="Binary Search">Binary Search</option>
                  <option value="Linked List">Linked List</option>
                  <option value="Trees">Trees</option>
                  <option value="Graphs">Graphs</option>
                  <option value="Dynamic Programming">Dynamic Programming</option>
                  <option value="Backtracking">Backtracking</option>
                  <option value="Greedy">Greedy</option>
                  <option value="Heap">Heap</option>
                  <option value="Tries">Tries</option>
                  <option value="Math">Math</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                <select 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1" title="Time to first correct approach">Approach (min)</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  value={formData.timeToApproach}
                  onChange={e => setFormData({...formData, timeToApproach: e.target.value})}
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Total Time (min)</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  value={formData.timeToSolve}
                  onChange={e => setFormData({...formData, timeToSolve: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confidence</label>
                <select 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  value={formData.confidenceLevel}
                  onChange={e => setFormData({...formData, confidenceLevel: e.target.value})}
                >
                  <option value="SHAKY">Shaky</option>
                  <option value="OKAY">Okay</option>
                  <option value="SOLID">Solid</option>
                  <option value="MASTERED">Mastered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Quick Notes</label>
              <input 
                type="text" 
                placeholder="What was the trick?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            {/* Before You Submit Checklist */}
            {mistakesData?.recentMistakes?.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-2">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Before you submit checklist
                </h3>
                <div className="space-y-1">
                  {mistakesData.recentMistakes.slice(0, 3).map((m, idx) => (
                    <label key={idx} className="flex items-start gap-2 cursor-pointer group">
                      <input type="checkbox" className="mt-1 accent-rose-500 rounded bg-gray-800 border-gray-700" />
                      <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{m.correctionInsight}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={logMutation.isPending}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {logMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Log It</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickLogModal;
