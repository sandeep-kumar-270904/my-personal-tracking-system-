import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sunrise, Calendar, Target, Clock, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const DailyDigestModal = ({ isOpen, onClose }) => {
  const { data: digest, isLoading } = useQuery({
    queryKey: ['dailyDigest'],
    queryFn: async () => {
      const res = await api.get('/notifications/daily-digest');
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0b14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sunrise className="w-32 h-32 text-amber-500" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sunrise className="w-6 h-6 text-amber-400" />
                  Your Daily Digest
                </h2>
                <p className="text-slate-400 mt-1">
                  {format(new Date(), 'EEEE, MMMM do')}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : digest ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#13141f] border border-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-amber-400">{digest.stats.totalUpcoming}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Events</div>
                  </div>
                  <div className="bg-[#13141f] border border-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-emerald-400">{digest.stats.interviews}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Interviews</div>
                  </div>
                  <div className="bg-[#13141f] border border-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-red-400">{digest.stats.deadlines}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Deadlines</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Upcoming Next 48 Hours
                  </h3>
                  
                  {(!digest.events || digest.events.length === 0) && (!digest.pendingOffers || digest.pendingOffers.length === 0) ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-slate-400">Your schedule is clear for the next 2 days.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {digest.events && digest.events.map(event => {
                        let icon = <Calendar className="w-5 h-5 text-blue-400" />;
                        let bgColor = 'bg-blue-500/10 border-blue-500/20';
                        if (event.type === 'interview') {
                          icon = <Target className="w-5 h-5 text-emerald-400" />;
                          bgColor = 'bg-emerald-500/10 border-emerald-500/20';
                        } else if (event.type.includes('deadline')) {
                          icon = <Clock className="w-5 h-5 text-red-400" />;
                          bgColor = 'bg-red-500/10 border-red-500/20';
                        }

                        return (
                          <div key={event._id} className={`flex items-center gap-4 p-4 rounded-xl border ${bgColor}`}>
                            <div className="p-3 bg-[#0a0b14] rounded-lg border border-white/5 shrink-0">
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white truncate">{event.title}</h4>
                              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                <span>{format(new Date(event.date), 'MMM do')}</span>
                                {event.start_time && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span>{event.start_time}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            {event.type === 'interview' && (
                              <Link 
                                to={`/calendar?date=${event.date.split('T')[0]}`}
                                onClick={onClose}
                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                              >
                                Prepare
                              </Link>
                            )}
                          </div>
                        );
                      })}

                      {digest.pendingOffers && digest.pendingOffers.map(offer => (
                        <div key={offer._id} className="flex items-center gap-4 p-4 rounded-xl border bg-orange-500/10 border-orange-500/20">
                          <div className="p-3 bg-[#0a0b14] rounded-lg border border-white/5 shrink-0">
                            <Clock className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">Offer Deadline: {offer.company_name}</h4>
                            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                              <span>Due by {format(new Date(offer.decision_deadline), 'MMM do')}</span>
                            </p>
                          </div>
                          <Link 
                            to="/offers"
                            onClick={onClose}
                            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                          >
                            Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-red-400">Failed to load digest</div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/5 bg-[#13141f] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyDigestModal;
