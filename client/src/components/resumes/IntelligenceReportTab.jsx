import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileDown, Download, Sparkles, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function IntelligenceReportTab({ resumeId }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/resumes/${resumeId}/intelligence-report`, {}, { responseType: 'blob' });
      return response.data;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `intelligence-report-${resumeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Intelligence Report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate intelligence report");
    }
  });

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar justify-center items-center text-center">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 mb-6 shadow-2xl relative">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
            <Sparkles className="w-4 h-4 text-fuchsia-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Resume Intelligence Report</h3>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Generate a comprehensive, executive-ready PDF report synthesizing your JD scores, ATS analysis, peer benchmarks, and real-world application impact.
          </p>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isLoading}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
          >
            {generateMutation.isLoading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Compiling Data...</>
            ) : (
              <><FileDown className="w-5 h-5"/> Download PDF Report</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
