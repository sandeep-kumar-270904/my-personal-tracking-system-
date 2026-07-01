import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, Building, Mail, CheckCircle, X } from 'lucide-react';
import api from '../services/api';

const RecruiterBookingPage = () => {
  const { token } = useParams();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    recruiterName: '',
    company: '',
    email: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruiterBooking', token],
    queryFn: async () => {
      const res = await api.get(`/public/booking/${token}`);
      return res.data;
    },
    enabled: !!token
  });

  const bookMutation = useMutation({
    mutationFn: async (payload) => await api.post(`/public/booking/${token}`, payload),
    onSuccess: () => {
      setIsSuccess(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    bookMutation.mutate({
      date: selectedSlot.start, // UTC date string
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      duration: data.duration,
      ...formData
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#13141f] border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link Expired or Invalid</h2>
          <p className="text-slate-400 text-sm">
            This booking link is no longer active. Please contact the student directly for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-2xl border border-white/5 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Interview Booked!</h2>
          <p className="text-slate-400 mb-6">
            Your interview with {data.userName} has been scheduled.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <span>{format(new Date(selectedSlot.date), 'EEEE, MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>{selectedSlot.start_time} - {selectedSlot.end_time}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group slots by date
  const groupedSlots = {};
  data.slots.forEach(slot => {
    const dStr = slot.start.split('T')[0];
    if (!groupedSlots[dStr]) groupedSlots[dStr] = [];
    groupedSlots[dStr].push(slot);
  });

  return (
    <div className="min-h-screen bg-[#0a0b14] flex justify-center py-12 px-4 sm:px-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Profile & Details */}
        <div className="glass-card p-8 rounded-2xl border border-white/5 sticky top-12">
          <h1 className="text-3xl font-bold text-white mb-2">{data.userName}</h1>
          <p className="text-slate-400 text-lg mb-8">Interview Scheduling</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-[#00f0ff]" />
              <span>{data.duration} Minutes</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CalendarIcon className="w-5 h-5 text-[#00f0ff]" />
              <span>Pick a slot from availability</span>
            </div>
          </div>
        </div>

        {/* Right Side: Slots & Form */}
        <div className="space-y-6">
          {!selectedSlot ? (
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Select a Time</h2>
              {Object.keys(groupedSlots).length === 0 ? (
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5 text-slate-400">
                  No available slots found in the specified window.
                </div>
              ) : (
                Object.keys(groupedSlots).map(dateStr => (
                  <div key={dateStr} className="space-y-3">
                    <h3 className="font-bold text-slate-300 sticky top-0 bg-[#13141f]/90 backdrop-blur py-2 z-10">
                      {format(new Date(dateStr), 'EEEE, MMMM do')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {groupedSlots[dateStr].map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className="px-4 py-3 bg-white/5 hover:bg-[#00f0ff]/10 border border-white/10 hover:border-[#00f0ff]/30 text-white hover:text-[#00f0ff] rounded-xl font-bold transition-all"
                        >
                          {slot.start_time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Confirm Details</h2>
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Change Time
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 mb-6">
                <div className="font-bold text-white">{format(new Date(selectedSlot.date), 'EEEE, MMMM do')}</div>
                <div className="text-slate-400 mt-1">{selectedSlot.start_time} - {selectedSlot.end_time}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recruiter Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      required
                      value={formData.recruiterName}
                      onChange={e => setFormData({...formData, recruiterName: e.target.value})}
                      className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
                  <div className="relative">
                    <Building className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="jane@acme.com"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={bookMutation.isPending}
                    className="w-full py-3 bg-[#00f0ff] hover:bg-blue-400 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {bookMutation.isPending ? 'Confirming...' : 'Confirm Interview'}
                  </button>
                  {bookMutation.isError && (
                    <p className="text-red-400 text-sm text-center mt-3">
                      {bookMutation.error.response?.data?.message || 'Failed to book slot. Please try another.'}
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecruiterBookingPage;
