import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Download, GripVertical, FileText, Layout, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ResumeBuilderModal({ isOpen, onClose, existingResume }) {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const resumeRef = useRef(null);

  useEffect(() => {
    if (isOpen && existingResume) {
       // Fetch sections
       api.get(`/resumes/${existingResume._id}/sections`).then(res => {
          setSections(res.data.map(s => ({...s, id: s._id || Math.random().toString() })));
       });
    } else if (isOpen) {
       setSections([
         { id: '1', heading: 'Education', content: 'University of Engineering\nB.Tech in Computer Science\n2020 - 2024' },
         { id: '2', heading: 'Experience', content: 'Software Developer Intern\nTech Corp\nSummer 2023' }
       ]);
    }
  }, [isOpen, existingResume]);

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;
    const toastId = toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${existingResume?.name || 'Resume_Built'}.pdf`);
      toast.success('PDF Exported Successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to export PDF', { id: toastId });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Create new resume version with these sections
      const data = {
        name: `${existingResume?.name || 'Built Resume'} (Builder Version)`,
        originalName: existingResume?.originalName || 'BuiltResume.pdf',
        fileUrl: existingResume?.fileUrl || '',
        parentResumeId: existingResume?.parentResumeId || existingResume?._id || null,
        sections: sections.map((s, i) => ({ ...s, order: i }))
      };
      return await api.post('/resumes/builder/save', data); // Wait, this endpoint doesn't exist yet! We can just call duplicate maybe? Or a new generic save endpoint. Let's create `/api/resumes/builder/save`.
    },
    onSuccess: () => {
      toast.success("Resume saved successfully!");
      queryClient.invalidateQueries(['resumes']);
      onClose();
    }
  });

  const onDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newSections = [...sections];
    const draggedItem = newSections[draggedIdx];
    newSections.splice(draggedIdx, 1);
    newSections.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setSections(newSections);
  };

  const onDragEnd = () => setDraggedIdx(null);

  const updateSection = (idx, field, value) => {
    const newSections = [...sections];
    newSections[idx][field] = value;
    setSections(newSections);
  };

  const addSection = () => {
    setSections([...sections, { id: Math.random().toString(), heading: 'New Section', content: 'Details here...' }]);
  };

  const deleteSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 p-4 bg-slate-900">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-400"/> Smart Resume Builder
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <Download className="w-4 h-4"/> Export PDF
              </button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Save className="w-4 h-4"/> Save as Version
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Editor Sidebar */}
            <div className="w-1/3 bg-slate-950 border-r border-white/5 flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900">
                <h3 className="font-semibold text-white text-sm">Sections</h3>
                <button onClick={addSection} className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors">
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {sections.map((section, idx) => (
                  <div 
                    key={section.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden group"
                  >
                    <div className="flex items-center gap-2 bg-slate-800/50 p-2 cursor-grab active:cursor-grabbing border-b border-white/5">
                      <GripVertical className="w-4 h-4 text-slate-500" />
                      <input 
                        value={section.heading} 
                        onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                        className="bg-transparent border-none text-sm font-medium text-white focus:outline-none flex-1"
                      />
                      <button onClick={() => deleteSection(idx)} className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                    <div className="p-2">
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(idx, 'content', e.target.value)}
                        rows={4}
                        className="w-full bg-transparent border-none text-sm text-slate-300 focus:outline-none resize-y min-h-[80px]"
                        placeholder="Section content..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="w-2/3 bg-slate-900 overflow-y-auto p-8 flex justify-center">
              <div className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl p-10 print-exact" ref={resumeRef}>
                {/* Header (Simplified for demo) */}
                <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
                   <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">John Doe</h1>
                   <p className="text-sm text-slate-600 flex justify-center gap-4">
                     <span>john.doe@email.com</span>
                     <span>|</span>
                     <span>+1 234 567 8900</span>
                     <span>|</span>
                     <span>linkedin.com/in/johndoe</span>
                   </p>
                </div>

                {/* Sections */}
                <div className="space-y-5">
                  {sections.map(section => (
                    <div key={section.id}>
                      <h2 className="text-lg font-bold uppercase tracking-wider border-b border-slate-300 mb-2 pb-1 text-slate-800">
                        {section.heading}
                      </h2>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
