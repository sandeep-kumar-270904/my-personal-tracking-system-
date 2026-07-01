import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Target, Plus, CheckCircle2, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudyPlannerTab = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    timelineWeeks: 4,
    hoursPerDay: 2,
    preferences: ''
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ['my_study_plan'],
    queryFn: async () => {
      const res = await api.get('/study-plan/my-plan');
      return res.data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const prefsArray = data.preferences.split(',').map(p => p.trim()).filter(Boolean);
      return await api.post('/study-plan/generate', { ...data, preferences: prefsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my_study_plan']);
      setIsCreating(false);
      toast.success('Study plan generated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate plan')
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ weekNumber, taskId, completed }) => {
      return await api.patch(`/study-plan/${plan._id}/week/${weekNumber}/task/${taskId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my_study_plan']);
      queryClient.invalidateQueries(['gamification', 'badges']);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async () => await api.delete(`/study-plan/${plan._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my_study_plan']);
      toast.success('Study plan deleted');
    }
  });

  if (isLoading) {
    return <div className="animate-pulse text-slate-500">Loading study plan...</div>;
  }

  if (!plan && !isCreating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
          <Calendar className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Smart Study Planner</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          Generate a personalized, AI-driven study schedule tailored to your exact timeline, goals, and availability.
        </p>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Generate New Plan
        </button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-[#13141f] border border-white/10 p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">Create Your Study Plan</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">What is your main goal?</label>
            <input 
              type="text" 
              value={formData.goal}
              onChange={e => setFormData({...formData, goal: e.target.value})}
              placeholder="e.g. Master dynamic programming, Prepare for Google onsite..."
              className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Timeline (Weeks)</label>
              <input 
                type="number" 
                min={1} max={52}
                value={formData.timelineWeeks}
                onChange={e => setFormData({...formData, timelineWeeks: parseInt(e.target.value)})}
                className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Hours per Day</label>
              <input 
                type="number" 
                min={1} max={16}
                value={formData.hoursPerDay}
                onChange={e => setFormData({...formData, hoursPerDay: parseInt(e.target.value)})}
                className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Preferences (comma separated)</label>
            <input 
              type="text" 
              value={formData.preferences}
              onChange={e => setFormData({...formData, preferences: e.target.value})}
              placeholder="e.g. emphasize system design, python only, highly theoretical..."
              className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => generateMutation.mutate(formData)}
              disabled={!formData.goal.trim() || generateMutation.isPending}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {generateMutation.isPending ? 'AI is Generating...' : 'Generate Plan'}
            </button>
            <button 
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall progress
  const totalTasks = plan.plan.reduce((acc, week) => acc + week.tasks.length, 0);
  const completedTasks = plan.plan.reduce((acc, week) => acc + week.tasks.filter(t => t.completed).length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="bg-[#13141f] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white mb-2">{plan.goal}</h2>
            <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-400" /> {plan.timelineWeeks} Weeks</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> {plan.hoursPerDay} hrs/day</span>
              <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-amber-400" /> {plan.preferences.length > 0 ? plan.preferences.join(', ') : 'Standard'}</span>
            </div>
          </div>
          <button 
            onClick={() => { if(confirm('Delete current plan?')) deletePlanMutation.mutate(); }}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" 
              style={{ width: \`\${progressPercent}%\` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Weeks List */}
      <div className="space-y-3">
        {plan.plan.map((week) => {
          const isExpanded = expandedWeek === week.week;
          const weekCompleted = week.tasks.filter(t => t.completed).length;
          const weekTotal = week.tasks.length;
          const isAllDone = weekTotal > 0 && weekCompleted === weekTotal;

          return (
            <div key={week.week} className="bg-[#13141f] border border-white/10 rounded-xl overflow-hidden">
              <button 
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isAllDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                    W{week.week}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${isAllDone ? 'text-emerald-100' : 'text-white'}`}>{week.focus}</p>
                    <p className="text-xs text-slate-500">{weekCompleted} / {weekTotal} Tasks</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-[#0a0a0f]"
                  >
                    <div className="p-4 space-y-2">
                      {week.tasks.map((task) => (
                        <div key={task._id} className={`flex items-start gap-3 p-3 rounded-lg border ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#1a1b26] border-white/5'} transition-colors`}>
                          <button 
                            onClick={() => completeTaskMutation.mutate({ weekNumber: week.week, taskId: task._id, completed: !task.completed })}
                            disabled={completeTaskMutation.isPending}
                            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-[#13141f] border-white/20 text-transparent hover:border-emerald-500/50'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                          <div>
                            <p className={`text-sm font-medium ${task.completed ? 'text-emerald-200 line-through opacity-70' : 'text-slate-200'}`}>{task.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlannerTab;
