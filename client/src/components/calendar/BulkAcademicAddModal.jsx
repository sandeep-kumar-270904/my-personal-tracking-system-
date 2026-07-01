import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Calendar as CalendarIcon, Clock, Save, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (t) => {
  let timeStr = t.replace(/\s/g, '').toLowerCase();
  let isPm = timeStr.includes('pm') || timeStr.includes('p.m');
  let isAm = timeStr.includes('am') || timeStr.includes('a.m');
  timeStr = timeStr.replace(/[a-z.]/g, '');
  
  let [h, m] = timeStr.split(':');
  h = parseInt(h, 10);
  m = m ? parseInt(m, 10) : 0;
  
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const extractDays = (str) => {
  const s = str.toLowerCase();
  const days = new Set();
  
  // Need space or boundary around to prevent matching "time" with "m" etc.
  // Actually, M T W Th F is commonly used.
  if (/\b(m|mon|monday)\b/.test(s)) days.add(1);
  if (/\b(t|tue|tues|tuesday)\b/.test(s) && !/\b(th)\b/.test(s)) days.add(2); // avoid Th matching T if not careful, though \b helps
  if (/\b(th|thu|thur|thurs|thursday)\b/.test(s)) days.add(4);
  if (/\b(w|wed|wednesday)\b/.test(s)) days.add(3);
  if (/\b(f|fri|friday)\b/.test(s)) days.add(5);
  
  // also support common format MWF or T/Th
  if (/m\s*w\s*f/i.test(s)) { days.add(1); days.add(3); days.add(5); }
  if (/t\s*\/?\s*th/i.test(s)) { days.add(2); days.add(4); }
  if (/m\s*\/?\s*w/i.test(s)) { days.add(1); days.add(3); }

  return Array.from(days).sort();
};

const parseScheduleText = (text) => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const parsed = [];

  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)/i;

  lines.forEach((line) => {
    const timeMatch = line.match(timeRegex);
    const days = extractDays(line);
    
    if (timeMatch && days.length > 0) {
      let title = line.replace(timeMatch[0], '').trim();
      // Remove day strings
      title = title.replace(/\b(m|t|w|th|f|mon|tue|wed|thu|fri|monday|tuesday|wednesday|thursday|friday|mwf|t\/th)\b/gi, '').trim();
      title = title.replace(/^[,\s/|-]+|[,\s/|-]+$/g, '');
      
      const startTime = formatTime(timeMatch[1]);
      const endTime = formatTime(timeMatch[2]);
      
      parsed.push({
        id: Math.random().toString(36).substr(2, 9),
        title: title || 'Academic Class',
        days: days,
        start_time: startTime,
        end_time: endTime
      });
    }
  });

  return parsed;
};

const getNextDateForDay = (dayOfWeek) => {
  const d = new Date();
  d.setDate(d.getDate() + ((dayOfWeek + 7 - d.getDay()) % 7));
  return d.toISOString().split('T')[0];
};

const BulkAcademicAddModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [parsedEvents, setParsedEvents] = useState([]);
  const [endDate, setEndDate] = useState('');

  const handleParse = () => {
    const events = parseScheduleText(inputText);
    if (events.length === 0) {
      toast.error("Couldn't detect any classes. Please check the format.");
      return;
    }
    setParsedEvents(events);
    setStep(2);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!endDate) throw new Error("Please select a semester end date");
      
      const payloadPromises = [];
      parsedEvents.forEach(evt => {
        evt.days.forEach(day => {
          const firstDate = getNextDateForDay(day);
          
          payloadPromises.push(
            api.post('/events', {
              title: evt.title,
              type: 'academic',
              date: firstDate,
              start_time: evt.start_time,
              end_time: evt.end_time,
              is_all_day: false,
              is_recurring: true,
              recurrence_pattern: 'weekly',
              recurrence_end_date: endDate,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          );
        });
      });

      await Promise.all(payloadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Academic schedule imported successfully!');
      onClose();
      // Reset state
      setTimeout(() => {
        setStep(1);
        setInputText('');
        setEndDate('');
      }, 300);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to import schedule');
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02] shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#00f0ff]" />
              Smart Paste Schedule
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 1 ? (
            <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-slate-300">
                Paste your class schedule below. We'll automatically extract the days, times, and course names.
              </p>
              
              <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Example Format</h4>
                <div className="font-mono text-xs text-slate-400 space-y-1">
                  <div>Data Structures Mon Wed 10:00am - 11:30am</div>
                  <div>Algorithms T/Th 14:00-15:00</div>
                  <div>Physics Lab Friday 1pm to 4pm</div>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-48 bg-[#1a1b26] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#00f0ff]/50 custom-scrollbar resize-none"
                placeholder="Paste your schedule here..."
                autoFocus
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleParse}
                  disabled={!inputText.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-[#13141f] hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Analyze Schedule <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">Preview Classes</h3>
                  <button onClick={() => setStep(1)} className="text-xs text-[#00f0ff] hover:underline">
                    Edit Text
                  </button>
                </div>
                
                <div className="space-y-3 mb-6">
                  {parsedEvents.map((evt) => (
                    <div key={evt.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white mb-1">{evt.title}</div>
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {evt.days.map(d => DAYS[d]).join(', ')}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {evt.start_time} - {evt.end_time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Semester End Date</label>
                  <p className="text-xs text-slate-500 mb-3">When should these weekly repeating events stop?</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[#13141f] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff]/50"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 shrink-0">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!endDate || saveMutation.isPending}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#00f0ff] hover:bg-[#00d0e0] text-[#13141f] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveMutation.isPending ? 'Saving...' : 'Confirm & Add to Calendar'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BulkAcademicAddModal;
