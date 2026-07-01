import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, Activity, Trophy, Briefcase, BookOpen, Clock } from 'lucide-react';
import api from '../services/api';

const fetchStudentProfile = async (studentId) => {
  const { data } = await api.get(`/social/profile/${studentId}`);
  return data;
};

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => fetchStudentProfile(studentId)
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (isFollowing) => {
      if (isFollowing) {
        await api.post(`/social/unfollow/${studentId}`);
      } else {
        await api.post(`/social/follow/${studentId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-8 flex justify-center items-center h-full flex-col text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Student Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-[#ff6b00] hover:underline">Go Back</button>
      </div>
    );
  }

  const { user, stats, isFollowing, recentActivity } = data;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white mb-6">← Back</button>
      
      {/* Header Profile Card */}
      <div className="glass-card p-8 rounded-3xl border border-white/5 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b00] to-orange-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#ff6b00]/20 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white mb-2">{user.name}</h1>
            {user.bio && <p className="text-slate-300 max-w-2xl">{user.bio}</p>}
            
            <div className="flex gap-6 mt-4 text-sm font-medium">
              <div className="flex flex-col">
                <span className="text-white text-lg font-bold">{stats.followers}</span>
                <span className="text-slate-400">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-lg font-bold">{stats.following}</span>
                <span className="text-slate-400">Following</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => toggleFollowMutation.mutate(isFollowing)}
            disabled={toggleFollowMutation.isPending}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ${
              isFollowing 
                ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 border border-white/10' 
                : 'bg-[#ff6b00] text-white hover:bg-[#e66000] border border-transparent shadow-lg shadow-[#ff6b00]/20'
            }`}
          >
            {isFollowing ? (
              <><UserMinus className="w-4 h-4" /> Unfollow</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Follow</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400"/> Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Resources</span>
                <span className="font-bold text-white">{stats.resourcesCompleted}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Applications</span>
                <span className="font-bold text-white">{stats.applicationsLogged}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-2"><Activity className="w-4 h-4"/> Interviews</span>
                <span className="font-bold text-white">{stats.interviewsLogged}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-2xl border border-white/5 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400"/> Recent Activity</h3>
            
            {recentActivity.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {recentActivity.map((activity) => (
                  <div key={activity._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#13141f] text-slate-500 group-[.is-active]:text-[#ff6b00] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {activity.actionType === 'COMPLETED_RESOURCE' ? <BookOpen className="w-4 h-4" /> : 
                       activity.actionType === 'ADDED_APPLICATION' ? <Briefcase className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-sm group-hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">
                          {activity.actionType === 'COMPLETED_RESOURCE' && 'Completed a resource'}
                          {activity.actionType === 'ADDED_APPLICATION' && `Applied at ${activity.metadata?.company}`}
                          {activity.actionType === 'LOGGED_INTERVIEW' && 'Logged an interview'}
                        </span>
                        <time className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(activity.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-sm text-slate-300">
                        {activity.metadata?.resourceTitle || activity.metadata?.role || 'Activity details hidden.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
