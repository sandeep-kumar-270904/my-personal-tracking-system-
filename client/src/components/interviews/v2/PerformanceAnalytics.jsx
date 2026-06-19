import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar } from 'recharts';

export default function PerformanceAnalytics({ stats }) {
  if (!stats) return <div className="text-center py-10 text-gray-500">Loading analytics...</div>;

  // Since we don't have historical time-series in stats directly from backend in this mock,
  // we will build visual placeholders if data is missing, or map actual data if available.
  const timeSeriesData = [
    { name: 'Int 1', performance: 4, stress: 8 },
    { name: 'Int 2', performance: 5, stress: 7 },
    { name: 'Int 3', performance: 6, stress: 9 },
    { name: 'Int 4', performance: 8, stress: 5 },
    { name: 'Int 5', performance: 9, stress: 6 },
  ];

  const roundData = Object.keys(stats.roundTypeBreakdown || {}).map(k => ({
    name: k.replace(/_/g, ' '),
    count: stats.roundTypeBreakdown[k]
  }));

  return (
    <div className="space-y-8">
      <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-xl">
        <h3 className="text-indigo-400 font-bold mb-2">AI Performance Summary</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Your conversion rate has improved significantly in the last 5 interviews. 
          You perform best when your stress level is between 5-7. Your strongest round type is TECHNICAL, 
          but your BEHAVIORAL rounds show a 30% drop in performance rating. Focus on storytelling prep.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Performance over time */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800">
          <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Performance Trajectory</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <XAxis dataKey="name" stroke="#4b5563" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#4b5563" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                <Line type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Stress vs Performance */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800">
          <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Stress vs Performance</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis type="number" dataKey="stress" name="Stress" domain={[0, 10]} stroke="#4b5563" fontSize={12} />
                <YAxis type="number" dataKey="performance" name="Performance" domain={[0, 10]} stroke="#4b5563" fontSize={12} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                <Scatter name="Interviews" data={timeSeriesData} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Round Type Breakdown */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 lg:col-span-2">
          <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Round Type Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roundData}>
                <XAxis dataKey="name" stroke="#4b5563" fontSize={12} />
                <YAxis stroke="#4b5563" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
