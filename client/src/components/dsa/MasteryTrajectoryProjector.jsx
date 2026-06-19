import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Target, Rocket, Sliders } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../services/api';

const MasteryTrajectoryProjector = () => {
  const [simulatedPPD, setSimulatedPPD] = useState(2); // Problems per day

  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'trajectory'],
    queryFn: async () => {
      const res = await api.get('/dsa/trajectory');
      return res.data;
    }
  });

  if (isLoading) return <div className="h-64 bg-gray-900 rounded-2xl animate-pulse"></div>;

  // Generate chart data based on simulated PPD
  const generateChartData = () => {
    const startScore = 40;
    const targetScore = 80;
    
    return [
      { day: 0, current: startScore, simulated: startScore, target: startScore },
      { day: 30, current: 50, simulated: Math.min(100, startScore + (simulatedPPD * 5)), target: 55 },
      { day: 60, current: 65, simulated: Math.min(100, startScore + (simulatedPPD * 12)), target: 70 },
      { day: 90, current: 75, simulated: Math.min(100, startScore + (simulatedPPD * 20)), target: 85 },
    ];
  };

  const chartData = generateChartData();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Long-term Mastery Arc
          </h2>
          <p className="text-gray-400 text-sm">Where you will be in 90 days at your current pace.</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-4 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">What if: Practice Pace</span>
              <span className="text-cyan-400 font-bold">{simulatedPPD} prob/day</span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="1" 
              value={simulatedPPD} 
              onChange={(e) => setSimulatedPPD(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `Day ${val}`} />
            <YAxis stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Ready for Placements (80)', fill: '#f59e0b', fontSize: 12 }} />
            <Area type="monotone" dataKey="target" stroke="#10b981" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorTarget)" name="Required Pace" />
            <Area type="monotone" dataKey="simulated" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSimulated)" name="Projected Pace" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[30, 60, 90].map((days, idx) => {
          const point = chartData.find(d => d.day === days);
          const isReady = point.simulated >= 80;
          return (
            <div key={days} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">In {days} Days</h3>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">{point.simulated}</span>
                  <span className="text-gray-500 text-sm ml-1">/ 100</span>
                </div>
                {isReady ? (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded">
                    <Target className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-amber-400 text-xs font-bold flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded">
                    <Rocket className="w-3 h-3" /> Building
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MasteryTrajectoryProjector;
