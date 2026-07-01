import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Briefcase, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ImpactTrackerTab({ resumeId }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', jobTitle: '', status: 'Applied', notes: '' });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['impactEvents', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/impact-events`);
      return data;
    },
    enabled: !!resumeId
  });

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post(`/resumes/${resumeId}/impact-events`, payload);
    },
    onSuccess: () => {
      toast.success("Event tracked!");
      queryClient.invalidateQueries(['impactEvents', resumeId]);
      setShowAdd(false);
      setFormData({ companyName: '', jobTitle: '', status: 'Applied', notes: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ eventId, status }) => {
      await api.put(`/resumes/${resumeId}/impact-events/${eventId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['impactEvents', resumeId]);
      toast.success("Status updated!");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.jobTitle) return toast.error("Company and Title are required");
    addMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Offer': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Interviewing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const stats = {
    total: events.length,
    interviews: events.filter(e => e.status === 'Interviewing' || e.status === 'Offer').length,
    offers: events.filter(e => e.status === 'Offer').length
  };

  const interviewRate = stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Impact Tracker</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {showAdd ? 'Cancel' : <><Plus className="w-4 h-4"/> Log Application</>}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Applications</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-amber-400">{interviewRate}%</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Interview Rate</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">{stats.offers}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Offers</div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-white mb-4">Log New Application</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
              <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Google" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Job Title</label>
              <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Frontend Engineer" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes (Optional)</label>
            <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Applied via referral" />
          </div>
          <button type="submit" disabled={addMutation.isLoading} className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {addMutation.isLoading ? 'Saving...' : 'Save Application'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2].map(i => <div key={i} className="h-16 bg-slate-900 rounded-xl"></div>)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">No applications tracked with this specific resume version yet.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event._id} className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> {event.companyName}
                </h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {event.jobTitle}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <select 
                    value={event.status}
                    onChange={(e) => updateMutation.mutate({ eventId: event._id, status: e.target.value })}
                    className={`text-xs font-bold px-2 py-1 rounded-md border appearance-none cursor-pointer outline-none ${getStatusColor(event.status)}`}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                    <CalendarIcon className="w-3 h-3" /> {new Date(event.dateApplied).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
