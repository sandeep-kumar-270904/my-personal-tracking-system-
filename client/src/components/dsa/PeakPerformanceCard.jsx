import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, Zap } from 'lucide-react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const PeakPerformanceCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'time-analytics'],
    queryFn: async () => {
      const res = await api.get('/dsa/time-analytics');
      return res.data;
    }
  });

  if (isLoading) return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;
  if (!data || data.message) return null;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = [0,1,2,3,4,5,6].map(d => ({
    name: days[d],
    problems: data.dailyProblems?.[d]?.problems || 0
  }));

  const formatHour = (h) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400 fill-current" />
        Peak Performance
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Best Focus Hour
          </div>
          <div className="text-2xl font-black text-white">
            {data.bestTimeOfDay !== null ? formatHour(data.bestTimeOfDay) : 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Most Productive Day
          </div>
          <div className="text-2xl font-black text-white">
            {data.bestDayOfWeek !== null ? days[data.bestDayOfWeek] : 'N/A'}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-400 mb-4">Problems by Day of Week</h4>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                cursor={{ fill: '#374151', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="problems" radius={[4, 4, 0, 0]}>
                {dayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === data.bestDayOfWeek ? '#fbbf24' : '#4b5563'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PeakPerformanceCard;
