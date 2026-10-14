import React from 'react';

export default function LiveStatsBar({ stats }) {
  if (!stats) return null;

  const convRate = (stats.conversionRate * 100).toFixed(0);
  const convColor = convRate >= 50 ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Total Interviews</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.totalInterviews}</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
        <p className={`text-2xl font-bold mt-1 ${convColor}`}>{convRate}%</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Avg Performance</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.avgPerformanceRating?.toFixed(1) || '-'}/10</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Companies</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.companiesInterviewed}</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Avg Stress</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.avgStressLevel?.toFixed(1) || '-'}/10</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-500 font-medium">Rounds / Process</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.avgRoundsPerProcess?.toFixed(1) || '-'}</p>
      </div>
    </div>
  );
}
