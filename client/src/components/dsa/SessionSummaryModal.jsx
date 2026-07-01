import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, X } from 'lucide-react';
import api from '../../services/api';
import useDSASessionStore from '../../store/dsaSessionStore';

const SessionSummaryModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const sessionStore = useDSASessionStore();
  const [notes, setNotes] = useState('');

  const endSessionMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/dsa/study-session/end', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dsa']);
      sessionStore.endSession();
      onClose();
    }
  });

  const handleEnd = () => {
    endSessionMutation.mutate({
      notes,
      problemsAttempted: sessionStore.problemsAttempted,
      problemsSolved: sessionStore.problemsSolved
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
            <p className="text-gray-400 mt-1">Great job focusing.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className="bg-gray-800 p-4 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Attempted</p>
              <p className="text-2xl font-bold text-white">{sessionStore.problemsAttempted}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Solved</p>
              <p className="text-2xl font-bold text-green-400">{sessionStore.problemsSolved}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Session Notes (Optional)</label>
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[80px]"
              placeholder="What went well? What was hard?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            onClick={handleEnd}
            disabled={endSessionMutation.isPending}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {endSessionMutation.isPending ? 'Saving...' : 'Save & Close'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SessionSummaryModal;
