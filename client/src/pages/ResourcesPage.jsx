import { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { BookOpen, Code, Database, Monitor, Server, Briefcase, ExternalLink, Search, Bookmark, Plus, X, ThumbsUp, CheckCircle2, LayoutGrid, ArrowDown, Star, Settings, Flame, Trophy, Medal, Users, Clock, AlertTriangle, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import AIRecommender from '../components/resources/AIRecommender';
import ResourceReviews from '../components/resources/ResourceReviews';
import RoadmapView from '../components/resources/RoadmapView';
import DailySpotlight from '../components/resources/DailySpotlight';
import SubmitResourceModal from '../components/resources/SubmitResourceModal';
import AdminPanel from '../components/resources/AdminPanel';
import LeaderboardModal from '../components/resources/LeaderboardModal';
import StudyGroupModal from '../components/resources/StudyGroupModal';
import ResourceComments from '../components/resources/ResourceComments';
import CollectionsGrid from '../components/resources/collections/CollectionsGrid';
import ResourceChatWidget from '../components/resources/ResourceChatWidget';
import DSAStrugglingBanner from '../components/prephub/DSAStrugglingBanner';
import InterviewGapAlert from '../components/prephub/InterviewGapAlert';
import { useNavigate } from 'react-router-dom';
const categories = ['All', 'Collections', 'Saved', 'My Submissions', 'Web Dev', 'App Dev', 'System Design', 'AI/ML', 'CS Core', 'DSA', 'Aptitude', 'Official Docs', 'Interview Prep'];
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const sortOptions = ['Default', 'Most Upvoted', 'Newest First', 'Beginner First'];

const getIconComponent = (iconName) => {
  switch(iconName) {
    case 'Code': return Code;
    case 'Monitor': return Monitor;
    case 'Server': return Server;
    case 'Database': return Database;
    case 'Briefcase': return Briefcase;
    default: return BookOpen;
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-[#22c55e] text-white';
    case 'Intermediate': return 'bg-[#eab308] text-gray-900';
    case 'Advanced': return 'bg-[#ef4444] text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const HighlightedText = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i} className="underline">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const ResourcesPage = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All Levels');
  const [activeLanguage, setActiveLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortOption, setSortOption] = useState('Default');
  const [viewMode, setViewMode] = useState('grid');
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isStudyGroupModalOpen, setIsStudyGroupModalOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);
  
  const searchContainerRef = useRef(null);

  // Auto-switch to Web Dev when Roadmap is selected on All
  useEffect(() => {
    if (viewMode === 'roadmap' && (activeCategory === 'All' || activeCategory === 'Saved' || activeCategory === 'My Submissions')) {
      setActiveCategory('Web Dev');
    }
  }, [viewMode, activeCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await api.get('/resources');
      return res.data;
    }
  });

  const { data: mySubmissions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const res = await api.get('/resources/submissions');
      return res.data;
    },
    enabled: activeCategory === 'My Submissions'
  });

  const { data: streakData } = useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: async () => {
      const res = await api.get('/gamification/streak');
      return res.data;
    }
  });

  const { data: badgesData = [] } = useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: async () => {
      const res = await api.get('/gamification/badges');
      return res.data;
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: async (id) => await api.post(`/resources/${id}/upvote`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['resources'] })
  });

  const completeMutation = useMutation({
    mutationFn: async (id) => await api.post(`/resources/${id}/complete`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
      
      if (data.data?.hasCompleted && data.data?.streak) {
        toast.success(`🔥 ${data.data.streak.currentStreak} day streak! Keep going!`, {
          icon: '🔥',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      }
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (id) => await api.post(`/resources/${id}/report-broken`),
    onSuccess: () => {
      toast.success('Thanks for reporting! We will verify this link.', { icon: '🔍' });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (id) => await api.post(`/resources/${id}/bookmark`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['resources'] })
  });

  const progressStats = useMemo(() => {
    let catResources = resources;
    if (activeCategory !== 'All' && activeCategory !== 'Saved' && activeCategory !== 'My Submissions') {
      catResources = resources.filter(r => r.category === activeCategory);
    } else if (activeCategory === 'Saved') {
      catResources = resources.filter(r => r.hasBookmarked);
    }
    const total = catResources.length;
    const completed = catResources.filter(r => r.hasCompleted).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [resources, activeCategory]);

  const filteredResources = useMemo(() => {
    let result = resources.filter(res => {
      const isSaved = res.hasBookmarked;
      if (activeCategory === 'Saved' && !isSaved) return false;
      if (activeCategory === 'My Submissions') return false; // Handled separately
      if (activeCategory === 'Collections') return false; // Handled separately
      
      const matchesCategory = activeCategory === 'All' || activeCategory === 'Saved' || res.category === activeCategory;
      const matchesDifficulty = activeDifficulty === 'All Levels' || res.difficulty === activeDifficulty;
      const matchesLanguage = activeLanguage === 'All' || (res.language || 'English') === activeLanguage;

      let matchesSearch = true;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        matchesSearch = 
          res.title.toLowerCase().includes(searchLower) || 
          res.description.toLowerCase().includes(searchLower) ||
          res.category.toLowerCase().includes(searchLower) ||
          (res.language && res.language.toLowerCase().includes(searchLower));
      }

      return matchesCategory && matchesDifficulty && matchesLanguage && matchesSearch;
    });

    if (sortOption === 'Most Upvoted') {
      result.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else if (sortOption === 'Newest First') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'Beginner First') {
      const diffOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      result.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
    }

    return result;
  }, [resources, activeCategory, activeDifficulty, activeLanguage, searchQuery, sortOption]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return filteredResources.slice(0, 5);
  }, [searchQuery, filteredResources]);

  const scrollToCard = (id) => {
    const el = document.getElementById(`resource-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsSearchFocused(false);
    }
  };

  const renderSubmissions = () => {
    if (subsLoading) return <div className="text-slate-500 animate-pulse">Loading your submissions...</div>;
    if (mySubmissions.length === 0) return (
      <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
        <h3 className="text-xl font-medium text-slate-300 mb-2">No submissions yet</h3>
        <p className="text-slate-500">Submit a resource to help other students!</p>
      </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mySubmissions.map(sub => (
          <div key={sub._id} className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {sub.status === 'approved' ? 'Approved ✓' : sub.status === 'rejected' ? 'Rejected' : 'Pending Review'}
              </span>
              <span className="text-[10px] text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{sub.name}</h3>
            <p className="text-sm text-slate-400 mb-4 line-clamp-3">{sub.description}</p>
            {sub.status === 'rejected' && sub.adminNote && (
              <div className="mt-auto bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                <p className="text-xs text-red-400 font-bold mb-1">Reason:</p>
                <p className="text-xs text-red-200/80">{sub.adminNote}</p>
              </div>
            )}
            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="mt-auto text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
              View Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <DailySpotlight />
      
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-blue-500 w-8 h-8" />
            PrepHub & Resources
          </h1>
          <p className="text-slate-400 mb-4">Curated materials, roadmaps, and tools to ace your tech interviews.</p>
          
          <div className="w-full max-w-2xl mt-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
              <span>Your Progress — {progressStats.completed} of {progressStats.total} resources completed</span>
              <span className="text-emerald-400">{progressStats.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-[#1a1b26] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#1a1b26] rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('roadmap')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'roadmap' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Roadmap View"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setIsStudyGroupModalOpen(true)} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl transition-all flex items-center gap-2">
            <Users className="w-5 h-5" /> Study Groups
          </button>
          <button onClick={() => setIsSubmitModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Submit Resource
          </button>
          {user?.role === 'placement_cell_admin' && (
            <button onClick={() => setIsAdminPanelOpen(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg">
              <Settings className="w-5 h-5 text-emerald-400" /> Manage Resources
            </button>
          )}
        </div>
      </header>

      {/* Gamification Dashboard Block */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 shrink-0">
        <div className="flex-1 bg-[#13141f] border border-white/10 p-6 rounded-2xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
            <Flame className={`w-8 h-8 ${streakData?.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{streakData?.currentStreak || 0}</span>
              <span className="text-sm text-slate-500 font-medium">days</span>
            </div>
          </div>
          <div className="hidden sm:block border-l border-white/10 pl-6">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Longest Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{streakData?.longestStreak || 0}</span>
              <span className="text-sm text-slate-500 font-medium">days</span>
            </div>
          </div>
        </div>

        <div className="flex-[1.5] bg-[#13141f] border border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Badges</p>
            <div className="flex items-center gap-3">
              {badgesData?.filter(b => b.earned).slice(0, 3).map(badge => (
                <div key={badge._id} className="relative group cursor-pointer" title={`${badge.name} - ${badge.description}`}>
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Medal className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
              ))}
              {(!badgesData || badgesData.filter(b => b.earned).length === 0) && (
                <p className="text-sm text-slate-500 italic">No badges earned yet. Keep learning!</p>
              )}
              {badgesData?.filter(b => b.earned).length > 3 && (
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-xs font-bold text-slate-400">
                  +{badgesData.filter(b => b.earned).length - 3}
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setIsLeaderboardOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 border border-indigo-400/50 hover:border-indigo-400"
          >
            <Trophy className="w-5 h-5" /> View Leaderboard
          </button>
        </div>
      </div>

      {/* AI Recommender Section */}
      <AIRecommender onPreview={setPreviewResource} />

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
        <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-transparent' 
                  : 'bg-[#13141f] text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat === 'Collections' && <BookOpen className="w-4 h-4 inline-block mr-1.5 text-indigo-400" />}
              {cat === 'Saved' && <Bookmark className="w-4 h-4 inline-block mr-1.5" />}
              {cat === 'My Submissions' && <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 text-blue-400" />}
              {cat}
            </button>
          ))}
        </div>

        {viewMode === 'grid' && activeCategory !== 'My Submissions' && activeCategory !== 'Collections' && (
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto relative" ref={searchContainerRef}>
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#13141f] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 appearance-none min-w-[160px]"
            >
              {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select 
              value={activeLanguage}
              onChange={(e) => setActiveLanguage(e.target.value)}
              className="bg-[#13141f] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 appearance-none min-w-[140px]"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Hinglish">Hinglish</option>
            </select>

            <div className="relative w-full md:w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence>
                {isSearchFocused && searchQuery.length >= 2 && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {searchResults.map(res => {
                      const Icon = getIconComponent(res.icon);
                      return (
                        <div 
                          key={res.id} 
                          onClick={() => scrollToCard(res.id)}
                          className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-sm text-white font-medium truncate">
                              <HighlightedText text={res.title} highlight={searchQuery} />
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              <HighlightedText text={res.description} highlight={searchQuery} />
                            </p>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                            {res.category}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Sub Filters - Difficulty */}
      {viewMode === 'grid' && activeCategory !== 'My Submissions' && activeCategory !== 'Collections' && (
        <div className="flex gap-2 mb-6 shrink-0 overflow-x-auto custom-scrollbar pb-1">
          {difficulties.map(diff => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeDifficulty === diff 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                  : 'bg-transparent text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      )}

      {/* View Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeCategory === 'Collections' ? <CollectionsGrid /> : activeCategory === 'My Submissions' ? renderSubmissions() : viewMode === 'roadmap' ? (
          <RoadmapView resources={resources} category={activeCategory} onPreview={setPreviewResource} />
        ) : (
          <>
            <DSAStrugglingBanner activeCategory={activeCategory} />
            <InterviewGapAlert activeCategory={activeCategory} />
            {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">No resources found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredResources.map((res) => {
                  const Icon = getIconComponent(res.icon);
                  const isSaved = res.hasBookmarked;
                  const isCompleted = res.hasCompleted;
                  const isUpvoted = res.hasUpvoted;

                  return (
                    <motion.div
                      key={res.id}
                      id={`resource-card-${res.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`glass-card p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full relative cursor-pointer group ${
                        isCompleted 
                          ? 'border-emerald-500 shadow-[0_0_0_1.5px_rgba(34,197,94,1)]' 
                          : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                      onClick={() => setPreviewResource(res)}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2 z-20" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => upvoteMutation.mutate(res.id)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-xs font-bold ${
                            isUpvoted ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 bg-white/5'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" fill={isUpvoted ? "currentColor" : "none"} />
                          {res.upvoteCount}
                        </button>

                        <button 
                          onClick={() => bookmarkMutation.mutate(res.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white bg-white/5'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-3 relative z-10 pr-20">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10`}>
                          <Icon className={`w-6 h-6 text-blue-400`} />
                        </div>
                      </div>
                      {res.isAlive === false && (
                        <div className="mb-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-red-400 text-xs font-medium">Link might be dead. We're verifying.</span>
                        </div>
                      )}

                      {res.isStale === true && (
                        <div className="mb-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-amber-400 text-xs font-medium">Content is over a year old (Year: {res.contentYear || 'Unknown'}).</span>
                        </div>
                      )}

                      <div className="mb-4 flex flex-wrap gap-2 items-center">
                        <span className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                          {res.category}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(res.difficulty)}`}>
                          {res.difficulty}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          ~{res.estimatedHours || 0}h
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Star className={`w-3 h-3 ${res.averageRating > 0 ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                          {res.averageRating > 0 ? res.averageRating : 'New'} 
                          {res.reviewCount > 0 && ` (${res.reviewCount})`}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                        <HighlightedText text={res.title} highlight={searchQuery} />
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow relative z-10 line-clamp-3">
                        <HighlightedText text={res.description} highlight={searchQuery} />
                      </p>

                      <div className="mt-auto grid grid-cols-2 gap-2 relative z-10" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => completeMutation.mutate(res.id)}
                          className={`flex items-center justify-center py-2 text-xs font-bold rounded-xl transition-colors border ${
                            isCompleted 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : 'bg-transparent text-slate-400 border-white/10 hover:border-emerald-500/50 hover:text-emerald-400'
                          }`}
                        >
                          {isCompleted ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Completed</> : 'Mark Complete'}
                        </button>
                        
                        <button 
                          onClick={() => setPreviewResource(res)}
                          className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all border border-white/10"
                        >
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewResource && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-[#13141f] border border-white/10 p-8 rounded-2xl w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setPreviewResource(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg z-10"><X className="w-5 h-5" /></button>
              
              <div className="flex items-start gap-5 mb-6 pr-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 shrink-0`}>
                  {(() => {
                    const PreviewIcon = getIconComponent(previewResource.icon);
                    return <PreviewIcon className="w-8 h-8 text-blue-400" />;
                  })()}
                </div>
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-wider">
                      {previewResource.category}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getDifficultyColor(previewResource.difficulty)}`}>
                      {previewResource.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      ~{previewResource.estimatedHours || 0}h
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">{previewResource.title}</h2>
                </div>
              </div>

              <div className="bg-[#1a1b26] p-5 rounded-xl border border-white/5 mb-6">
                {previewResource.isAlive === false && (
                  <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <Flame className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-bold text-sm">Dead Link Warning</h4>
                      <p className="text-red-400/80 text-xs mt-0.5">We've detected this link might be broken. Our team is verifying it.</p>
                    </div>
                  </div>
                )}
                <p className="text-slate-300 leading-relaxed text-sm">
                  {previewResource.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium mb-8 bg-white/5 py-3 px-4 rounded-xl">
                <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4 text-indigo-400" /> {previewResource.upvoteCount} upvotes</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {previewResource.completionCount} completions</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-1.5">
                  <Star className={`w-4 h-4 ${previewResource.averageRating > 0 ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} /> 
                  {previewResource.averageRating > 0 ? `${previewResource.averageRating} avg rating (${previewResource.reviewCount} reviews)` : 'No ratings yet'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <button 
                  onClick={() => bookmarkMutation.mutate(previewResource.id)}
                  className={`flex-1 flex items-center justify-center py-3 text-sm font-bold rounded-xl transition-all border ${
                    previewResource.hasBookmarked ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-[#1a1b26] text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Bookmark className="w-4 h-4 mr-2" fill={previewResource.hasBookmarked ? "currentColor" : "none"} />
                  {previewResource.hasBookmarked ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={() => completeMutation.mutate(previewResource.id)}
                  className={`flex-1 flex items-center justify-center py-3 text-sm font-bold rounded-xl transition-all border ${
                    previewResource.hasCompleted ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#1a1b26] text-slate-300 border-white/10 hover:border-emerald-500/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {previewResource.hasCompleted ? 'Done' : 'Done'}
                </button>
                <button
                  onClick={() => {
                    const text = `Check out this resource on PrepHub: ${previewResource.title}`;
                    const url = previewResource.url;
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                    window.open(twitterUrl, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center py-3 bg-[#1a1b26] text-slate-300 border border-white/10 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2] text-sm font-bold rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <a 
                  href={previewResource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-[1.5] flex items-center justify-center py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                >
                  Open <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>

              {previewResource.category === 'DSA' && (
                <div className="flex justify-center mb-6">
                  <button 
                    onClick={() => {
                      setPreviewResource(null);
                      navigate(`/dsa?logProblem=true&title=${encodeURIComponent(previewResource.title)}`);
                    }}
                    className="flex-1 flex items-center justify-center py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all text-sm max-w-sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> Practice on DSA Tracker
                  </button>
                </div>
              )}

              <div className="flex justify-center mb-6">
                <button 
                  onClick={() => reportMutation.mutate(previewResource.id)}
                  disabled={previewResource.reportedBroken || reportMutation.isLoading}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-medium rounded-lg transition-all border border-red-500/10"
                >
                  <Flame className="w-4 h-4" /> 
                  {previewResource.reportedBroken ? 'Broken Link Reported' : 'Report Broken Link'}
                </button>
              </div>

              {/* Chat Widget */}
              <div className="mb-6">
                <ResourceChatWidget resourceId={previewResource.id} />
              </div>

              {/* Reviews Section */}
              <ResourceReviews resourceId={previewResource.id} />

              {/* Discussion Section */}
              <ResourceComments resourceId={previewResource.id} />
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SubmitResourceModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} />
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <StudyGroupModal isOpen={isStudyGroupModalOpen} onClose={() => setIsStudyGroupModalOpen(false)} />
    </div>
  );
};

export default ResourcesPage;
