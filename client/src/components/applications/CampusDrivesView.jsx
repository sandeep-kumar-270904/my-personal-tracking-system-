import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const fetchCampusDrives = async () => {
  const { data } = await api.get('/campus-drives');
  return data;
};

const CampusDrivesView = () => {
  const queryClient = useQueryClient();

  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['campusDrives'],
    queryFn: fetchCampusDrives,
  });

  const registerMutation = useMutation({
    mutationFn: async (id) => await api.post(`/campus-drives/${id}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries(['campusDrives']);
      toast.success('Successfully registered for the drive!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (drives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Building2 className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-white mb-2">No Campus Drives</h3>
        <p>There are currently no upcoming campus placement drives.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pb-20">
      {drives.map(drive => {
        const isEligible = drive.participationStatus !== 'Not Eligible';
        const isRegistered = !['Eligible', 'Not Eligible'].includes(drive.participationStatus);
        
        return (
          <div key={drive._id} className={`glass-card p-6 border ${isEligible ? 'border-emerald-500/20' : 'border-red-500/20 opacity-70'} flex flex-col`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#ff6b00]" />
                  {drive.companyName}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 
                    Visit: {new Date(drive.visitDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> 
                    Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {drive.participationStatus === 'Not Eligible' ? (
                  <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
                    <XCircle className="w-3.5 h-3.5" /> Not Eligible
                  </span>
                ) : isRegistered ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {drive.participationStatus}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                  </span>
                )}
              </div>
            </div>

            {drive.ineligibilityReason && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{drive.ineligibilityReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Eligibility Criteria</p>
                <p className="text-sm text-slate-300">Min CGPA: {drive.eligibility.minCGPA}</p>
                <p className="text-sm text-slate-300">Backlogs: Max {drive.eligibility.maxActiveBacklogs}</p>
                {drive.eligibility.allowedBranches.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1 truncate" title={drive.eligibility.allowedBranches.join(', ')}>
                    Branches: {drive.eligibility.allowedBranches.join(', ')}
                  </p>
                )}
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Roles</p>
                <div className="flex flex-wrap gap-1">
                  {drive.rolesOffered.length > 0 ? drive.rolesOffered.map((role, i) => (
                    <span key={i} className="bg-white/5 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-white/10">
                      {role}
                    </span>
                  )) : <span className="text-sm text-slate-400">Not specified</span>}
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {drive.participationStatus === 'Eligible' && (
                <button 
                  onClick={() => registerMutation.mutate(drive._id)}
                  disabled={registerMutation.isPending || new Date() > new Date(drive.registrationDeadline)}
                  className="w-full btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerMutation.isPending ? 'Registering...' : new Date() > new Date(drive.registrationDeadline) ? 'Deadline Passed' : 'Register for Drive'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CampusDrivesView;
