import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Crosshair } from 'lucide-react';
import api from '../../services/api';

const DifficultyCalibrationScatter = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'difficulty-calibration'],
    queryFn: async () => {
      const res = await api.get('/dsa/difficulty-calibration');
      return res.data;
    }
  });

  if (isLoading) return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;

  // Mock data if API doesn't return anything yet
  const chartData = data?.length > 0 ? data.map(d => ({
    x: d.officialDifficulty === 'EASY' ? 1 : d.officialDifficulty === 'MEDIUM' ? 2 : 3,
    y: d.personalDifficulty,
    name: d.title,
    topic: d.topic
  })) : [
    { x: 1, y: 3, name: 'Two Sum', topic: 'Arrays' },
    { x: 2, y: 8, name: 'LRU Cache', topic: 'Design' },
    { x: 2, y: 4, name: 'Number of Islands', topic: 'Graphs' },
    { x: 3, y: 9, name: 'Merge K Sorted Lists', topic: 'Linked List' },
    { x: 1, y: 7, name: 'Valid Parentheses', topic: 'Stacks' }, // Found hard
    { x: 3, y: 4, name: 'N-Queens', topic: 'Backtracking' }, // Found easy
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold text-sm">{d.name}</p>
          <p className="text-gray-400 text-xs mb-2">{d.topic}</p>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-gray-500">Official: {d.x === 1 ? 'EASY' : d.x === 2 ? 'MEDIUM' : 'HARD'}</span>
            <span className="text-cyan-400 font-bold">Felt Like: {d.y}/10</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Crosshair className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Personal Difficulty Map</h2>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Official Difficulty" 
              domain={[0.5, 3.5]} 
              ticks={[1, 2, 3]} 
              tickFormatter={(val) => val === 1 ? 'EASY' : val === 2 ? 'MEDIUM' : 'HARD'}
              stroke="#4b5563" 
              tick={{fill: '#9ca3af', fontSize: 12}} 
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Personal Difficulty" 
              domain={[0, 10]} 
              stroke="#4b5563" 
              tick={{fill: '#9ca3af', fontSize: 12}} 
            />
            <ZAxis type="number" range={[50, 50]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Problems" data={chartData} fill="#818cf8" opacity={0.8} />
            
            {/* Trend line / Perfect alignment line */}
            <line x1="1" y1="2" x2="3" y2="8" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" opacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Dots above the orange line represent problems that felt harder than their official rating.
      </p>
    </div>
  );
};

export default DifficultyCalibrationScatter;
