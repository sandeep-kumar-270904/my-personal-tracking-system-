import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { AlertTriangle, ExternalLink, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DSAStrugglingBanner = ({ activeCategory }) => {
  const navigate = useNavigate();

  const { data: weaknessData } = useQuery({
    queryKey: ['dsa_weakness_analysis'],
    queryFn: async () => {
      const res = await api.get('/dsa/weakness-analysis');
      return res.data;
    },
    enabled: activeCategory === 'DSA'
  });

  const { data: recommendedResources = [] } = useQuery({
    queryKey: ['struggling_resources', weaknessData?.recommendedFocus?.[0]?.topic],
    queryFn: async () => {
      const topic = weaknessData.recommendedFocus[0].topic;
      const res = await api.get('/resources');
      // Simple frontend filter for relevance
      const relevant = res.data.filter(r => 
        r.category === 'DSA' && 
        (r.title.toLowerCase().includes(topic.toLowerCase()) || 
         r.description.toLowerCase().includes(topic.toLowerCase()))
      );
      return relevant.slice(0, 2);
    },
    enabled: !!weaknessData?.recommendedFocus?.[0]?.topic && activeCategory === 'DSA'
  });

  if (activeCategory !== 'DSA') return null;
  if (!weaknessData?.recommendedFocus || weaknessData.recommendedFocus.length === 0) return null;

  const strugglingTopic = weaknessData.recommendedFocus[0].topic;

  return (
    <div className="bg-[#1a1b26]/80 border-l-4 border-[#eab308] rounded-xl p-5 mb-8 flex flex-col md:flex-row gap-6 items-start backdrop-blur-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-[#eab308]" />
          <h3 className="text-lg font-bold text-white">Struggling with {strugglingTopic}?</h3>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          Your DSA Tracker shows you're facing difficulties with {strugglingTopic}. These resources might help bridge the gap:
        </p>
      </div>

      {recommendedResources.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          {recommendedResources.map(res => (
            <div key={res._id} onClick={() => navigate(`/resources?preview=${res._id}`)} className="bg-[#13141f] border border-white/10 hover:border-[#eab308]/50 p-3 rounded-lg cursor-pointer transition-colors w-full sm:w-64 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[#eab308]">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-bold truncate group-hover:text-[#eab308] transition-colors">{res.title}</h4>
                <p className="text-slate-400 text-xs truncate">{res.difficulty}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DSAStrugglingBanner;
