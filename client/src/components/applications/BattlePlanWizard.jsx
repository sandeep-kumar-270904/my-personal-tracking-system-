import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Flag, Play, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BattlePlanWizard = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState('EXPLORATION');
  const [targetRole, setTargetRole] = useState('');
  const [primaryStrategy, setPrimaryStrategy] = useState('');
  const [weeklyGoalApplications, setWeeklyGoalApplications] = useState(10);
  const [weeklyGoalColdEmails, setWeeklyGoalColdEmails] = useState(5);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['battlePlan'],
    queryFn: async () => {
      const res = await api.get('/applications/battle-plan');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post('/applications/battle-plan', {
        phase,
        targetRole,
        primaryStrategy,
        weeklyGoalApplications,
        weeklyGoalColdEmails
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['battlePlan']);
      toast.success('Battle Plan Active!');
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-[#ff6b00]" /> Placement Battle Plan
        </h2>
        
        {isLoading ? (
          <div className="animate-pulse h-40 bg-white/5 rounded-xl"></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Current Phase</label>
              <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white">
                <option value="EXPLORATION">Exploration (Applying everywhere)</option>
                <option value="FOCUS">Focus (Targeting specific roles)</option>
                <option value="INTERVIEW_PREP">Interview Prep (Heavy DSA/System Design)</option>
                <option value="NEGOTIATION">Negotiation (Closing offers)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Target Role(s)</label>
              <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Frontend Engineer, SDE-1" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Primary Strategy</label>
              <input type="text" value={primaryStrategy} onChange={e => setPrimaryStrategy(e.target.value)} placeholder="e.g. Cold email CTOs at Series A startups" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Weekly App Goal</label>
                <input type="number" value={weeklyGoalApplications} onChange={e => setWeeklyGoalApplications(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Weekly Cold Email Goal</label>
                <input type="number" value={weeklyGoalColdEmails} onChange={e => setWeeklyGoalColdEmails(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading} className="btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" /> Activate Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePlanWizard;
