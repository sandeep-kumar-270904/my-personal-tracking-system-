import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Users, Star, Target, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const NetworkDepthAuditModal = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepth = async () => {
      try {
        const res = await axios.post('/api/networking/audit/depth');
        setData(res.data);
      } catch (err) {
        console.error('Failed to run depth audit', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepth();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#13141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quarterly Network Depth Audit</h2>
              <p className="text-sm text-slate-400">Moving from quantity to true placement leverage.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Analyzing your relationships...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DepthCard title="Surface" count={data?.depthCounts?.SURFACE || 0} icon={Users} color="slate" desc="No response yet." />
                <DepthCard title="Acquaintance" count={data?.depthCounts?.ACQUAINTANCE || 0} icon={Target} color="amber" desc="They replied once." />
                <DepthCard title="Connection" count={data?.depthCounts?.CONNECTION || 0} icon={Star} color="blue" desc="Strong relationship." />
                <DepthCard title="Relationship" count={data?.depthCounts?.RELATIONSHIP || 0} icon={ShieldCheck} color="emerald" desc="They know your work." />
              </div>

              <div className="bg-[#13141f] border border-white/5 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">Your Depth Strategy</h3>
                <p className="text-sm text-slate-300 mb-4">
                  You have <strong className="text-white">{data?.depthCounts?.SURFACE}</strong> contacts stuck at the "Surface" level. 
                  In placement season, <strong className="text-emerald-400">Relationships</strong> get you jobs, not <strong className="text-slate-400">Surface</strong> contacts.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">Next Step</h4>
                  <p className="text-sm text-blue-200/80 mb-3">Use the "Work Sharing" tracker on your top 5 Acquaintances to upgrade them to Relationships.</p>
                  <button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
                    View Contacts
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const DepthCard = ({ title, count, icon: Icon, color, desc }) => {
  const colorMap = {
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  };

  return (
    <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center ${colorMap[color]}`}>
      <Icon size={24} className="mb-2 opacity-80" />
      <div className="text-2xl font-bold mb-1">{count}</div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1">{title}</div>
      <div className="text-[10px] opacity-70">{desc}</div>
    </div>
  );
};

export default NetworkDepthAuditModal;
