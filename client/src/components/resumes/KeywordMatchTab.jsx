import { useState } from 'react';
import { Target, Search, ArrowRight, Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function KeywordMatchTab({ resume, sections, onSectionUpdate }) {
  const [jd, setJd] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const [fixingKeyword, setFixingKeyword] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixStream, setFixStream] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');
  const [currentRewriteId, setCurrentRewriteId] = useState(null);

  const handleAnalyze = async () => {
    if (!jd) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await api.post(`/resumes/${resume._id}/keyword-match`, { jobDescription: jd });
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis failed', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFixKeyword = async (keyword, sectionId) => {
    setFixingKeyword(keyword);
    setActiveSectionId(sectionId);
    setIsFixing(true);
    setFixStream('');
    setCurrentRewriteId(null);

    try {
      const response = await fetch(`http://localhost:5000/api/resumes/${resume._id}/sections/${sectionId}/keywords/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ keyword })
      });

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
                setFixStream(prev => prev + data.text);
              }
              if (data.rewriteId) {
                setCurrentRewriteId(data.rewriteId);
              }
            } catch (err) {}
          }
        }
      }
    } catch (error) {
      console.error('Fix failed', error);
    } finally {
      setIsFixing(false);
    }
  };

  const acceptFix = async () => {
    if (!currentRewriteId) return;
    try {
      const { data } = await api.post(`/resumes/${resume._id}/sections/${activeSectionId}/rewrite/accept`, {
        rewriteId: currentRewriteId
      });
      onSectionUpdate?.(data.section);
      
      // Update local missing keywords to cross it off
      if (analysis) {
        setAnalysis({
          ...analysis,
          missingKeywords: analysis.missingKeywords.filter(k => k.keyword !== fixingKeyword)
        });
      }
      
      setFixingKeyword(null);
      setFixStream('');
      setActiveSectionId('');
      setCurrentRewriteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const discardFix = () => {
    setFixingKeyword(null);
    setFixStream('');
    setActiveSectionId('');
    setCurrentRewriteId(null);
  };

  return (
    <div className="space-y-6">
      {!analysis && !isAnalyzing ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Target className="w-5 h-5"/></div>
            <div>
              <h4 className="font-semibold text-white">Keyword Match Analysis</h4>
              <p className="text-xs text-slate-400">Paste a Job Description to find missing keywords.</p>
            </div>
          </div>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={6}
            placeholder="Paste Job Description here..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none custom-scrollbar mb-4"
          />
          <button 
            onClick={handleAnalyze} 
            disabled={!jd}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" /> Analyze Keywords
          </button>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-indigo-400 font-medium">Scanning for missing keywords...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
            <div>
              <h4 className="text-white font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/> Missing Keywords Found</h4>
              <p className="text-xs text-slate-400">We found {analysis.missingKeywords?.length || 0} important keywords missing from your resume.</p>
            </div>
            <button onClick={() => setAnalysis(null)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors text-white">New Scan</button>
          </div>

          <div className="grid gap-4">
            {analysis.missingKeywords?.map((kw, i) => (
              <div key={i} className="bg-slate-950 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-amber-400">{kw.keyword}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${kw.importance === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                      {kw.importance} priority
                    </span>
                  </div>
                  
                  {fixingKeyword !== kw.keyword && (
                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => handleFixKeyword(kw.keyword, e.target.value)}
                        value=""
                        className="text-xs bg-slate-900 border border-white/10 text-slate-300 rounded px-2 py-1 outline-none"
                      >
                        <option value="" disabled>Auto-fix in section...</option>
                        {sections.map(s => <option key={s._id} value={s._id}>{s.heading}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {fixingKeyword === kw.keyword && (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 mt-2">
                    <div className="text-sm text-slate-300 font-mono whitespace-pre-wrap typewriter-container">
                      {fixStream}
                      {isFixing && <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />}
                    </div>

                    {!isFixing && fixStream && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-indigo-500/20">
                        <button onClick={acceptFix} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold py-1.5 rounded flex justify-center items-center gap-2 transition-colors text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Accept Fix
                        </button>
                        <button onClick={discardFix} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded transition-colors text-sm">
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {analysis.missingKeywords?.length === 0 && (
              <div className="text-center py-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-emerald-400 font-medium">Great job! No major keywords missing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
