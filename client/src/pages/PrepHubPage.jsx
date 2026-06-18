import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Briefcase, FileText } from 'lucide-react';
import api from '../services/api';
import PrepSyllabusDrawer from '../components/prephub/PrepSyllabusDrawer';
import EmptyState from '../components/EmptyState';

const fetchSyllabuses = async () => {
  const { data } = await api.get('/prephub/syllabus');
  return data;
};

const PrepHubPage = () => {
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);

  const { data: syllabuses = [], isLoading } = useQuery({
    queryKey: ['prepSyllabuses'],
    queryFn: fetchSyllabuses
  });

  if (isLoading) {
    return (
      <div className="p-8 w-full max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Prep Hub</h1>
          <p className="text-slate-400">Customized interview preparation based on your applications and weak areas.</p>
        </div>
      </header>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#ff6b00]" />
          Upcoming Interview Prep
        </h2>
        
        {syllabuses.length === 0 ? (
          <EmptyState 
            icon={FileText} 
            heading="No prep syllabuses yet" 
            subtext="When you move an application to INTERVIEW_SCHEDULED, a customized syllabus will be generated here." 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabuses.map((syllabus) => (
              <motion.div
                key={syllabus._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedSyllabus(syllabus)}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-[#ff6b00]/50 transition-all duration-300 cursor-pointer relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b00]/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <h3 className="text-xl font-bold text-white mb-1 relative z-10">{syllabus.company}</h3>
                <p className="text-sm text-[#00f0ff] font-medium mb-4 flex items-center gap-2 relative z-10">
                  <Briefcase className="w-4 h-4" /> {syllabus.role}
                </p>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Target Weakness:</span>
                    <span className="text-white font-medium">{syllabus.dsaTopics?.[0]?.topic || 'General'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${syllabus.isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {syllabus.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                  <span className="text-sm font-semibold text-[#ff6b00] group-hover:underline">View Syllabus →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PrepSyllabusDrawer 
        isOpen={!!selectedSyllabus} 
        onClose={() => setSelectedSyllabus(null)} 
        syllabus={selectedSyllabus} 
      />
    </div>
  );
};

export default PrepHubPage;
