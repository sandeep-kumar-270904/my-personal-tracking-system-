import { useState, useRef, useEffect } from 'react';
import { Sparkles, BarChart, Scissors, Check, X, History, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function AI_RewriteTab({ resume, sections, onSectionUpdate }) {
  const [activeSection, setActiveSection] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [currentRewriteId, setCurrentRewriteId] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [history, setHistory] = useState([]);

  // Setup EventSource for streaming
  const handleRewrite = async (section, type) => {
    setActiveSection(section);
    setIsStreaming(true);
    setStreamedContent('');
    setCurrentRewriteId(null);
    setViewingHistory(false);

    try {
      const response = await fetch(`http://localhost:5000/api/resumes/${resume._id}/sections/${section._id}/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust if using different auth
        },
        body: JSON.stringify({ rewriteType: type })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        // SSE messages are separated by \n\n
        const messages = chunkValue.split('\n\n').filter(Boolean);
        for (const msg of messages) {
          if (msg.startsWith('data: ')) {
            const dataStr = msg.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setStreamedContent(prev => prev + data.text);
              }
              if (data.rewriteId) {
                setCurrentRewriteId(data.rewriteId);
              }
              if (data.error) {
                console.error('Server error during stream');
              }
            } catch (err) {
              // incomplete JSON chunk
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream failed', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const acceptRewrite = async () => {
    if (!currentRewriteId || !activeSection) return;
    try {
      const { data } = await api.post(`/resumes/${resume._id}/sections/${activeSection._id}/rewrite/accept`, {
        rewriteId: currentRewriteId
      });
      onSectionUpdate(data.section);
      setActiveSection(null);
      setStreamedContent('');
    } catch (err) {
      console.error('Failed to accept rewrite', err);
    }
  };

  const discardRewrite = () => {
    setActiveSection(null);
    setStreamedContent('');
    setCurrentRewriteId(null);
  };

  const fetchHistory = async (section) => {
    try {
      const { data } = await api.get(`/resumes/${resume._id}/sections/${section._id}/rewrites`);
      setHistory(data);
      setActiveSection(section);
      setViewingHistory(true);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  if (viewingHistory && activeSection) {
    return (
      <div className="space-y-6">
        <button onClick={() => setViewingHistory(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sections
        </button>
        <h4 className="text-emerald-400 font-semibold">{activeSection.heading} - Rewrite History</h4>
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-slate-500">No rewrite history for this section.</div>
          ) : (
            history.map((h, i) => (
              <div key={h._id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-300">
                    {h.rewriteType}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap mb-4 bg-slate-900/50 p-3 rounded">
                  {h.rewrittenContent}
                </div>
                {h.wasAccepted ? (
                  <span className="text-emerald-400 text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Accepted Version
                  </span>
                ) : (
                  <button onClick={() => {
                     setStreamedContent(h.rewrittenContent);
                     setCurrentRewriteId(h._id);
                     setViewingHistory(false);
                  }} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-white">
                    Preview this version
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No sections extracted to rewrite.</div>
      ) : (
        sections.map((sec) => (
          <div key={sec._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden relative">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h4 className="font-semibold text-emerald-400 uppercase tracking-wider text-sm">{sec.heading}</h4>
              <button onClick={() => fetchHistory(sec)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs">
                <History className="w-3 h-3" /> History
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Original Content */}
              <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/50 p-3 rounded-lg">
                {sec.content}
              </div>

              {/* Streaming or Streamed Content */}
              {(activeSection?._id === sec._id && (isStreaming || streamedContent)) && (
                <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5 relative mt-4">
                  <div className="text-sm text-emerald-100 whitespace-pre-wrap font-mono leading-relaxed typewriter-container">
                    {streamedContent}
                    {isStreaming && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1 align-middle" />}
                  </div>
                  
                  {!isStreaming && streamedContent && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-emerald-500/20">
                      <button onClick={acceptRewrite} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button onClick={discardRewrite} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <X className="w-4 h-4" /> Discard
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rewrite Triggers */}
              {(!activeSection || activeSection._id !== sec._id) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => handleRewrite(sec, 'IMPROVE')} disabled={isStreaming} className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5" /> Improve Impact
                  </button>
                  <button onClick={() => handleRewrite(sec, 'QUANTIFY')} disabled={isStreaming} className="text-xs bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium border border-sky-500/20">
                    <BarChart className="w-3.5 h-3.5" /> Quantify Metrics
                  </button>
                  <button onClick={() => handleRewrite(sec, 'SHORTEN')} disabled={isStreaming} className="text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium border border-amber-500/20">
                    <Scissors className="w-3.5 h-3.5" /> Shorten
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
