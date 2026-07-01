import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Archive, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const OfferArchiveGoalsModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/goals/archive-active');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['goals']);
      toast.success(`Archived ${data.count} active goals.`);
      onClose(true); // pass true to indicate it was handled
    },
    onError: () => toast.error('Failed to archive goals')
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#13141f] border border-emerald-500/30 p-8 rounded-2xl w-full max-w-md relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <button 
            onClick={() => onClose(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Target className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Congrats on the offer! 🎉</h3>
            <p className="text-slate-400 text-sm">
              Since you've accepted an offer, do you still want to be nudged about your placement prep targets? You can archive your active goals to pause tracking, or keep them if you're still exploring options.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
            >
              {archiveMutation.isPending ? (
                <div className="w-5 h-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Archive className="w-5 h-5" />
                  Archive Active Goals
                </>
              )}
            </button>
            <button
              onClick={() => onClose(true)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Keep Tracking
            </button>
          </div>
          
          <p className="text-xs text-slate-500 text-center mt-4">
            Archiving preserves all history for your Season Retrospective.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfferArchiveGoalsModal;
