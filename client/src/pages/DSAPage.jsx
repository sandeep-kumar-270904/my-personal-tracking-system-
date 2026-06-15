import { useState, useEffect } from 'react';
import { Code, Plus, Trash2, CheckCircle, Clock, Circle, ExternalLink, Map } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const DSAPage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    problemsSolved: 0,
    difficulty: 'Medium',
    status: 'Not Started',
    notes: '',
    url: '',
  });

  const recommendedProblems = [
    { title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy' },
    { title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy' },
    { title: 'Contains Duplicate', url: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy' },
    { title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium' },
    { title: 'Maximum Subarray', url: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium' },
    { title: 'Maximum Product Subarray', url: 'https://leetcode.com/problems/maximum-product-subarray/', difficulty: 'Medium' },
    { title: 'Find Minimum in Rotated Sorted Array', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium' },
    { title: 'Search in Rotated Sorted Array', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium' },
    { title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium' },
    { title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium' },
  ];

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data } = await api.get('/dsa');
      setTopics(data);
    } catch (error) {
      console.error('Failed to fetch DSA topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/dsa', formData);
      setTopics([data, ...topics]);
      setShowModal(false);
      setFormData({ topic: '', problemsSolved: 0, difficulty: 'Medium', status: 'Not Started', notes: '', url: '' });
    } catch (error) {
      console.error('Failed to add topic:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/dsa/${id}`, { status });
      setTopics(topics.map(t => t._id === id ? data : t));
    } catch (error) {
      console.error('Failed to update topic:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dsa/${id}`);
      setTopics(topics.filter((t) => t._id !== id));
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-[#13141f] border-white/10';
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">DSA Tracker</h1>
          <p className="text-slate-400 mt-1">Track your Data Structures and Algorithms progress</p>
        </div>
        <div className="flex gap-4">
          <a
            href="https://roadmap.sh/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors"
          >
            <Map className="w-5 h-5 mr-2 text-[#00f0ff]" /> DSA Roadmap
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Topic/Problem
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/[0.02] text-xs uppercase text-slate-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Topic</th>
                <th className="px-6 py-4 font-medium">Difficulty</th>
                <th className="px-6 py-4 font-medium">Problems Solved</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {topics.map((topic) => (
                <tr key={topic._id} className="group hover:bg-white/[0.02] transition-all duration-300 relative cursor-pointer">
                  <td className="px-6 py-4">
                    {topic.url ? (
                      <a href={topic.url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-200 hover:text-[#00f0ff] transition-colors flex items-center gap-2 group-hover:text-[#00f0ff]">
                        {topic.topic} <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ) : (
                      <div className="font-medium text-slate-200 group-hover:text-[#00f0ff] transition-colors">{topic.topic}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">{topic.notes}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{topic.problemsSolved}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(topic.status)}
                      <select
                        value={topic.status}
                        onChange={(e) => updateStatus(topic._id, e.target.value)}
                        className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer hover:text-white transition-colors"
                      >
                        <option value="Not Started" className="bg-[#13141f]">Not Started</option>
                        <option value="In Progress" className="bg-[#13141f]">In Progress</option>
                        <option value="Completed" className="bg-[#13141f]">Completed</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(topic._id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {topics.length === 0 && (
          <div className="text-center py-16">
            <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No topics tracked</h3>
            <p className="text-slate-500">Add your first DSA topic to start tracking your prep.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 rounded-2xl border border-white/5"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add DSA Topic</h2>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Pick Recommended Problem (Optional)</label>
                <select
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 mb-4"
                  onChange={(e) => {
                    const prob = recommendedProblems.find(p => p.title === e.target.value);
                    if (prob) {
                      setFormData({ ...formData, topic: prob.title, url: prob.url, difficulty: prob.difficulty });
                    }
                  }}
                >
                  <option value="">-- Select a Problem --</option>
                  {recommendedProblems.map((prob, idx) => (
                    <option key={idx} value={prob.title}>{prob.title} ({prob.difficulty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Topic / Problem Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Dynamic Programming or Two Sum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Problem URL (Optional)</label>
                <input
                  type="url"
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://leetcode.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Problems Solved</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    value={formData.problemsSolved}
                    onChange={(e) => setFormData({ ...formData, problemsSolved: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Difficulty</label>
                  <select
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Need to revise memoization..."
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[#13141f] hover:bg-white/[0.05] text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DSAPage;
