import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NetworkCoverageAlert } from '../networking/shared';
import api from '../../services/api';

const fetchInsights = async () => {
  const res = await api.get('/networking/insights');
  return res.data;
};

const DashboardCoverageAlerts = ({ onAddContact }) => {
  const [dismissed, setDismissed] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['networking', 'insights'],
    queryFn: fetchInsights,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data?.insights) return null;

  // Filter for COMPANY_COVERAGE and limit to top 2
  const coverageGaps = data.insights
    .filter(i => i.type === 'COMPANY_COVERAGE' && !dismissed.includes(i.id))
    .slice(0, 2);

  if (coverageGaps.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-4">
      {coverageGaps.map(gap => (
        <div key={gap.id} className="relative group">
          <NetworkCoverageAlert 
            companyName={gap.company}
            applicationRole={gap.role}
            onAddContact={() => onAddContact(gap.company)}
            onFindAlumni={() => window.location.href = `/networking?tab=alumni&company=${encodeURIComponent(gap.company)}`}
          />
          <button 
            onClick={() => setDismissed(prev => [...prev, gap.id])}
            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full text-slate-400 hover:text-white flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Dismiss alert"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default DashboardCoverageAlerts;
