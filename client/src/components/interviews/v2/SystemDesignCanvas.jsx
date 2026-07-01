import React, { useState, useCallback } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize2, Minimize2, CheckCircle, Brain } from 'lucide-react';
import axios from 'axios';

const initialNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Client / User' }, style: { background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '10px' } },
];
const initialEdges = [];

export default function SystemDesignCanvas({ problemType, interviewId, onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const [reqs, setReqs] = useState('');
  const [capacity, setCapacity] = useState('');
  const [deepDive, setDeepDive] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type) => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: type },
      style: { background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '10px' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/system-design/attempt', {
        interviewId,
        problemType,
        canvasData: {
          reqs, capacity, deepDive,
          nodes: nodes.map(n => n.data.label)
        }
      });
      setEvaluation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-[200] flex flex-col md:flex-row">
      {/* Sidebar: Text Prep */}
      <div className="w-full md:w-[400px] bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-bold text-white text-lg">{problemType}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {evaluation ? (
          <div className="p-6 space-y-6">
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl text-center">
              <Brain className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">{evaluation.score} <span className="text-sm font-normal text-gray-500">/ 100</span></div>
              <p className="text-indigo-300 text-sm font-medium">AI Evaluation Complete</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Feedback</h3>
              <p className="text-gray-200 text-sm leading-relaxed">{evaluation.feedback}</p>
            </div>
            <button onClick={onClose} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">Exit Canvas</button>
          </div>
        ) : (
          <div className="p-6 flex-1 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">1. Requirements Clarification</label>
              <textarea rows="3" value={reqs} onChange={e => setReqs(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm" placeholder="Functional and non-functional requirements..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">2. Capacity Estimation</label>
              <textarea rows="3" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm font-mono" placeholder="DAU, TPS, Storage per day..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">4. Deep Dive & Trade-offs</label>
              <textarea rows="4" value={deepDive} onChange={e => setDeepDive(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm" placeholder="Why Redis over Memcached? DB sharding strategy..." />
            </div>
            <button onClick={handleEvaluate} disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4">
              {loading ? 'Evaluating...' : 'Finish & Evaluate Design'}
            </button>
          </div>
        )}
      </div>

      {/* Main Area: React Flow Canvas */}
      <div className="flex-1 h-full relative bg-gray-950">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button onClick={() => addNode('Load Balancer')} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-white hover:bg-gray-700">+ Load Balancer</button>
          <button onClick={() => addNode('API Server')} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-white hover:bg-gray-700">+ API Server</button>
          <button onClick={() => addNode('Database')} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-white hover:bg-gray-700">+ Database</button>
          <button onClick={() => addNode('Cache')} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-white hover:bg-gray-700">+ Cache</button>
          <button onClick={() => addNode('Message Queue')} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-white hover:bg-gray-700">+ Queue</button>
        </div>
        <div className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background color="#374151" gap={16} />
            <Controls />
            <MiniMap style={{ backgroundColor: '#111827' }} maskColor="#1f293780" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
