import { useQuery } from '@tanstack/react-query';
import { Building2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../EmptyState';

const fetchCompanyPacks = async () => {
  // We can just fetch the active applications and generate unique company packs from them
  const res = await api.get('/applications?status=INTERVIEW_SCHEDULED,APPLIED,OA_PENDING');
  const apps = res.data.applications || [];
  const companies = [...new Set(apps.map(a => a.company).filter(Boolean))];
  
  if (companies.length === 0) return [];

  // For each company, we can fetch matching resources
  const res2 = await api.get(`/resources?search=${companies.join(',')}&limit=5`);
  return {
    companies,
    resources: res2.data.resources || []
  };
};

const CompanyPrepPackWidget = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['companyPrepPacks'],
    queryFn: fetchCompanyPacks
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          Company Prep Packs
        </h2>
        <div className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  if (isError || !data || data.length === 0 || data.companies?.length === 0) {
    return null; // Don't show if no active applications
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-indigo-400" />
        Company Prep Packs
      </h2>
      <p className="text-slate-400 text-sm mb-4">Based on your active applications</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.companies.map(company => {
          const companyResources = data.resources.filter(r => 
            r.title.toLowerCase().includes(company.toLowerCase()) || 
            (r.companies && r.companies.includes(company))
          );

          return (
            <div key={company} className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <h3 className="text-lg font-bold text-white mb-2 relative z-10">{company} Pack</h3>
              
              {companyResources.length > 0 ? (
                <div className="space-y-2 mb-4 relative z-10">
                  <p className="text-sm text-slate-300">{companyResources.length} curated resources found.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-4 relative z-10">Generating personalized materials for {company}...</p>
              )}

              <button 
                onClick={() => navigate(`/resources?search=${encodeURIComponent(company)}`)}
                className="text-sm font-semibold text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors relative z-10"
              >
                View Prep Pack <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyPrepPackWidget;
