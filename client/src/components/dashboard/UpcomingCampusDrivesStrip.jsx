import { useQuery } from '@tanstack/react-query';
import { Building2, Calendar, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const fetchCampusDrives = async () => {
  const { data } = await api.get('/campus-drives');
  return data;
};

const UpcomingCampusDrivesStrip = () => {
  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['campusDrives'],
    queryFn: fetchCampusDrives,
  });

  const upcomingDrives = drives
    .filter(d => new Date(d.visitDate) >= new Date())
    .slice(0, 3); // top 3

  if (isLoading || upcomingDrives.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#00f0ff]/10 to-[#13141f] border border-[#00f0ff]/20 rounded-2xl p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-[#00f0ff] flex items-center gap-2 text-sm uppercase tracking-wider">
          <Building2 className="w-4 h-4" /> Upcoming Campus Drives
        </h3>
        <Link to="/applications" className="text-xs text-slate-400 hover:text-white transition-colors">
          View All &rarr;
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
        {upcomingDrives.map(drive => {
          const isEligible = drive.participationStatus !== 'Not Eligible';
          const isRegistered = !['Eligible', 'Not Eligible'].includes(drive.participationStatus);

          return (
            <Link 
              key={drive._id}
              to="/applications"
              className="min-w-[250px] flex-1 bg-black/40 border border-white/5 hover:border-[#00f0ff]/50 rounded-xl p-3 flex flex-col justify-between transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-white truncate pr-2">{drive.companyName}</p>
                {isRegistered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isEligible ? (
                  <span className="w-2 h-2 rounded-full bg-[#00f0ff] shrink-0 mt-1"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"></span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(drive.visitDate).toLocaleDateString()}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingCampusDrivesStrip;
