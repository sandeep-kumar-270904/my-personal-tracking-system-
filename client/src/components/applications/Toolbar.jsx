import { Search, LayoutGrid, List, AlertCircle, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

const Toolbar = ({ searchParams, setSearchParams, viewMode, setViewMode }) => {
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentParams = Object.fromEntries(searchParams.entries());
      if (localSearch) {
        currentParams.search = localSearch;
      } else {
        delete currentParams.search;
      }
      setSearchParams(currentParams);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, searchParams, setSearchParams]);

  const updateFilter = (key, value) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (value && value !== 'All') {
      currentParams[key] = value;
    } else {
      delete currentParams[key];
    }
    setSearchParams(currentParams);
  };

  const statusFilter = searchParams.get('status') || 'All';
  const sourceFilter = searchParams.get('source') || 'All';
  const priorityFilter = searchParams.get('priority') || 'All';
  const sortBy = searchParams.get('sortBy') || 'dateApplied';
  const needsFollowUp = searchParams.get('needsFollowUp') === 'true';
  const isDead = searchParams.get('isDead') === 'true';
  const isArchived = searchParams.get('isArchived') === 'true';
  const noNetwork = searchParams.get('noNetwork') === 'true';

  return (
    <div className="flex flex-col gap-4 bg-[#13141f] p-4 rounded-2xl border border-white/5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search company or role..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] w-60 transition-colors"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="OA_PENDING">OA Pending</option>
            <option value="OA_DONE">OA Done</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select 
            value={sourceFilter}
            onChange={(e) => updateFilter('source', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
          >
            <option value="All">All Sources</option>
            <option value="CAMPUS">Campus</option>
            <option value="ONLINE">Online</option>
            <option value="REFERRAL">Referral</option>
            <option value="COLD_EMAIL">Cold Email</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="JOB_PORTAL">Job Portal</option>
          </select>

          <select 
            value={priorityFilter}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <select 
            value={sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
          >
            <option value="dateApplied">Sort by: Date Applied</option>
            <option value="company">Sort by: Company A-Z</option>
            <option value="status">Sort by: Status</option>
            <option value="priority">Sort by: Priority</option>
          </select>

          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('network')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'network' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Network Graph View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'analytics' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Analytics View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Smart Filters Row */}
      <div className="flex gap-3 pt-3 border-t border-white/5">
        <button 
          onClick={() => updateFilter('needsFollowUp', needsFollowUp ? null : 'true')}
          className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-medium transition-colors border ${needsFollowUp ? 'bg-[#ff6b00]/20 text-[#ff6b00] border-[#ff6b00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Needs Follow-up
        </button>
        <button 
          onClick={() => updateFilter('isDead', isDead ? null : 'true')}
          className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-medium transition-colors border ${isDead ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          Dead Applications
        </button>
        <button 
          onClick={() => updateFilter('isArchived', isArchived ? null : 'true')}
          className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-medium transition-colors border ${isArchived ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
          Show Archived
        </button>
        <button 
          onClick={() => updateFilter('noNetwork', noNetwork ? null : 'true')}
          className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-medium transition-colors border ${noNetwork ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <Users className="w-3.5 h-3.5" />
          No Network Coverage
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
