import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Code2, Users, Target, BookOpen, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PrepSyllabusDrawer = ({ isOpen, onClose, syllabus }) => {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Endpoint could be added to prepHubRoutes, or we can just mock the UI update for now
      // Assuming a PUT /api/prephub/syllabus/:id is created to toggle completion
      // For now, let's just show a toast
      toast.success('Syllabus marked as completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prepSyllabuses']);
      onClose();
    }
  });

  if (!isOpen || !syllabus) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{syllabus.company}</h2>
                <p className="text-sm text-[#ff6b00] font-medium">{syllabus.role} Prep</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${syllabus.isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {syllabus.isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Weak Topics Targeted */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" /> Targeted DSA Areas
              </h3>
              <div className="space-y-3">
                {syllabus.dsaTopics?.map((topic, i) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <p className="font-semibold text-white mb-1">{topic.topic}</p>
                    <p className="text-sm text-slate-400">{topic.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Problems */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" /> Recommended Problems
              </h3>
              <div className="space-y-3">
                {syllabus.recommendedProblems?.map((prob, i) => (
                  <a 
                    key={i} 
                    href={prob.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10 rounded-xl p-4 transition-colors group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{prob.title}</p>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                    </div>
                    <span className={`text-xs font-bold ${prob.difficulty === 'Easy' ? 'text-green-400' : prob.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                      {prob.difficulty}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Behavioral Questions */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Behavioral Questions
              </h3>
              <div className="space-y-3">
                {syllabus.behavioralQuestions?.map((bq, i) => (
                  <div key={i} className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                    <p className="text-sm text-white mb-2 leading-relaxed">{bq.question}</p>
                    <div className="inline-flex items-center px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs font-semibold">
                      Testing: {bq.valueTested}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <button 
              onClick={() => completeMutation.mutate()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" /> Mark as Completed
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PrepSyllabusDrawer;
