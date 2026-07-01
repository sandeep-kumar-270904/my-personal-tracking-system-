import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Target, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const PersonalizedCurriculumTimeline = () => {
  const queryClient = useQueryClient();
  const { data: curriculum, isLoading } = useQuery({
    queryKey: ['dsa', 'curriculum'],
    queryFn: async () => {
      const res = await api.get('/dsa/curriculum');
      return res.data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/dsa/generate-curriculum', {
        targetCompanies: ['Google', 'Microsoft'],
        placementDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days out
        availableHoursPerWeek: 15
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dsa', 'curriculum']);
    }
  });

  if (isLoading) return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;

  if (!curriculum || !curriculum.weeklyPlan || curriculum.weeklyPlan.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Calendar className="w-10 h-10 text-emerald-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Personalized Curriculum</h2>
        <p className="text-gray-400 text-center text-sm max-w-md mb-6">
          Generate a week-by-week LLM-powered curriculum tailored to your specific weaknesses and placement deadlines.
        </p>
        <button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate 12-Week Plan'}
        </button>
      </div>
    );
  }

  // Find current week index
  const currentWeekIdx = Math.max(0, curriculum.currentWeek - 1);
  const currentPlan = curriculum.weeklyPlan[currentWeekIdx];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">My Curriculum</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium bg-gray-800 px-2 py-1 rounded-full">Week {curriculum.currentWeek} of {curriculum.weeklyPlan.length}</span>
      </div>

      {/* Timeline tracker */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-800 -z-10 -translate-y-1/2"></div>
        {curriculum.weeklyPlan.map((week, idx) => (
          <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < currentWeekIdx ? 'bg-emerald-500 text-white' : idx === currentWeekIdx ? 'bg-gray-900 border-2 border-emerald-500 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
            {idx < currentWeekIdx ? <CheckCircle className="w-3 h-3" /> : week.weekNumber}
          </div>
        ))}
      </div>

      {currentPlan && (
        <div className="bg-gray-800/50 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            Focus: {currentPlan.focusTopic}
          </h3>
          <p className="text-sm text-gray-400 mb-6">Secondary: {currentPlan.secondaryTopic}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Weekly Milestone</span>
              <p className="text-sm text-emerald-300 font-medium">{currentPlan.weeklyMilestone}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Patterns to Drill</span>
              <p className="text-sm text-white font-medium">{currentPlan.patternsToDrill?.join(', ') || 'Various'}</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-3">Recommended Problems</span>
            <div className="space-y-2">
              {(currentPlan.specificProblemsRecommended || ['Merge Intervals', 'Insert Interval']).map((prob, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-700/30 rounded-lg transition-colors group">
                  <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{prob.title || prob}</span>
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold">
                    Log <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedCurriculumTimeline;
