import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const DashboardCharts = ({ charts, heatmap, roi, isCompact = false }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#14b8a6'];

  // Format pipeline data for PieChart
  const pipelineData = charts?.pipelineBreakdown ? Object.entries(charts.pipelineBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({ name: key.replace('_', ' '), value })) : [];

  // Format DSA difficulty for BarChart
  const dsaDifficultyData = charts?.dsaByDifficulty ? [
    { name: 'Easy', count: charts.dsaByDifficulty.EASY },
    { name: 'Medium', count: charts.dsaByDifficulty.MEDIUM },
    { name: 'Hard', count: charts.dsaByDifficulty.HARD }
  ] : [];

  // Heatmap rendering (last 12 weeks = 84 days)
  const renderHeatmap = () => {
    if (!heatmap) return null;
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Create an array of exactly 84 days ending today
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dataPoint = heatmap.find(h => h.date === dateStr);
      days.push({
        date: d,
        count: dataPoint ? dataPoint.count : 0
      });
    }

    // Organize into columns (weeks) of 7 days (rows)
    // Actually, simple flex wrap or CSS grid is easier.
    // CSS Grid: 12 columns, 7 rows. Flow column.
    
    return (
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* We'll just map them into columns. Each column is 7 days. */}
        {Array.from({ length: 12 }).map((_, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, rowIdx) => {
              const dayIdx = colIdx * 7 + rowIdx;
              if (dayIdx >= days.length) return <div key={rowIdx} className="w-3 h-3" />; // empty slot
              const day = days[dayIdx];
              
              let bg = 'bg-[#1e1e1e]';
              if (day.count === 1) bg = 'bg-emerald-900';
              if (day.count === 2) bg = 'bg-emerald-700';
              if (day.count === 3) bg = 'bg-emerald-500';
              if (day.count > 3) bg = 'bg-emerald-400';

              return (
                <div 
                  key={rowIdx} 
                  className={`w-3 h-3 rounded-sm ${bg}`} 
                  title={`${day.date.toDateString()}: ${day.count} solves`}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Applications Growth */}
      <div className={`glass-card p-6 rounded-2xl border border-white/5 ${isCompact ? 'h-[280px]' : 'h-[350px]'}`}>
        <h3 className="text-lg font-bold text-white mb-6">Applications (Last 30 Days)</h3>
        {charts?.applicationsLast30Days && charts.applicationsLast30Days.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.applicationsLast30Days}>
              <defs>
                <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#ff6b00" strokeWidth={3} fillOpacity={1} fill="url(#colorApp)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-slate-500">No data</p></div>
        )}
      </div>

      {/* Pipeline Status */}
      <div className={`glass-card p-6 rounded-2xl border border-white/5 ${isCompact ? 'h-[280px]' : 'h-[350px]'}`}>
        <h3 className="text-lg font-bold text-white mb-6">Pipeline Breakdown</h3>
        {pipelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-slate-500">No applications</p></div>
        )}
      </div>

      {/* DSA Heatmap */}
      <div className={`glass-card p-6 rounded-2xl border border-white/5 flex flex-col ${isCompact ? 'h-[280px]' : 'h-[350px]'}`}>
        <h3 className="text-lg font-bold text-white mb-2">DSA Consistency Heatmap</h3>
        <p className="text-xs text-slate-400 mb-6">Last 12 weeks of problem solving</p>
        <div className="flex-1 flex items-center justify-center">
          {renderHeatmap()}
        </div>
        <div className="flex justify-center gap-2 items-center text-xs text-slate-400 mt-4">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-[#1e1e1e]"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-900"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-700"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
          <span>More</span>
        </div>
      </div>

      {/* DSA Difficulty */}
      <div className={`glass-card p-6 rounded-2xl border border-white/5 ${isCompact ? 'h-[280px]' : 'h-[350px]'}`}>
        <h3 className="text-lg font-bold text-white mb-6">DSA Difficulty</h3>
        {dsaDifficultyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dsaDifficultyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
              <Bar dataKey="count" name="Problems Solved" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                {dsaDifficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Easy' ? '#10b981' : entry.name === 'Medium' ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-slate-500">No DSA problems solved</p></div>
        )}
      </div>

      {/* Application ROI by Source */}
      <div className={`glass-card p-6 rounded-2xl border border-white/5 ${isCompact ? 'h-[280px]' : 'h-[350px]'}`}>
        <h3 className="text-lg font-bold text-white mb-6">Application ROI by Source</h3>
        {roi && roi.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roi} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.4 }} 
                contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                formatter={(value, name) => [name === 'roiPercent' ? `${value}%` : value, name === 'roiPercent' ? 'ROI (Interview Rate)' : name]}
              />
              <Bar dataKey="roiPercent" name="ROI (Interview Rate)" fill="#10b981" radius={[0, 4, 4, 0]}>
                {roi.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-slate-500">No ROI data</p></div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
