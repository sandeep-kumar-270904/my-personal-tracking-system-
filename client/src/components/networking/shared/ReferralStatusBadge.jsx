import React from 'react';
import { Share2, Clock, CheckCircle2, XCircle } from 'lucide-react';

const ReferralStatusBadge = ({ status, contactName }) => {
  if (!status) return null;

  const config = {
    PLANNING: {
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: 'Planning'
    },
    REQUESTED: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: <Share2 className="w-3.5 h-3.5" />,
      text: 'Requested'
    },
    AGREED: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: 'Agreed'
    },
    SUBMITTED: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      text: 'Submitted'
    },
    REJECTED: {
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      icon: <XCircle className="w-3.5 h-3.5" />,
      text: 'Declined'
    }
  };

  const { color, bg, icon, text } = config[status] || config.PLANNING;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${bg} ${color} text-xs font-medium`} title={contactName ? `Referral from ${contactName}` : 'Referral Status'}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default ReferralStatusBadge;
