import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, Star, Settings, ThumbsUp, BarChart2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AdminCollectionsTab from './admin/AdminCollectionsTab';

const AdminPanel = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Submissions'); // 'Resources', 'Submissions', 'Spotlight', 'Analytics'
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [editingHoursId, setEditingHoursId] = useState(null);
  const [editHoursValue, setEditHoursValue] = useState('');

  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['adminSubmissions'],
    queryFn: async () => {
      const res = await api.get('/admin/resources/submissions');
      return res.data;
    },
    enabled: isOpen && activeTab === 'Submissions'
  });

  const { data: allResources = [], isLoading: resLoading } = useQuery({
    queryKey: ['resources'], // the main resources query fetches all if admin
    enabled: isOpen && (activeTab === 'Resources' || activeTab === 'Spotlight')
  });

  const { data: spotlight } = useQuery({
    queryKey: ['spotlight'],
    queryFn: async () => {
      const res = await api.get('/resources/spotlight');
      return res.data;
    },
    enabled: isOpen && activeTab === 'Spotlight'
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await api.get('/admin/resources/analytics');
      return res.data;
    },
    enabled: isOpen && activeTab === 'Analytics'
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => await api.post(`/admin/resources/submissions/${id}/approve`),
    onSuccess: () => {
      toast.success('Resource approved and published!');
      queryClient.invalidateQueries(['adminSubmissions']);
      queryClient.invalidateQueries(['resources']);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => await api.post(`/admin/resources/submissions/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Submission rejected.');
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries(['adminSubmissions']);
    }
  });

  const setSpotlightMutation = useMutation({
    mutationFn: async (resourceId) => await api.post(`/admin/resources/spotlight`, { resourceId }),
    onSuccess: () => {
      toast.success('Spotlight updated!');
      queryClient.invalidateQueries(['spotlight']);
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }) => await api.put(`/admin/resources/${id}`, data),
    onSuccess: () => {
      toast.success('Resource updated!');
      setEditingHoursId(null);
      queryClient.invalidateQueries(['resources']);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/resources/${id}`),
    onSuccess: () => {
      toast.success('Resource deleted!');
      queryClient.invalidateQueries(['resources']);
    }
  });

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const brokenLinks = allResources.filter(r => r.isAlive === false || r.reportedBroken === true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>

        {/* Panel */}
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full md:w-[600px] h-full bg-[#111111] border-l border-white/10 shadow-2xl flex flex-col z-[90]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-[#1a1b26]/30 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Resource Management
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-4 gap-2 border-b border-white/5 shrink-0 overflow-x-auto custom-scrollbar">
            {['Submissions', 'Resources', 'Collections', 'Spotlight', 'Analytics', 'Broken Links'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'Submissions' && pendingSubmissions.length > 0 && (
                  <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded text-xs ml-2">{pendingSubmissions.length}</span>
                )}
                {tab === 'Broken Links' && brokenLinks.length > 0 && (
                  <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs ml-2">{brokenLinks.length}</span>
                )}
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0a0a0a]">
            {/* SUBMISSIONS TAB */}
            {activeTab === 'Submissions' && (
              <div className="space-y-4">
                {subsLoading ? (
                  <div className="animate-pulse text-slate-500">Loading submissions...</div>
                ) : pendingSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                    <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/50" />
                    <p className="font-medium text-lg text-slate-300">No pending submissions 🎉</p>
                    <p className="text-sm">You are all caught up!</p>
                  </div>
                ) : (
                  pendingSubmissions.map(sub => (
                    <div key={sub._id} className="bg-[#13141f] border border-white/10 p-5 rounded-xl flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">NEW</span>
                            <span className="text-xs text-slate-400">By {sub.submittedBy?.name || 'Unknown'} • {sub.submittedBy?.college}</span>
                          </div>
                          <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white hover:underline decoration-blue-500">
                            {sub.name}
                          </a>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/5 text-slate-300 rounded text-[10px] font-bold border border-white/10 uppercase">{sub.category}</span>
                        <span className="px-2 py-1 bg-white/5 text-slate-300 rounded text-[10px] font-bold border border-white/10 uppercase">{sub.difficulty}</span>
                      </div>

                      <div className="bg-[#0a0a0f] p-4 rounded-lg border border-white/5 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Description</p>
                          <p className="text-sm text-slate-200">{sub.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Why Recommend?</p>
                          <p className="text-sm text-emerald-200/80">{sub.whyRecommend}</p>
                        </div>
                        <div className="flex gap-4 pt-2 border-t border-white/5">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Time</p>
                            <p className="text-xs text-slate-300">{sub.timeToComplete}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Level</p>
                            <p className="text-xs text-slate-300">{sub.levelWhenHelped}</p>
                          </div>
                        </div>
                      </div>

                      {rejectingId === sub._id ? (
                        <div className="flex flex-col gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          <input 
                            type="text" 
                            placeholder="Reason for rejection..." 
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={() => rejectMutation.mutate({ id: sub._id, reason: rejectReason })} disabled={!rejectReason.trim()} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">Confirm Reject</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => approveMutation.mutate(sub._id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all text-sm">
                            <Check className="w-4 h-4" /> Approve & Publish
                          </button>
                          <button onClick={() => setRejectingId(sub._id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-slate-300 font-bold rounded-lg transition-all text-sm">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SPOTLIGHT TAB */}
            {activeTab === 'Spotlight' && (
              <div className="space-y-6">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Star className="w-4 h-4" /> Today's Active Spotlight
                  </h3>
                  {spotlight ? (
                    <div className="bg-[#0a0a0f] border border-white/5 rounded-lg p-4">
                      <p className="text-white font-bold text-lg mb-1">{spotlight.title}</p>
                      <p className="text-sm text-slate-400 mb-3">{spotlight.category} • {spotlight.difficulty}</p>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-indigo-400" /> {spotlight.upvoteCount} Upvotes</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {spotlight.completionCount} Completions</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No spotlight active today.</p>
                  )}
                </div>

                <div className="bg-[#13141f] border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Change Today's Spotlight</h3>
                  <p className="text-xs text-slate-400 mb-4">Select any published resource to override the auto-selected spotlight for today.</p>
                  
                  <div className="space-y-3">
                    <select 
                      onChange={(e) => {
                        if(e.target.value && confirm("This will override today's active spotlight. Continue?")) {
                          setSpotlightMutation.mutate(e.target.value);
                          e.target.value = ""; // reset
                        }
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a resource to spotlight...</option>
                      {allResources.map(res => (
                        <option key={res.id} value={res.id}>{res.title} ({res.category})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* RESOURCES TAB (Placeholder for full CRUD if needed, simple list for now) */}
            {activeTab === 'Resources' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200/80 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                  <p>Full resource table editing is typically done via Prisma Studio or external DB tools. Shown here is a quick overview of published status.</p>
                </div>
                
                <div className="grid gap-2">
                  {allResources.map(res => (
                    <div key={res.id} className="flex justify-between items-center p-3 bg-[#13141f] border border-white/5 rounded-lg">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-bold text-white truncate">{res.title}</p>
                        <p className="text-xs text-slate-500">{res.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {editingHoursId === res.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-16 bg-[#0a0a0f] border border-white/10 rounded px-2 py-1 text-xs text-white" 
                              value={editHoursValue}
                              onChange={e => setEditHoursValue(e.target.value)}
                              placeholder="Hrs"
                            />
                            <button onClick={() => updateResourceMutation.mutate({ id: res.id, data: { estimatedHours: Number(editHoursValue) } })} className="text-emerald-400 p-1 hover:bg-emerald-500/20 rounded"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingHoursId(null)} className="text-slate-400 p-1 hover:bg-white/5 rounded"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingHoursId(res.id); setEditHoursValue(res.estimatedHours || 0); }} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 border border-white/10 px-2 py-1 rounded">
                            ~{res.estimatedHours || 0}h
                          </button>
                        )}
                        <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase rounded border ${res.isPublished ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {res.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COLLECTIONS TAB */}
            {activeTab === 'Collections' && (
              <AdminCollectionsTab />
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'Analytics' && (
              <div className="space-y-6">
                {analyticsLoading ? (
                  <div className="animate-pulse text-slate-500">Loading analytics...</div>
                ) : analytics ? (
                  <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Published Resources', value: analytics.overview.totalResources },
                        { label: 'Total Completions', value: analytics.overview.totalCompletions },
                        { label: 'Total Upvotes', value: analytics.overview.totalUpvotes },
                        { label: 'Total Reviews', value: analytics.overview.totalReviews },
                        { label: 'Active Students (Week)', value: analytics.overview.activeStudentsThisWeek },
                        { label: 'Pending Submissions', value: analytics.overview.pendingSubmissions }
                      ].map((stat, i) => (
                        <div key={i} className="bg-[#13141f] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Engagement Chart */}
                    <div className="bg-[#13141f] border border-white/10 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-white mb-4">Daily Completions — Last 30 Days</h3>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.dailyCompletions}>
                            <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                            <YAxis stroke="#52525b" fontSize={10} width={30} allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-[#13141f] border border-white/10 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-white mb-4">Category Completion Rates</h3>
                      <div className="space-y-4">
                        {analytics.categoryBreakdown.map(cat => {
                          const colors = {
                            'DSA': 'bg-blue-500',
                            'Web Dev': 'bg-green-500',
                            'System Design': 'bg-purple-500',
                            'CS Core': 'bg-orange-500',
                            'Interview Prep': 'bg-red-500'
                          };
                          const color = colors[cat.category] || 'bg-indigo-500';
                          return (
                            <div key={cat.category}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-300">{cat.category} <span className="text-slate-500">({cat.resourceCount} resources)</span></span>
                                <span className="font-bold text-white">{cat.completionRate}%</span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${color}`} style={{ width: `${Math.min(100, cat.completionRate)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Resources */}
                    <div className="bg-[#13141f] border border-white/10 rounded-xl p-5 overflow-hidden">
                      <h3 className="text-sm font-bold text-white mb-4">Most Popular Resources</h3>
                      <div className="overflow-x-auto -mx-5 px-5 custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead>
                            <tr className="text-slate-500 border-b border-white/5">
                              <th className="pb-3 font-medium">Rank</th>
                              <th className="pb-3 font-medium">Resource</th>
                              <th className="pb-3 font-medium">Completions</th>
                              <th className="pb-3 font-medium">Upvotes</th>
                              <th className="pb-3 font-medium">Rating</th>
                              <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {analytics.topResources.map((res, i) => (
                              <tr key={res.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                                <td className="py-3 font-bold text-slate-500">#{i + 1}</td>
                                <td className="py-3 pr-4 max-w-[200px] truncate">
                                  <span className="font-medium text-white block truncate">{res.title}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{res.category}</span>
                                </td>
                                <td className="py-3 font-mono">{res.completions}</td>
                                <td className="py-3 font-mono text-indigo-400">{res.upvotes}</td>
                                <td className="py-3 font-mono text-amber-400">{res.avgRating > 0 ? `${res.avgRating} ★` : '-'}</td>
                                <td className="py-3 text-right">
                                  <button 
                                    onClick={() => setSpotlightMutation.mutate(res.id)}
                                    className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded transition-colors font-bold uppercase tracking-wider"
                                  >
                                    Spotlight
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500">Failed to load analytics.</div>
                )}
              </div>
            )}

            {/* BROKEN LINKS TAB */}
            {activeTab === 'Broken Links' && (
              <div className="space-y-4">
                {resLoading ? (
                  <div className="animate-pulse text-slate-500">Loading resources...</div>
                ) : brokenLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                    <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/50" />
                    <p className="font-medium text-lg text-slate-300">No broken links found 🎉</p>
                    <p className="text-sm">All resources are looking healthy!</p>
                  </div>
                ) : (
                  brokenLinks.map(res => (
                    <div key={res.id} className="bg-[#13141f] border border-red-500/20 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 flex gap-2">
                         {res.isAlive === false && <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Dead Link (Auto)</span>}
                         {res.reportedBroken && <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">Reported</span>}
                      </div>

                      <div className="pr-20">
                        <h4 className="text-white font-bold text-lg mb-1">{res.title}</h4>
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all mb-3 block">
                          {res.url}
                        </a>
                      </div>

                      {editingHoursId === res.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full" 
                            value={editHoursValue}
                            onChange={(e) => setEditHoursValue(e.target.value)}
                            placeholder="New URL"
                          />
                          <button 
                            onClick={() => updateResourceMutation.mutate({ id: res.id, data: { url: editHoursValue, isAlive: true, reportedBroken: false } })}
                            disabled={updateResourceMutation.isLoading}
                            className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingHoursId(null)} className="p-1.5 text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingHoursId(res.id);
                              setEditHoursValue(res.url);
                            }}
                            className="flex-1 flex justify-center py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10"
                          >
                            Edit URL
                          </button>
                          <button 
                            onClick={() => updateResourceMutation.mutate({ id: res.id, data: { isAlive: true, reportedBroken: false } })}
                            disabled={updateResourceMutation.isLoading}
                            className="flex-1 flex justify-center py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg border border-emerald-500/20"
                          >
                            Mark Fixed
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this resource?')) {
                                deleteResourceMutation.mutate(res.id);
                              }
                            }}
                            disabled={deleteResourceMutation.isLoading}
                            className="flex-1 flex justify-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-lg border border-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminPanel;
