import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, UserPlus, Target } from 'lucide-react';

const HealthScoreGauge = ({ score }) => {
  const radius = 18;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  let colorClass = "stroke-red-500";
  if (score >= 75) colorClass = "stroke-emerald-500";
  else if (score >= 40) colorClass = "stroke-amber-500";

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/10" />
        <circle
          cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute text-[10px] font-bold text-white">{score}</div>
    </div>
  );
};

const ContactCard = ({ contact, onClick }) => {
  
  const getStrengthColor = (str) => {
    switch(str) {
      case 'CLOSE': return 'bg-teal-400';
      case 'STRONG': return 'bg-emerald-400';
      case 'MODERATE': return 'bg-yellow-400';
      default: return 'bg-slate-400';
    }
  };

  const getDaysSince = (date) => {
    if (!date) return null;
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  const daysSinceInt = getDaysSince(contact.lastInteractionAt);
  const interactionColor = daysSinceInt > 30 ? 'text-red-400' : daysSinceInt > 14 ? 'text-amber-400' : 'text-slate-400';

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => onClick(contact)}
      className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl p-5 cursor-pointer transition-all flex flex-col h-full group shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate text-lg">{contact.name || `${contact.firstName} ${contact.lastName}`}</h3>
            <div className={`w-2 h-2 rounded-full ${getStrengthColor(contact.connectionStrength)}`} title={contact.connectionStrength} />
            {contact.placementLeverageScore > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 rounded border border-blue-500/30 text-[10px] font-bold text-blue-300" title="Placement Leverage Score">
                <Target size={10} />
                {contact.placementLeverageScore}
              </div>
            )}
          </div>
          <p className="text-sm text-slate-300 truncate">{contact.role}</p>
          <p className="text-xs text-slate-500 truncate">{contact.company}</p>
        </div>
        <HealthScoreGauge score={contact.relationshipHealthScore || 0} />
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-4">
        <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-white/5 text-slate-300 uppercase tracking-wider">
          {contact.contactType}
        </span>
        {contact.referralStatus && contact.referralStatus !== 'NOT_ASKED' && (
          <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
            contact.referralStatus === 'SUBMITTED' ? 'bg-[#ff6b00]/20 text-[#ff6b00]' : 'bg-blue-500/20 text-blue-300'
          }`}>
            Ref: {contact.referralStatus}
          </span>
        )}
        {contact.isWorkShared && (
          <span className="px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider bg-purple-500/20 text-purple-400">
            Knows your work
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs">
        <span className={interactionColor}>
          {daysSinceInt !== null ? `Active ${daysSinceInt}d ago` : 'Never contacted'}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button className="text-slate-400 hover:text-white"><MessageSquare size={14}/></button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactCard;
