import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Building2, Search, TrendingUp, Target, Briefcase, Filter } from 'lucide-react';
import DashboardBanner from '../components/dashboard/DashboardBanner';

export default function CompanyInsightsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalApplications'); // totalApplications, interviewRate, offerRate

  const { data: insights = [], isLoading, isError } = useQuery({
    queryKey: ['companyInsights'],
    queryFn: async () => {
      const res = await api.get('/companies/insights');
      return res.data;
    }
  });

  const filteredInsights = insights
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6 pb-20">
      <DashboardBanner 
        title="Company Insights" 
        subtitle="Aggregated hiring data across all students. See which companies interview the most and offer the best conversion rates."
        icon={Building2}
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-400 hidden md:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="totalApplications">Most Applications</option>
            <option value="interviewRate">Highest Interview Rate</option>
            <option value="offerRate">Highest Offer Rate</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
          Failed to load company insights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((company, index) => (
            <motion.div
              key={company._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{company.totalApplications} students applied</p>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                  {company.name.charAt(0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Interview Rate</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-xl font-bold ${company.interviewRate > 20 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {company.interviewRate}%
                    </span>
                    <TrendingUp className="w-4 h-4 text-slate-500 mb-1" />
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Offer Rate</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-xl font-bold ${company.offerRate > 10 ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {company.offerRate}%
                    </span>
                    <Target className="w-4 h-4 text-slate-500 mb-1" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> {company.totalInterviews} Total Interviews
                </span>
                <span>Avg Rounds: {company.avgQuestionsAsked}</span>
              </div>
            </motion.div>
          ))}

          {filteredInsights.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
              No companies found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
