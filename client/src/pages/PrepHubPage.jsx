import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Briefcase, FileText, Target } from 'lucide-react';
import api from '../services/api';
import PrepSyllabusDrawer from '../components/prephub/PrepSyllabusDrawer';
import StudyPlannerTab from '../components/prephub/StudyPlannerTab';
import CompanyPrepPackWidget from '../components/prephub/CompanyPrepPackWidget';
import EmptyState from '../components/EmptyState';
import FollowingFeed from '../components/prephub/FollowingFeed';

const fetchSyllabuses = async () => {
  const { data } = await api.get('/prephub/syllabus');
  return data;
};

const PrepHubPage = () => {
  const [activeTab, setActiveTab] = useState('Syllabus'); // 'Syllabus' | 'StudyPlanner'
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
      <header className="mb-6 border-b border-white/5 pb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Prep Hub</h1>
            <p className="text-slate-400">Customized interview preparation and smart study schedules.</p>
          </div>
          
          <div className="bg-[#13141f] border border-[#ff6b00]/20 rounded-xl p-4 flex items-center gap-4 min-w-[250px]">
            <div className="w-12 h-12 rounded-full bg-[#ff6b00]/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-[#ff6b00]" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">PrepHub Readiness Score</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-white">78</span>
                <span className="text-sm text-emerald-400 font-medium mb-1">+5 pts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {['Syllabus', 'Study Planner', 'Following Feed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${activeTab === tab ? 'bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              {tab === 'Syllabus' ? 'Interview Syllabus' : tab === 'Study Planner' ? 'Smart Study Planner' : 'Following Feed'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'Syllabus' ? (
        <>
          <CompanyPrepPackWidget />

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
        </>
      ) : activeTab === 'Study Planner' ? (
        <StudyPlannerTab />
      ) : (
        <FollowingFeed />
      )}

      <PrepSyllabusDrawer 
        isOpen={!!selectedSyllabus} 
        onClose={() => setSelectedSyllabus(null)} 
        syllabus={selectedSyllabus} 
      />
    </div>
  );
};

export default PrepHubPage;
