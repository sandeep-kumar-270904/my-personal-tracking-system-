import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Save, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WeeklyReviewWizard = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [reflection, setReflection] = useState('');
  const [bottleneck, setBottleneck] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['weeklyReviewData'],
    queryFn: async () => {
      const res = await api.get('/applications/weekly-review');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post('/applications/weekly-review', { reflection, bottleneck });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['weeklyReviewData']);
      toast.success('Weekly Review Completed!');
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6 text-emerald-400" /> Weekly Review
        </h2>
        <p className="text-slate-400 text-sm mb-6">Take a step back and look at the big picture.</p>
        
        {isLoading ? (
          <div className="animate-pulse h-64 bg-white/5 rounded-xl"></div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-3xl font-bold text-blue-400">{data?.stats?.totalEffortMinutes || 0}m</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Effort Logged</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-3xl font-bold text-emerald-400">{data?.stats?.interviewsScheduled || 0}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Interviews</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-3xl font-bold text-red-400">{data?.stats?.rejections || 0}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Rejections</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">What went well this week? What didn't?</label>
              <textarea 
                value={reflection} 
                onChange={e => setReflection(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white h-24 custom-scrollbar" 
                placeholder="I got a referral for Google, but failed the Amazon OA..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">What is your biggest bottleneck right now?</label>
              <select value={bottleneck} onChange={e => setBottleneck(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white">
                <option value="">Select bottleneck...</option>
                <option value="RESUME">Resume isn't getting shortlisted</option>
                <option value="OA">Failing Online Assessments (DSA)</option>
                <option value="INTERVIEW">Failing Interviews (Communication/System Design)</option>
                <option value="MOTIVATION">Burnt out / Not applying enough</option>
              </select>
            </div>

            <div className="bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded-xl p-4">
              <h4 className="font-bold text-[#ff6b00] mb-2 flex items-center gap-2">AI Suggestion based on bottleneck</h4>
              <p className="text-sm text-slate-300">
                {bottleneck === 'RESUME' && "Your resume isn't passing ATS. Try adding more quantifiable metrics to your bullets and matching keywords to the JD."}
                {bottleneck === 'OA' && "You need to focus on LeetCode patterns. Dedicate 2 hours daily to blind 75 list."}
                {bottleneck === 'INTERVIEW' && "Do mock interviews. Record yourself answering behavioral questions using the STAR method."}
                {bottleneck === 'MOTIVATION' && "Take a 2-day break. Completely disconnect. Then set a tiny goal: 1 application per day."}
                {!bottleneck && "Select a bottleneck to get actionable advice."}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading || !reflection || !bottleneck} className="btn-primary flex items-center gap-2">
            <Check className="w-4 h-4" /> Save Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReviewWizard;
