import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BookOpen, ExternalLink } from 'lucide-react';

const DSATrackerWidget = ({ activeTopic }) => {
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['prephub_resources_topic', activeTopic],
    queryFn: async () => {
      // Just fetch all DSA resources and filter on frontend for simplicity
      const res = await api.get('/resources');
      return res.data.filter(r => r.category === 'DSA').slice(0, 2); 
      // In a real scenario, we'd search specifically for activeTopic in title/desc
    },
    enabled: !!activeTopic
  });

  if (!activeTopic) return null;

  return (
    <div className="bg-[#1a1b26] border border-[#ff6b00]/30 rounded-xl p-5 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b00]/5 rounded-bl-full pointer-events-none"></div>
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 relative z-10">
        <BookOpen className="w-5 h-5 text-[#ff6b00]" />
        PrepHub Resources
      </h3>
      <p className="text-xs text-slate-400 mb-4 relative z-10">
        Recommended study materials for <span className="font-bold text-[#ff6b00]">{activeTopic}</span>
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-3 relative z-10">
          {resources.map(res => (
            <a 
              key={res._id} 
              href={`/resources`}
              className="block p-3 bg-[#13141f] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#ff6b00] transition-colors">{res.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{res.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#ff6b00] shrink-0 ml-2" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">No specific resources found for this topic.</div>
      )}
    </div>
  );
};

export default DSATrackerWidget;
