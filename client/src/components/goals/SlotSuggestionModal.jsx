import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Check } from 'lucide-react';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SlotSuggestionModal = ({ isOpen, onClose, goal }) => {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingSlot, setCreatingSlot] = useState(null);

  useEffect(() => {
    if (isOpen) {
      findSlots();
    } else {
      setSlots([]);
    }
  }, [isOpen]);

  const findSlots = async () => {
    setIsLoading(true);
    try {
      // Default duration based on goal type
      const duration = goal.linked_module === 'applications' ? 30 : 45;
      
      const dateStart = format(new Date(), 'yyyy-MM-dd');
      let dateEnd = format(addDays(new Date(), 3), 'yyyy-MM-dd');
      
      if (goal.period === 'weekly') {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - now.getDay() + 7);
        dateEnd = format(endOfWeek, 'yyyy-MM-dd');
      }

      const { data } = await api.get('/events/slots/find', {
        params: { dateStart, dateEnd, duration }
      });
      // Show top 2 slots
      setSlots(data.slice(0, 2));
    } catch (err) {
      toast.error('Failed to find free slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSlot = async (slot) => {
    setCreatingSlot(slot.start);
    try {
      await api.post('/events', {
        title: `Goal Time: ${goal.title}`,
        type: 'event',
        date: format(new Date(slot.start), 'yyyy-MM-dd'),
        start_time: format(new Date(slot.start), 'HH:mm'),
        end_time: format(new Date(slot.end), 'HH:mm'),
        is_all_day: false,
        description: `Blocked time for goal: ${goal.title}`
      });
      toast.success('Time blocked on Calendar!');
      onClose();
    } catch (err) {
      toast.error('Failed to block time');
    } finally {
      setCreatingSlot(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative shadow-2xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00f0ff]" /> Find Time
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Here are a few open slots to make progress on <strong>{goal.title}</strong> before the period ends.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-[#00f0ff] border-t-transparent rounded-full" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6 bg-white/5 rounded-xl border border-white/5 text-slate-400 text-sm">
              No suitable free slots found.
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {format(new Date(slot.start), 'EEE, MMM d')}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(slot.start), 'h:mm a')} - {format(new Date(slot.end), 'h:mm a')}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBookSlot(slot)}
                    disabled={creatingSlot === slot.start}
                    className="px-3 py-1.5 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 font-bold text-xs rounded-lg transition-colors border border-[#00f0ff]/30 flex items-center gap-1.5"
                  >
                    {creatingSlot === slot.start ? <div className="animate-spin w-3 h-3 border border-[#00f0ff] border-t-transparent rounded-full" /> : <Check className="w-3.5 h-3.5" />} Block
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SlotSuggestionModal;
