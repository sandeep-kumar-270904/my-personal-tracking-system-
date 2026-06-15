import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Code, Plus, Trash2, CheckCircle, Clock, Circle, ExternalLink, Map, X, Flame } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const fetchDSA = async () => {
  const { data } = await api.get('/dsa');
  return data;
};

const ROADMAP_NODES = [
  'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 
  'Trees', 'Graphs', 'Dynamic Programming', 'Greedy', 'Backtracking'
];

const RECOMMENDED = [
  { title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy' },
  { title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy' },
  { title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium' },
  { title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium' },
];

const EditableCell = ({ value, onSave, type = 'text', options = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (val !== value) onSave(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setVal(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === 'select') {
      return (
        <select
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
        >
          {options.map(opt => <option key={opt} value={opt} className="bg-[#13141f]">{opt}</option>)}
        </select>
      );
    }
    return (
      <input
        type={type}
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#ff6b00] w-full"
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className="cursor-text px-2 py-1 hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors min-h-[28px] flex items-center"
    >
      {type === 'select' && options.includes(value) ? (
        <span className={
          value === 'Hard' ? 'text-red-400' : 
          value === 'Medium' ? 'text-amber-400' : 
          value === 'Easy' ? 'text-emerald-400' : 
          value === 'Completed' ? 'text-emerald-400 font-medium flex items-center gap-1' :
          value === 'In Progress' ? 'text-amber-400 font-medium flex items-center gap-1' :
          'text-slate-300'
        }>
          {value === 'Completed' && <CheckCircle className="w-3.5 h-3.5"/>}
          {value === 'In Progress' && <Clock className="w-3.5 h-3.5"/>}
          {value === 'Not Started' && <Circle className="w-3.5 h-3.5"/>}
          {value}
        </span>
      ) : (
        <span className="text-slate-300">{value}</span>
      )}
    </div>
  );
};

const DSAPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    topic: '', problemsSolved: 0, difficulty: 'Medium', status: 'Not Started', notes: '', url: '',
  });

  const { data: topics = [], isLoading, isError } = useQuery({
    queryKey: ['dsa'], queryFn: fetchDSA
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => await api.post('/dsa', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dsa']);
      toast.success('Topic added');
      setShowModal(false);
      setFormData({ topic: '', problemsSolved: 0, difficulty: 'Medium', status: 'Not Started', notes: '', url: '' });
    },
    onError: () => toast.error('Failed to add topic')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => await api.put(`/dsa/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['dsa']);
      toast.success('Saved');
    },
    onError: () => toast.error('Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/dsa/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['dsa']);
      toast.success('Topic deleted');
      setTopicToDelete(null);
    },
    onError: () => toast.error('Failed to delete topic')
  });

  const handleAddRoadmapTopic = (topic) => {
    saveMutation.mutate({
      topic, problemsSolved: 0, difficulty: 'Medium', status: 'Not Started', notes: 'Added from roadmap', url: ''
    });
    toast.success(`Adding ${topic}...`);
  };

  // Stats for charts
  const donutData = useMemo(() => {
    return [
      { name: 'Easy', value: topics.filter(t => t.difficulty === 'Easy').length, color: '#10b981' },
      { name: 'Medium', value: topics.filter(t => t.difficulty === 'Medium').length, color: '#f59e0b' },
      { name: 'Hard', value: topics.filter(t => t.difficulty === 'Hard').length, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [topics]);

  // Heatmap generation (last 60 days)
  const heatmapCells = useMemo(() => {
    const cells = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Group topics by updatedAt day (crude proxy for problems solved that day)
    const activityMap = {};
    topics.forEach(t => {
      const d = new Date(t.updatedAt);
      d.setHours(0,0,0,0);
      const time = d.getTime();
      activityMap[time] = (activityMap[time] || 0) + (t.problemsSolved > 0 ? 1 : 0);
    });

    for (let i = 59; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const time = date.getTime();
      const count = activityMap[time] || 0;
      cells.push({ date, count });
    }
    return cells;
  }, [topics]);

  if (isLoading) {
    return <div className="p-8 w-full max-w-6xl mx-auto"><div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">DSA Tracker</h1>
          <p className="text-slate-400">Track your Data Structures and Algorithms progress.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowRoadmap(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 flex items-center gap-2">
            <Map className="w-5 h-5 text-[#00f0ff]" /> Roadmap
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Topic
          </button>
        </div>
      </header>

      {/* Widgets row */}
      {topics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 shrink-0">
          
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20 text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-current" /> 12 Day Streak
            </div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Difficulty Spread</h3>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Heatmap (60 Days)</h3>
            <div className="flex flex-wrap gap-1.5">
              {heatmapCells.map((cell, idx) => {
                let bg = 'bg-white/5';
                if (cell.count === 1) bg = 'bg-emerald-500/20';
                if (cell.count === 2) bg = 'bg-emerald-500/40';
                if (cell.count >= 3) bg = 'bg-emerald-500/70';
                
                return (
                  <div 
                    key={idx} 
                    className={`w-4 h-4 rounded-sm ${bg} transition-colors hover:ring-2 ring-white/20 cursor-help`}
                    title={`${cell.date.toLocaleDateString()}: ${cell.count} updates`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
              <span>Less</span>
              <div className="w-3 h-3 bg-white/5 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-500/20 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-500/40 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-500/70 rounded-sm"></div>
              <span>More</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col glass-card rounded-2xl border border-white/5">
        {topics.length === 0 ? (
          <div className="flex-1">
            <EmptyState 
              icon={Code} 
              heading="No DSA topics tracked" 
              subtext="Start tracking your LeetCode and algorithms prep." 
              ctaText="Add First Topic"
              ctaAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 sticky top-0 z-10 border-b border-white/5">
                <tr>
                  <th className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Topic</th>
                  <th className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs w-32">Difficulty</th>
                  <th className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs w-32">Solved</th>
                  <th className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs w-40">Status</th>
                  <th className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs w-16 text-right">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topics.map(topic => (
                  <tr key={topic._id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <EditableCell 
                        value={topic.topic} 
                        onSave={(val) => updateMutation.mutate({ id: topic._id, updates: { topic: val } })}
                      />
                      {topic.url && (
                        <a href={topic.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 mt-1 ml-2">
                          <ExternalLink className="w-3 h-3"/> View Problem
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <EditableCell 
                        type="select"
                        options={['Easy', 'Medium', 'Hard']}
                        value={topic.difficulty} 
                        onSave={(val) => updateMutation.mutate({ id: topic._id, updates: { difficulty: val } })}
                      />
                    </td>
                    <td className="p-4">
                      <EditableCell 
                        type="number"
                        value={topic.problemsSolved} 
                        onSave={(val) => updateMutation.mutate({ id: topic._id, updates: { problemsSolved: Number(val) } })}
                      />
                    </td>
                    <td className="p-4">
                      <EditableCell 
                        type="select"
                        options={['Not Started', 'In Progress', 'Completed']}
                        value={topic.status} 
                        onSave={(val) => updateMutation.mutate({ id: topic._id, updates: { status: val } })}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setTopicToDelete(topic._id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        onConfirm={() => deleteMutation.mutate(topicToDelete)}
        title="Delete Topic"
        message="Are you sure you want to delete this topic?"
      />

      {/* Roadmap Modal */}
      <AnimatePresence>
        {showRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Map className="w-5 h-5 text-[#00f0ff]"/> DSA Roadmap</h2>
                <button onClick={() => setShowRoadmap(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="text-slate-400 mb-6 text-sm">Click any topic to add it to your tracker automatically.</p>
                <div className="flex flex-wrap gap-3">
                  {ROADMAP_NODES.map((node, idx) => {
                    const isTracked = topics.some(t => t.topic.toLowerCase() === node.toLowerCase());
                    return (
                      <button
                        key={idx}
                        disabled={isTracked}
                        onClick={() => handleAddRoadmapTopic(node)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isTracked 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-not-allowed opacity-60' 
                            : 'bg-white/5 border border-white/10 text-white hover:bg-[#ff6b00] hover:border-[#ff6b00]'
                        }`}
                      >
                        {node} {isTracked && <CheckCircle className="w-3 h-3 inline ml-1"/>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">Add DSA Topic</h2>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Pick Recommended Problem (Optional)</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
                    onChange={(e) => {
                      const prob = RECOMMENDED.find(p => p.title === e.target.value);
                      if (prob) setFormData({ ...formData, topic: prob.title, url: prob.url, difficulty: prob.difficulty });
                    }}
                  >
                    <option value="">-- Select a Problem --</option>
                    {RECOMMENDED.map((prob, idx) => (
                      <option key={idx} value={prob.title}>{prob.title} ({prob.difficulty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Topic / Problem Name</label>
                  <input type="text" required value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors" placeholder="e.g. Dynamic Programming or Two Sum"/>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Problem URL (Optional)</label>
                  <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors" placeholder="https://leetcode.com/..."/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Problems Solved</label>
                    <input type="number" min="0" value={formData.problemsSolved} onChange={(e) => setFormData({ ...formData, problemsSolved: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty</label>
                    <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none">
                      <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="bg-[#ff6b00] hover:bg-[#EA6C0A] text-white font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50">Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DSAPage;
