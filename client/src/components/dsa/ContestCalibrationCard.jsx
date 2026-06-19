import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowRight, ShieldAlert, CheckCircle, Search } from 'lucide-react';

const ContestCalibrationCard = () => {
  // Mock data for UI as we don't have real contests logged yet
  const calibrationData = [
    { topic: 'Binary Search', selfAssessed: 'ADVANCED', contestPerformance: 'FAILED', status: 'OVERCONFIDENT', accuracy: 30 },
    { topic: 'Dynamic Programming', selfAssessed: 'BEGINNER', contestPerformance: 'SOLVED (HARD)', status: 'UNDERESTIMATED', accuracy: 40 },
    { topic: 'Two Pointers', selfAssessed: 'INTERMEDIATE', contestPerformance: 'SOLVED (MED)', status: 'ACCURATE', accuracy: 95 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'OVERCONFIDENT': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'UNDERESTIMATED': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'ACCURATE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OVERCONFIDENT': return <ShieldAlert className="w-3 h-3" />;
      case 'UNDERESTIMATED': return <Search className="w-3 h-3" />;
      case 'ACCURATE': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white">Contest Calibration</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium bg-gray-800 px-2 py-1 rounded-full">Last 3 Contests</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg">Topic</th>
              <th className="px-4 py-3">Self-Assessed</th>
              <th className="px-4 py-3">Contest Signal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 rounded-tr-lg rounded-br-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {calibrationData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200">{row.topic}</td>
                <td className="px-4 py-3">{row.selfAssessed}</td>
                <td className="px-4 py-3 font-medium text-white">{row.contestPerformance}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(row.status)}`}>
                    {getStatusIcon(row.status)} {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.status !== 'ACCURATE' ? (
                    <button className="text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center gap-1 transition-colors">
                      Recalibrate <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-gray-600 text-xs font-bold">CALIBRATED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs mt-4">
        Contest signals override manual self-assessment to provide true interview readiness.
      </p>
    </div>
  );
};

export default ContestCalibrationCard;
