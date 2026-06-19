import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Document, Page, pdfjs } from 'react-pdf';
import toast from 'react-hot-toast';
import api from '../../services/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function UploadModal({ isOpen, onClose, existingResumes, onSuccess }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    tags: '',
    notes: '',
    isNewVersion: false,
    parentResumeId: '',
    changeNote: ''
  });

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File is larger than 5MB");
        return;
      }
      setFile(selectedFile);
      setFormData(prev => ({ ...prev, name: selectedFile.name.replace('.pdf', '') }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a PDF file");
    if (formData.isNewVersion && !formData.parentResumeId) return toast.error("Please select the parent resume");

    setIsUploading(true);
    setUploadProgress(10);

    const data = new FormData();
    data.append('resume', file);
    data.append('name', formData.name);
    data.append('notes', formData.notes);
    
    // Process tags (comma separated)
    const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length) data.append('tags', JSON.stringify(tagArray));

    if (formData.isNewVersion) {
      data.append('changeNote', formData.changeNote);
    }

    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };

      const endpoint = formData.isNewVersion 
        ? `/resumes/${formData.parentResumeId}/upload-version` 
        : '/resumes';

      await api.post(endpoint, data, config);
      
      toast.success(`Resume ${formData.isNewVersion ? 'version' : ''} uploaded successfully!`);
      onSuccess();
      resetState();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setFile(null);
    setFormData({ name: '', tags: '', notes: '', isNewVersion: false, parentResumeId: '', changeNote: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={!isUploading ? resetState : undefined}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 flex flex-col md:flex-row"
        >
          {/* Left Column: Form */}
          <div className="flex-1 p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-2xl font-semibold text-white">Upload Resume</h2>
              <button onClick={!isUploading ? resetState : undefined} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!file ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <UploadCloud className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">Drag your resume here or click to browse</p>
                <p className="text-sm text-slate-500">Only PDF files, up to 5MB</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-emerald-400 w-8 h-8" />
                    <div>
                      <p className="text-sm font-medium text-emerald-100">{file.name}</p>
                      <p className="text-xs text-emerald-500/70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors tooltip" data-tip="Remove file">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Resume Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g., Frontend Developer v2" disabled={isUploading} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags (comma separated)</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g., Frontend, Tech, Internship" disabled={isUploading} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none h-20" placeholder="What role is this tailored for?" disabled={isUploading}></textarea>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  <input type="checkbox" id="newVersion" checked={formData.isNewVersion} onChange={e => setFormData({...formData, isNewVersion: e.target.checked})} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20" disabled={isUploading || existingResumes.length === 0} />
                  <label htmlFor="newVersion" className="text-sm font-medium text-slate-300 select-none">This is a new version of an existing resume</label>
                </div>

                {formData.isNewVersion && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Parent Resume</label>
                      <select value={formData.parentResumeId} onChange={e => setFormData({...formData, parentResumeId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500" disabled={isUploading}>
                        <option value="">Select a resume...</option>
                        {existingResumes.filter(r => r.isActive !== false).map(r => (
                          <option key={r._id} value={r._id}>{r.name || r.originalName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">What changed in this version?</label>
                      <input type="text" value={formData.changeNote} onChange={e => setFormData({...formData, changeNote: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g., Added recent React project" disabled={isUploading} />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <button onClick={resetState} className="px-5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors" disabled={isUploading}>Cancel</button>
              <button onClick={handleUpload} disabled={!file || isUploading} className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading {uploadProgress}%
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
            
            {isUploading && (
               <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                 <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
               </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="w-full md:w-1/3 bg-slate-950 border-l border-white/5 p-6 flex-col hidden md:flex">
             <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Preview</h3>
             {file ? (
               <div className="flex-1 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-white/10 relative">
                 <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                  <Document 
                    file={file} 
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    className="flex flex-col items-center"
                    loading={<div className="p-8 text-slate-500">Loading PDF...</div>}
                  >
                    <Page 
                      pageNumber={1} 
                      width={280}
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      className="shadow-md"
                    />
                  </Document>
                 </div>
               </div>
             ) : (
               <div className="flex-1 rounded-xl border border-dashed border-slate-800 flex items-center justify-center">
                 <p className="text-xs text-slate-600 text-center px-6">Select a file to preview the first page</p>
               </div>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
