import { Search, Filter, Layers, Upload, ArrowUpDown, BarChart2, Layout, Target } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function Toolbar({ tags, setShowUploadModal, setShowLinkedInModal, setShowABTestModal, setShowBatchScoreModal }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentSearch = searchParams.get('q') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'lastUsedAt';
  const showAllVersions = searchParams.get('allVersions') === 'true';

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.keys(updates).forEach(key => {
      if (updates[key]) {
        newParams.set(key, updates[key]);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left side: Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resumes..."
            value={currentSearch}
            onChange={(e) => updateParams({ q: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={currentTag}
            onChange={(e) => updateParams({ tag: e.target.value })}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
          >
            <option value="" className="bg-slate-900">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag} className="bg-slate-900">{tag}</option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
          >
            <option value="lastUsedAt" className="bg-slate-900">Last Used</option>
            <option value="createdAt" className="bg-slate-900">Upload Date</option>
            <option value="atsScore" className="bg-slate-900">ATS Score</option>
            <option value="name" className="bg-slate-900">Name A-Z</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/10">
          <input
            type="checkbox"
            checked={showAllVersions}
            onChange={(e) => updateParams({ allVersions: e.target.checked ? 'true' : '' })}
            className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
          />
          <Layers className="w-4 h-4" />
          <span>All Versions</span>
        </label>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowBatchScoreModal?.(true)}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Target className="w-4 h-4" />
          <span>Batch Score</span>
        </button>
        <button
          onClick={() => navigate('/resumes/builder')}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Layout className="w-4 h-4" />
          <span>Builder</span>
        </button>
        <button
          onClick={() => setShowABTestModal?.(true)}
          className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <BarChart2 className="w-4 h-4" />
          <span>A/B Tests</span>
        </button>
        <button
          onClick={() => setShowLinkedInModal?.(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          <span>Import LinkedIn</span>
        </button>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center space-x-2 whitespace-nowrap shadow-lg shadow-emerald-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resume</span>
        </button>
      </div>
    </div>
  );
}
