import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const OutreachAnalytics = ({ stats }) => {
  // Mock data for charts since backend only gives aggregates for now. 
  // In a real scenario, this data would come from the /api/networking/stats endpoint over time.
  const responseTrend = [
    { week: 'W1', rate: 12 }, { week: 'W2', rate: 18 }, { week: 'W3', rate: 24 },
    { week: 'W4', rate: 21 }, { week: 'W5', rate: 30 }, { week: 'W6', rate: 42 }
  ];

  const channelData = [
    { name: 'LinkedIn', value: 65 },
    { name: 'Email', value: 25 },
    { name: 'Twitter', value: 10 }
  ];
  const COLORS = ['#0077b5', '#ff6b00', '#1DA1F2'];

  const timeData = [
    { time: 'Mon AM', rate: 45 }, { time: 'Mon PM', rate: 20 },
    { time: 'Tue AM', rate: 55 }, { time: 'Tue PM', rate: 25 },
    { time: 'Wed AM', rate: 40 }, { time: 'Thu AM', rate: 35 },
    { time: 'Fri AM', rate: 15 }, { time: 'Weekend', rate: 5 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Trend Chart */}
        <div className="bg-[#13141f] border border-white/5 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Response Rate Trend (12 weeks)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTrend}>
                <XAxis dataKey="week" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1c29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#ff6b00" strokeWidth={3} dot={{ fill: '#13141f', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Chart */}
        <div className="bg-[#13141f] border border-white/5 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Outreach by Channel</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1c29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {channelData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  {entry.name} ({entry.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Chart */}
        <div className="bg-[#13141f] border border-white/5 p-4 rounded-xl md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Best Time to Send (Response Rate %)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1c29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
        <h3 className="text-sm font-bold text-blue-300 mb-2">Weekly Insight</h3>
        <p className="text-blue-200/80 text-sm">
          Your LinkedIn messages get a 42% response rate but your email outreach gets only 12%. Focus on LinkedIn. Your response rate is highest on Tuesday mornings. Your referral request messages have a 67% response rate — higher than your cold messages. Ask for referrals earlier in the relationship.
        </p>
      </div>
    </div>
  );
};

export default OutreachAnalytics;
