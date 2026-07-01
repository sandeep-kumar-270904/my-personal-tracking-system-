import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Target } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const WeaknessRadar = () => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['dsa', 'weakness-analysis'],
    queryFn: async () => {
      const res = await api.get('/dsa/weakness-analysis');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;
  }

  // Transform data for radar chart
  const radarData = [];
  
  if (analysis?.weakTopics?.length > 0) {
    analysis.weakTopics.slice(0, 6).forEach(topic => {
      radarData.push({
        subject: topic.topicName,
        score: topic.weaknessScore,
        fullMark: 100
      });
    });
  } else {
    // Dummy if no data
    radarData.push(
      { subject: 'Dynamic Programming', score: 80, fullMark: 100 },
      { subject: 'Graphs', score: 90, fullMark: 100 },
      { subject: 'Trees', score: 40, fullMark: 100 },
      { subject: 'Two Pointers', score: 30, fullMark: 100 },
      { subject: 'Sliding Window', score: 50, fullMark: 100 },
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-10">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-bold text-white">Weakness Profile</h2>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
              itemStyle={{ color: '#F87171' }}
            />
            <Radar
              name="Weakness Score"
              dataKey="score"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex flex-col gap-2">
        {analysis?.recommendedFocus?.slice(0,2).map((focus, i) => (
          <div key={i} className="text-sm bg-red-900/20 text-red-400 p-3 rounded-lg border border-red-900/50">
            <span className="font-semibold">{focus.topic}:</span> {focus.reason}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeaknessRadar;
