import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Send, Copy, Download, RefreshCw, Settings2, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import api from '../../services/api';

const TONES = ['Professional', 'Conversational', 'Enthusiastic'];
const LENGTHS = [
  { label: 'Short (150 words)', value: 150 },
  { label: 'Medium (300 words)', value: 300 },
  { label: 'Full (500 words)', value: 500 }
];

export default function CoverLetterGenerator({ isOpen, onClose, resume }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [wordCount, setWordCount] = useState(LENGTHS[1].value);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const textareaRef = useRef(null);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!company || !role) return;

    setIsGenerating(true);
    setStreamedContent('');
    setIsEditing(false);

    try {
      const response = await fetch(`http://localhost:5000/api/resumes/${resume._id}/cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetCompany: company, targetRole: role, jobDescription: jd, tone, wordCount })
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const messages = chunkValue.split('\n\n').filter(Boolean);
        for (const msg of messages) {
          if (msg.startsWith('data: ')) {
            const dataStr = msg.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setStreamedContent(prev => prev + data.text);
              }
            } catch (err) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(streamedContent, 180);
    doc.text(splitText, 15, 20);
    
    doc.save(`${company.replace(/\s+/g, '_')}_Cover_Letter.pdf`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] relative z-10 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Resume Ref */}
          <div className="w-full md:w-1/3 border-r border-white/5 bg-slate-950 flex flex-col">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-white">Reference Material</h3>
              <p className="text-xs text-slate-400">Using {resume?.name || resume?.originalName}</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {resume?.sections?.map(sec => (
                <div key={sec._id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">{sec.heading}</h4>
                  <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed truncate max-h-32 overflow-hidden">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Generator & Output */}
          <div className="w-full md:w-2/3 flex flex-col bg-slate-900 relative">
            <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Generate Cover Letter
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col">
              {!streamedContent && !isGenerating ? (
                <form onSubmit={handleGenerate} className="max-w-2xl mx-auto w-full space-y-6 pt-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Target Company</label>
                      <input type="text" required value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" placeholder="e.g. Google" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Target Role</label>
                      <input type="text" required value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" placeholder="e.g. Frontend Engineer" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Description (Optional)</label>
                    <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none custom-scrollbar" placeholder="Paste JD here to make it highly tailored..."></textarea>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                      <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                        {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
                      <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                        {LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={!company || !role} className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors mt-4">
                    <Send className="w-5 h-5" /> Generate Now
                  </button>
                </form>
              ) : (
                <div className="flex flex-col h-full relative">
                  {showSettings && (
                    <div className="absolute top-0 inset-x-0 bg-slate-800 border-b border-white/10 p-4 rounded-t-xl z-20 flex gap-4 shadow-xl">
                      <select value={tone} onChange={e => setTone(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1">
                        {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1">
                        {LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                      <button onClick={handleGenerate} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors">Apply & Regenerate</button>
                      <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                  )}

                  <div className="flex-1 bg-slate-950/50 rounded-xl border border-white/5 p-6 mb-6">
                    {isEditing ? (
                      <textarea
                        ref={textareaRef}
                        value={streamedContent}
                        onChange={(e) => setStreamedContent(e.target.value)}
                        className="w-full h-full bg-transparent text-slate-300 text-sm leading-relaxed outline-none resize-none custom-scrollbar font-mono"
                      />
                    ) : (
                      <div className="w-full h-full text-slate-300 text-sm leading-relaxed overflow-y-auto custom-scrollbar font-mono whitespace-pre-wrap typewriter-container">
                        {streamedContent}
                        {isGenerating && <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />}
                      </div>
                    )}
                  </div>

                  {!isGenerating && (
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5">
                        {isEditing ? 'Save Edits' : 'Edit Inline'}
                      </button>
                      <button onClick={handleGenerate} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Regenerate
                      </button>
                      <button onClick={() => setShowSettings(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 flex items-center gap-2">
                        <Settings2 className="w-4 h-4" /> Tweak Settings
                      </button>
                      <div className="flex-1"></div>
                      <button onClick={handleCopy} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 flex items-center gap-2">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={handleDownloadPDF} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
