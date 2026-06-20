import { motion } from 'framer-motion';

const DashboardBanner = ({ user, stats, upcoming, onShowDigest }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDynamicMessage = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for interview today
    const interviewToday = upcoming?.find(u => 
      u.type === 'INTERVIEW' && new Date(u.date) >= today && new Date(u.date) < tomorrow
    );
    if (interviewToday) return `You have an interview with ${interviewToday.title.replace(' Interview', '')} today — good luck!`;

    // Check for contest today
    const contestToday = upcoming?.find(u => 
      u.type === 'CONTEST' && new Date(u.date) >= today && new Date(u.date) < tomorrow
    );
    if (contestToday) {
      const time = new Date(contestToday.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${contestToday.subtitle} contest tonight at ${time}.`;
    }

    // Default
    return `You have ${stats?.totalApplications || 0} active applications this week.`;
  };

  const getDaysToPlacement = () => {
    if (!user?.gradYear) return null;
    const targetDate = new Date(`${user.gradYear}-08-01T00:00:00Z`);
    const now = new Date();
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysToPlacement();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/10 mb-8 flex justify-between items-center"
    >
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-300 text-lg">
          {getDynamicMessage()}
        </p>
      </div>
      
      {daysRemaining !== null && (
        <div className="text-right hidden sm:flex flex-col items-end gap-2">
          <div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {daysRemaining}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-bold">
              Days to Placement Season
            </div>
          </div>
          <button
            onClick={onShowDigest}
            className="px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            View Daily Digest
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardBanner;
