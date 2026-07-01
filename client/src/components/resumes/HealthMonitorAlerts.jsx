import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function HealthMonitorAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['healthAlerts'],
    queryFn: async () => {
      const { data } = await api.get('/resumes/health-alerts');
      return data;
    }
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => await api.post('/resumes/health-check'),
    onSuccess: (data) => {
      toast.success(`Health check complete. Found ${data.data.newAlertsCount} new issues.`);
      queryClient.invalidateQueries(['healthAlerts']);
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId) => await api.put(`/resumes/health-alerts/${alertId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAlerts']);
    }
  });

  const scheduleRevampMutation = useMutation({
    mutationFn: async (resumeName) => await api.post('/events/resume-schedule', { resumeName }),
    onSuccess: () => {
      toast.success('Resume Revamp Session scheduled in Calendar!');
    },
    onError: () => toast.error('Failed to schedule session')
  });

  if (isLoading) return null;

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-100">All Resumes Healthy</h4>
            <p className="text-sm text-emerald-400/80">No current issues detected across your active resumes.</p>
          </div>
        </div>
        <button 
          onClick={() => runCheckMutation.mutate()} 
          disabled={runCheckMutation.isLoading}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${runCheckMutation.isLoading ? 'animate-spin' : ''}`} /> Run Check
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400"/> Resume Health Alerts
        </h3>
        <button 
          onClick={() => runCheckMutation.mutate()} 
          disabled={runCheckMutation.isLoading}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${runCheckMutation.isLoading ? 'animate-spin' : ''}`} /> Scan Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map(alert => {
          const isCritical = alert.severity === 'CRITICAL';
          const isHigh = alert.severity === 'HIGH';
          
          let Icon = AlertTriangle;
          let colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          
          if (isCritical) {
            Icon = AlertCircle;
            colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
          } else if (isHigh) {
            Icon = AlertCircle;
            colorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
          }
          
          return (
            <div key={alert._id} className={`p-4 rounded-2xl border ${colorClass} flex flex-col justify-between`}>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{alert.alertType.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs opacity-70">{(alert.resumeId?.name || alert.resumeId?.originalName || 'Unknown')}</span>
                </div>
                <p className="text-sm opacity-90 mb-4">{alert.message}</p>
              </div>
              <div className="flex justify-end gap-2 border-t border-white/5 pt-3 mt-auto">
                {(alert.alertType === 'STALE' || alert.alertType === 'SCORE_DECLINING') && (
                  <button 
                    onClick={() => scheduleRevampMutation.mutate(alert.resumeId?.name || alert.resumeId?.originalName)}
                    disabled={scheduleRevampMutation.isLoading}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                  >
                    Schedule Revamp Session
                  </button>
                )}
                <button 
                  onClick={() => resolveMutation.mutate(alert._id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
