import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, ChevronRight } from 'lucide-react';

const ContactMiniCard = ({ contact, actionLabel, onAction }) => {
  if (!contact) return null;

  const strengthColors = {
    CLOSE: 'bg-emerald-500',
    STRONG: 'bg-green-400',
    MODERATE: 'bg-amber-400',
    WEAK: 'bg-rose-400',
  };

  const strengthDot = strengthColors[contact.connectionStrength] || 'bg-white/20';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:border-white/20 transition-colors flex items-center justify-between group cursor-pointer"
      onClick={onAction}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            {contact.firstName?.charAt(0) || <User className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${strengthDot}`} />
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white truncate">
            {contact.firstName} {contact.lastName}
          </div>
          <div className="text-xs text-slate-400 truncate flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.currentRole} @ {contact.currentCompany}</span>
          </div>
        </div>
      </div>
      
      {actionLabel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
          className="ml-3 shrink-0 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
        >
          {actionLabel}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

export default ContactMiniCard;
