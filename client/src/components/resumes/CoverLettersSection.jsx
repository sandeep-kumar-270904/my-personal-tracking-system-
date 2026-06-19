import { useQuery } from '@tanstack/react-query';
import { FileText, Copy, Download, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function CoverLettersSection() {
  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['coverLetters'],
    queryFn: async () => {
      const { data } = await api.get('/resumes/cover-letters');
      return data;
    }
  });

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = (letter) => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(letter.content, 180);
    doc.text(splitText, 15, 20);
    
    doc.save(`${letter.targetCompany.replace(/\s+/g, '_')}_Cover_Letter.pdf`);
  };

  if (isLoading) {
    return <div className="text-slate-500 animate-pulse">Loading cover letters...</div>;
  }

  if (letters.length === 0) return null;

  return (
    <div className="mt-12 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Cover Letters</h2>
        <p className="text-slate-400 text-sm">Recently generated cover letters for your applications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {letters.map(letter => (
          <div key={letter._id} className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden group flex flex-col h-[300px] relative">
            <div className="p-4 border-b border-white/5 bg-slate-900">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-white truncate pr-4">{letter.targetCompany}</h3>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 whitespace-nowrap">
                  {letter.tone}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{letter.targetRole}</p>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden relative">
              <p className="text-xs text-slate-300 font-mono leading-relaxed opacity-70 whitespace-pre-wrap line-clamp-[8]">
                {letter.content}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
            </div>

            <div className="p-4 border-t border-white/5 flex gap-2 justify-between items-center bg-slate-900/50">
               <span className="text-xs text-slate-500">{new Date(letter.createdAt).toLocaleDateString()}</span>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleCopy(letter.content)} className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors tooltip" data-tip="Copy">
                   <Copy className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDownload(letter)} className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors tooltip" data-tip="Download PDF">
                   <Download className="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
