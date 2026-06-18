import { Search, LayoutGrid, List, AlertCircle } from 'lucide-react';
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

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between bg-[#13141f] p-3 rounded-2xl border border-white/5 shadow-lg">
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

        <button 
          onClick={() => updateFilter('needsFollowUp', needsFollowUp ? null : 'true')}
          className={`px-3 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border ${needsFollowUp ? 'bg-[#ff6b00]/20 text-[#ff6b00] border-[#ff6b00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <AlertCircle className="w-4 h-4" />
          Needs Follow-up
        </button>
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
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
