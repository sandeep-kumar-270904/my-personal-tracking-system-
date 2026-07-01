import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function LiveNotesWidget() {
  const { id } = useParams();
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [time, setTime] = useState(0);
  const [syncStatus, setSyncStatus] = useState('saved'); // 'saved', 'syncing', 'error'
  
  const textRef = useRef(text);
  const tagsRef = useRef(tags);

  useEffect(() => {
    textRef.current = text;
    tagsRef.current = tags;
  }, [text, tags]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-sync
  useEffect(() => {
    const sync = setInterval(async () => {
      try {
        setSyncStatus('syncing');
        await axios.post(`/api/interviews/${id}/live-notes`, {
          liveNotes: tagsRef.current.map(tag => ({
            timestamp: new Date(Date.now() - (time - tag.time) * 1000), // approximate absolute time
            text: textRef.current.substring(Math.max(0, textRef.current.length - 100)), // rough context
            tag: tag.color
          }))
        });
        setSyncStatus('saved');
      } catch (e) {
        setSyncStatus('error');
      }
    }, 15000); // sync every 15s
    return () => clearInterval(sync);
  }, [id, time]);

  const addTag = (color) => {
    setTags([...tags, { color, time }]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4 md:p-6 font-mono">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xl font-bold tracking-widest">{formatTime(time)}</span>
        </div>
        <div className="text-xs text-gray-500">
          {syncStatus === 'saved' && <span className="text-emerald-500">Cloud Synced</span>}
          {syncStatus === 'syncing' && <span className="text-amber-500">Syncing...</span>}
          {syncStatus === 'error' && <span className="text-rose-500">Offline (Local)</span>}
        </div>
      </div>

      <textarea 
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type raw notes here..."
        className="flex-1 w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 text-lg focus:outline-none focus:border-indigo-500 resize-none"
      ></textarea>

      <div className="mt-6 grid grid-cols-4 gap-4 h-24">
        <button onClick={() => addTag('GREEN')} className="bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 rounded-2xl active:bg-emerald-500 active:text-white transition-colors flex items-center justify-center font-bold text-sm">
          GOING WELL
        </button>
        <button onClick={() => addTag('RED')} className="bg-rose-500/20 border-2 border-rose-500 text-rose-500 rounded-2xl active:bg-rose-500 active:text-white transition-colors flex items-center justify-center font-bold text-sm">
          STRUGGLING
        </button>
        <button onClick={() => addTag('YELLOW')} className="bg-amber-500/20 border-2 border-amber-500 text-amber-500 rounded-2xl active:bg-amber-500 active:text-white transition-colors flex items-center justify-center font-bold text-sm">
          UNSURE
        </button>
        <button onClick={() => addTag('BLUE')} className="bg-blue-500/20 border-2 border-blue-500 text-blue-500 rounded-2xl active:bg-blue-500 active:text-white transition-colors flex items-center justify-center font-bold text-sm">
          GOOD Q
        </button>
      </div>
      
      {/* Visual Timeline Bar */}
      <div className="mt-4 h-2 bg-gray-900 rounded-full overflow-hidden flex w-full">
        {tags.map((t, i) => {
          let colorClass = 'bg-gray-800';
          if (t.color === 'GREEN') colorClass = 'bg-emerald-500';
          if (t.color === 'RED') colorClass = 'bg-rose-500';
          if (t.color === 'YELLOW') colorClass = 'bg-amber-500';
          if (t.color === 'BLUE') colorClass = 'bg-blue-500';
          
          return (
            <div key={i} className={`h-full ${colorClass}`} style={{ flex: 1, marginRight: '1px' }}></div>
          );
        })}
      </div>
    </div>
  );
}
