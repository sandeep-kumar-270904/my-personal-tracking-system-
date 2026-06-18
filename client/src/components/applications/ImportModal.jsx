import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ImportModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/applications/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries(['applications']);
      queryClient.invalidateQueries(['applicationsStats']);
      toast.success(`Imported ${data.insertedCount} applications`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Please upload a valid CSV file');
    }
  };

  const handleImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
  };

  const resetAndClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={resetAndClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-[#13141f] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Import Applications</h2>
            <button onClick={resetAndClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {!result ? (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-[#ff6b00]/50 bg-[#ff6b00]/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-[#ff6b00]" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-slate-400" />
                    <p className="text-white font-medium">Click to upload CSV</p>
                    <p className="text-xs text-slate-400">Must include 'company' and 'role' columns</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={resetAndClose} 
                  className="flex-1 px-4 py-2 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!file || importMutation.isLoading}
                  className="flex-1 px-4 py-2 rounded-xl font-semibold text-white bg-[#ff6b00] hover:bg-[#ff6b00]/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {importMutation.isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Import'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Import Complete</h3>
                <p className="text-slate-400">Successfully inserted {result.insertedCount} applications.</p>
              </div>
              
              {result.errors?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left max-h-40 overflow-y-auto">
                  <p className="text-red-400 font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> {result.errors.length} Errors occurred:
                  </p>
                  <ul className="text-xs text-red-400/80 space-y-1 list-disc pl-4">
                    {result.errors.map((err, i) => (
                      <li key={i}>Row {err.row}: {err.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                onClick={resetAndClose} 
                className="w-full px-4 py-2 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImportModal;
