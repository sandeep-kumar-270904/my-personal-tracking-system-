import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Target, Activity, Calendar as CalIcon, Users, FileText, Briefcase, TrendingUp, Trophy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STATUS_COLORS = {
  GOOD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  URGENT: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

const ICONS = {
  resume: <FileText className="w-5 h-5" />,
  applications: <Briefcase className="w-5 h-5" />,
  interviews: <Target className="w-5 h-5" />,
  contests: <Trophy className="w-5 h-5" />,
  goals: <TrendingUp className="w-5 h-5" />,
  calendar: <CalIcon className="w-5 h-5" />,
  networking: <Users className="w-5 h-5" />,
  offers: <CheckCircle className="w-5 h-5" />,
  prephub: <Activity className="w-5 h-5" />
};

const DSACommandCenter = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dsa-command-center'],
    queryFn: async () => {
      const res = await api.get('/dsa/command-center');
      return res.data;
    }
  });

  if (isLoading || !data) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }

  const { healthScore, briefing, panels } = data;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dsa')} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">DSA Command Center</h1>
            <p className="text-gray-400">Unified preparation intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-400">Health Score</div>
            <div className={`text-4xl font-black ${healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
              {healthScore}
            </div>
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="max-w-7xl mx-auto mb-8 bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl">
        <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Daily Briefing</h3>
        <p className="text-indigo-100 text-lg leading-relaxed">{briefing}</p>
      </div>

      {/* 3x3 Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(panels).map(([key, panel]) => (
          <div key={key} className={`p-6 rounded-2xl border bg-gray-900/50 backdrop-blur flex flex-col justify-between ${STATUS_COLORS[panel.status].split(' ')[2]}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${STATUS_COLORS[panel.status].split(' ').slice(0,2).join(' ')}`}>
                    {ICONS[key]}
                  </div>
                  <h3 className="font-bold text-white capitalize">{key}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${STATUS_COLORS[panel.status]}`}>
                  {panel.status}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-6">
                {/* Mock descriptive text based on key and status */}
                {panel.status === 'GOOD' ? 'All signals positive. No immediate action required.' : 
                 panel.status === 'WARNING' ? 'Some attention needed. Review recommendations.' : 
                 'Urgent action required to prevent gap.'}
              </div>
            </div>
            <button onClick={() => navigate(`/${key}`)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors">
              Manage {key}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DSACommandCenter;
