import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const fetchNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data;
};

const NotificationDropdown = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60000 // Refetch every minute
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => await api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const notificationActionMutation = useMutation({
    mutationFn: async ({ id, action }) => await api.post(`/notifications/${id}/action`, { action }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['events']);
      if (variables.action === 'mark_sent') {
        toast.success('Thank-you note marked as sent!');
      } else if (variables.action === 'add_reminder') {
        toast.success('Follow-up reminder scheduled!');
      }
    },
    onError: () => {
      toast.error('Failed to save action');
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => await api.put(`/notifications/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All marked as read');
    }
  });

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'INTERVIEW': return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'APPLICATION_STALE': return <Clock className="w-5 h-5 text-amber-400" />;
      case 'DSA_REMINDER': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'FOLLOW_UP_NUDGE': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default: return <Bell className="w-5 h-5 text-[#00f0ff]" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0f]/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-[#ff6b00]/20 text-[#ff6b00] text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-[#00f0ff] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div 
                        key={notif._id}
                        onClick={() => {
                          if (notif.link) {
                            navigate(notif.link);
                            setIsOpen(false);
                          }
                          if (!notif.read) {
                            markAsReadMutation.mutate(notif._id);
                          }
                        }}
                        className={`p-4 border-b border-white/5 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-[#ff6b00]/5'}`}
                      >
                        <div className="shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <button 
                                onClick={(e) => handleMarkAsRead(e, notif._id)}
                                className="text-slate-500 hover:text-emerald-400 p-1"
                                title="Mark as read"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.type === 'FOLLOW_UP_NUDGE' && !notif.read && (
                            <div className="flex gap-2 mt-2.5 mb-3 flex-wrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notificationActionMutation.mutate({ id: notif._id, action: 'mark_sent' });
                                }}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                              >
                                Mark sent
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notificationActionMutation.mutate({ id: notif._id, action: 'add_reminder' });
                                }}
                                className="px-2.5 py-1 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/30 rounded-lg text-xs font-bold transition-colors"
                              >
                                Add reminder
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notificationActionMutation.mutate({ id: notif._id, action: 'dismiss' });
                                }}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
