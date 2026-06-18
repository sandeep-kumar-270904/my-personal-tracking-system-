import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const outcomeScores = {
  'REJECTED': 0,
  'APPLIED': 1,
  'OA_PENDING': 1.5,
  'OA_DONE': 2,
  'SHORTLISTED': 2.5,
  'INTERVIEW_SCHEDULED': 3,
  'OFFER': 4
};

const outcomeLabels = {
  0: 'Rejected',
  1: 'Applied',
  1.5: 'OA',
  2: 'OA Done',
  2.5: 'Shortlisted',
  3: 'Interview',
  4: 'Offer'
};

const sourceColors = {
  'CAMPUS': '#3b82f6',
  'ONLINE': '#8b5cf6',
  'REFERRAL': '#10b981',
  'COLD_EMAIL': '#f59e0b',
  'LINKEDIN': '#06b6d4',
  'JOB_PORTAL': '#ec4899'
};

const AnalyticsTab = ({ applications }) => {
  const data = applications.filter(app => app.effortMinutes > 0).map(app => ({
    company: app.company,
    role: app.role,
    effort: app.effortMinutes,
    outcome: outcomeScores[app.status] || 0,
    source: app.source,
    status: app.status
  }));

  const successfulApps = data.filter(d => d.outcome >= 3);
  const rejectedApps = data.filter(d => d.outcome === 0);

  const avgSuccessEffort = successfulApps.length > 0 ? (successfulApps.reduce((acc, curr) => acc + curr.effort, 0) / successfulApps.length).toFixed(1) : 0;
  const avgRejectEffort = rejectedApps.length > 0 ? (rejectedApps.reduce((acc, curr) => acc + curr.effort, 0) / rejectedApps.length).toFixed(1) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1b26] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold text-sm">{data.company}</p>
          <p className="text-slate-400 text-xs mb-2">{data.role}</p>
          <p className="text-slate-300 text-xs">Effort: <span className="text-[#ff6b00] font-bold">{data.effort} min</span></p>
          <p className="text-slate-300 text-xs">Status: <span className="text-white font-bold">{data.status}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-emerald-400 text-sm font-semibold mb-1">Avg. Effort for Successful Apps (Interview+)</p>
          <p className="text-2xl font-bold text-white">{avgSuccessEffort} mins</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
          <p className="text-red-400 text-sm font-semibold mb-1">Avg. Effort for Rejected Apps</p>
          <p className="text-2xl font-bold text-white">{avgRejectEffort} mins</p>
        </div>
      </div>

      <div className="flex-1 bg-[#13141f] border border-white/5 p-6 rounded-2xl shadow-lg relative min-h-[400px]">
        <h3 className="text-lg font-bold text-white mb-6">Effort vs Outcome</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" dataKey="effort" name="Effort (mins)" stroke="#94a3b8" label={{ value: 'Effort (Minutes)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
              <YAxis 
                type="number" 
                dataKey="outcome" 
                name="Outcome" 
                stroke="#94a3b8" 
                domain={[0, 4]} 
                ticks={[0, 1, 2, 3, 4]} 
                tickFormatter={(val) => outcomeLabels[val]} 
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Applications" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={sourceColors[entry.source] || '#ff6b00'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Log effort in your applications to see analytics here.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
