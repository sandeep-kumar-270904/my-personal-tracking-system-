import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, BookOpen, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import EmptyState from '../EmptyState';

const fetchActivityFeed = async () => {
  const { data } = await api.get('/social/feed');
  return data;
};

const FollowingFeed = () => {
  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['activityFeed'],
    queryFn: fetchActivityFeed
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (feed.length === 0) {
    return (
      <EmptyState 
        icon={Activity} 
        heading="No recent activity" 
        subtext="Follow other students to see their activity here." 
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {feed.map((activity) => (
          <div key={activity._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#13141f] text-slate-500 group-[.is-active]:text-[#ff6b00] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              {activity.actionType === 'COMPLETED_RESOURCE' ? <BookOpen className="w-4 h-4" /> : 
               activity.actionType === 'ADDED_APPLICATION' ? <Briefcase className="w-4 h-4" /> :
               <Activity className="w-4 h-4" />}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-sm group-hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Link to={`/network/student/${activity.user._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b00] to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#ff6b00]/20">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-white text-sm">{activity.user.name}</span>
                </Link>
                <time className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(activity.createdAt).toLocaleDateString()}
                </time>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-sm text-slate-300 font-medium mb-1">
                  {activity.actionType === 'COMPLETED_RESOURCE' && 'Completed a resource'}
                  {activity.actionType === 'ADDED_APPLICATION' && `Applied at ${activity.metadata?.company}`}
                  {activity.actionType === 'LOGGED_INTERVIEW' && 'Logged an interview'}
                </p>
                <p className="text-xs text-slate-400">
                  {activity.metadata?.resourceTitle || activity.metadata?.role || ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowingFeed;
