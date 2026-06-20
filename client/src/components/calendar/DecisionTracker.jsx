import React, { useMemo } from 'react';
import { Target, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const DecisionTracker = ({ selectedEvent, allEvents }) => {
  // Find competing offers (other offer deadlines within 14 days of this one)
  const competingOffers = useMemo(() => {
    if (!selectedEvent || selectedEvent.type !== 'offer_deadline') return [];
    
    const selectedDate = new Date(selectedEvent.date);
    
    return allEvents.filter(e => 
      e.type === 'offer_deadline' && 
      e._id !== selectedEvent._id &&
      Math.abs(differenceInDays(new Date(e.date), selectedDate)) <= 14
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedEvent, allEvents]);

  if (!selectedEvent || selectedEvent.type !== 'offer_deadline' || competingOffers.length === 0) {
    return null;
  }

  const getUrgencyColor = (date) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return 'text-slate-500';
    if (days <= 3) return 'text-red-400';
    if (days <= 7) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="border-t border-white/5 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-amber-400" />
        <h4 className="text-sm font-bold text-white">Decision Window Tracker</h4>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        You have overlapping offer deadlines. Compare them side-by-side to prioritize negotiations and final decisions.
      </p>

      <div className="flex flex-col gap-3">
        {/* The Current Offer */}
        <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2 py-1 bg-[#00f0ff] text-black text-[9px] font-bold uppercase tracking-wider rounded-bl-lg">
            Current
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#00f0ff] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="text-sm font-bold text-white truncate">{selectedEvent.title.replace(' Offer Deadline', '')}</h5>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className={`text-xs font-bold ${getUrgencyColor(selectedEvent.date)}`}>
                  {format(new Date(selectedEvent.date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competing Offers */}
        {competingOffers.map(offer => (
          <div key={offer._id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-bold text-white truncate">{offer.title.replace(' Offer Deadline', '')}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`text-xs font-bold ${getUrgencyColor(offer.date)}`}>
                    {format(new Date(offer.date), 'MMM d, yyyy')}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto bg-black/20 px-1.5 py-0.5 rounded">
                    {differenceInDays(new Date(offer.date), new Date(selectedEvent.date)) > 0 
                      ? `+${differenceInDays(new Date(offer.date), new Date(selectedEvent.date))} days`
                      : `${differenceInDays(new Date(offer.date), new Date(selectedEvent.date))} days`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          <strong>Negotiation Tip:</strong> Use the earliest expiring offer to accelerate decisions from other companies. Let them know you have a pending deadline on {format(new Date(selectedEvent.date), 'MMM do')}.
        </p>
      </div>
    </div>
  );
};

export default DecisionTracker;
