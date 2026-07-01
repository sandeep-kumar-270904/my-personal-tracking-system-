import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, Plus, Calendar, CheckCircle2, ChevronRight, Share2, Target, ShieldAlert } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const StudyGroupModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('My Groups'); // 'My Groups', 'Join', 'Create'
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const { data: myGroups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['my_study_groups'],
    queryFn: async () => {
      const res = await api.get('/study-groups');
      return res.data;
    },
    enabled: isOpen
  });

  const { data: groupDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['study_group', selectedGroup],
    queryFn: async () => {
      const res = await api.get(`/study-groups/${selectedGroup}`);
      return res.data;
    },
    enabled: !!selectedGroup
  });

  const joinMutation = useMutation({
    mutationFn: async (code) => await api.post('/study-groups/join', { inviteCode: code }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my_study_groups'] });
      toast.success('Joined group successfully!');
      setActiveTab('My Groups');
      setSelectedGroup(data.data.groupId);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to join group')
  });

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/study-groups', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my_study_groups'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
      toast.success('Group created!');
      setActiveTab('My Groups');
      setSelectedGroup(data.data._id);
    },
    onError: () => toast.error('Failed to create group')
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId) => await api.post(`/study-groups/${selectedGroup}/challenge/${challengeId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_group', selectedGroup] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
      toast.success('Challenge completed! You are a Team Player!');
    }
  });

  const [challengeData, setChallengeData] = useState({ resourceId: '', requiredCompletions: 1 });
  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    enabled: isOpen
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data) => await api.post(`/study-groups/${selectedGroup}/challenge`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_group', selectedGroup] });
      toast.success('Challenge created!');
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1a1b26]/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Study Groups
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col">
              <div className="p-4 space-y-1 border-b border-white/5">
                <button 
                  onClick={() => { setActiveTab('My Groups'); setSelectedGroup(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'My Groups' && !selectedGroup ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Users className="w-4 h-4" /> My Groups
                </button>
                <button 
                  onClick={() => { setActiveTab('Join'); setSelectedGroup(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'Join' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <UserPlus className="w-4 h-4" /> Join Group
                </button>
                <button 
                  onClick={() => { setActiveTab('Create'); setSelectedGroup(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'Create' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Plus className="w-4 h-4" /> Create Group
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Groups</p>
                {loadingGroups ? (
                  <p className="text-sm text-slate-500 px-3">Loading...</p>
                ) : myGroups.length === 0 ? (
                  <p className="text-xs text-slate-600 px-3">No groups yet.</p>
                ) : (
                  myGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setActiveTab('My Groups'); setSelectedGroup(g.id); }}
                      className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center justify-between group ${selectedGroup === g.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span className="text-sm font-medium truncate">{g.groupName}</span>
                      <ChevronRight className={`w-3 h-3 ${selectedGroup === g.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#13141f] custom-scrollbar relative">
              {activeTab === 'Join' && (
                <div className="max-w-md mx-auto pt-10">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 mx-auto">
                    <UserPlus className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-2">Join a Study Group</h3>
                  <p className="text-slate-400 text-center mb-8 text-sm">Enter the invite code shared by your group leader to join and start participating in weekly challenges.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Invite Code</label>
                      <input 
                        type="text" 
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-center text-xl tracking-widest font-mono" 
                        placeholder="ABCDEF"
                        maxLength={6}
                      />
                    </div>
                    <button 
                      onClick={() => joinMutation.mutate(joinCode)}
                      disabled={joinCode.length < 3 || joinMutation.isPending}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                    >
                      {joinMutation.isPending ? 'Joining...' : 'Join Group'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Create' && (
                <div className="max-w-md mx-auto pt-10">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 mx-auto">
                    <Plus className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-2">Create a Study Group</h3>
                  <p className="text-slate-400 text-center mb-8 text-sm">Create a group to study with friends, track progress, and assign weekly resource challenges.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Group Name</label>
                      <input 
                        type="text" 
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" 
                        placeholder="e.g. Algo Warriors"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-[#1a1b26] p-4 rounded-xl border border-white/10">
                      <input 
                        type="checkbox" 
                        id="isPublic"
                        checked={isPublic}
                        onChange={e => setIsPublic(e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 bg-[#13141f] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                      />
                      <label htmlFor="isPublic" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
                        Make Public (Anyone can join)
                      </label>
                    </div>
                    <button 
                      onClick={() => createMutation.mutate({ groupName: newGroupName, isPublic })}
                      disabled={!newGroupName.trim() || createMutation.isPending}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'My Groups' && !selectedGroup && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto text-center">
                  <Users className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold text-slate-300 mb-2">Select a Group</p>
                  <p className="text-sm">Choose a group from the sidebar to view challenges and member progress.</p>
                </div>
              )}

              {activeTab === 'My Groups' && selectedGroup && (
                loadingDetails ? (
                  <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Loading group...</div>
                ) : !groupDetails ? (
                  <div className="flex items-center justify-center h-full text-slate-500">Group not found</div>
                ) : (
                  <div className="space-y-8 animate-fade-in">
                    {/* Group Header */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className="px-3 py-1 bg-[#13141f]/80 backdrop-blur rounded-lg text-xs font-mono text-indigo-300 border border-indigo-500/30 flex items-center gap-2 shadow-lg">
                          Code: <span className="text-white font-black text-sm tracking-widest">{groupDetails.inviteCode}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(groupDetails.inviteCode);
                              toast.success('Code copied!');
                            }}
                            className="ml-2 hover:text-white"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">{groupDetails.groupName}</h2>
                      <p className="text-sm text-indigo-200/80 flex items-center gap-4">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {groupDetails.members.length} Members</span>
                        <span className="flex items-center gap-1">Leader: {groupDetails.leader?.name}</span>
                      </p>
                    </div>

                    {/* Weekly Challenge */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-400" /> Weekly Challenge
                      </h3>
                      
                      {groupDetails.activeChallenge ? (
                        <div className="bg-[#1a1b26] rounded-xl border border-white/10 p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Active Now</p>
                              <a href={groupDetails.activeChallenge.resource?.url} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-white hover:underline decoration-emerald-500">
                                {groupDetails.activeChallenge.resource?.title}
                              </a>
                            </div>
                            <div className="text-right bg-[#13141f] p-2 rounded-lg border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Ends In</p>
                              <p className="text-sm text-slate-300 font-mono">
                                {Math.ceil((new Date(groupDetails.activeChallenge.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-xs font-bold mb-2">
                              <span className="text-slate-400">Group Progress</span>
                              <span className="text-white">{groupDetails.activeChallenge.currentCompletions} / {groupDetails.activeChallenge.requiredCompletions} Completions</span>
                            </div>
                            <div className="h-2 w-full bg-[#13141f] rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-emerald-500"
                                style={{ width: \`\${Math.min(100, (groupDetails.activeChallenge.currentCompletions / groupDetails.activeChallenge.requiredCompletions) * 100)}%\` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex -space-x-2">
                              {groupDetails.activeChallenge.completions.map((c, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-[#1a1b26] flex items-center justify-center text-xs text-emerald-400 font-bold" title={c.name}>
                                  {c.name.charAt(0)}
                                </div>
                              ))}
                              {groupDetails.activeChallenge.currentCompletions === 0 && (
                                <span className="text-xs text-slate-500 ml-2">No one has completed yet</span>
                              )}
                            </div>

                            {groupDetails.activeChallenge.hasCompleted ? (
                              <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> You Completed This
                              </span>
                            ) : (
                              <button 
                                onClick={() => completeChallengeMutation.mutate(groupDetails.activeChallenge.id)}
                                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
                              >
                                Mark as Done
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#1a1b26] rounded-xl border border-white/10 p-6 text-center">
                          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-300 font-medium mb-1">No Active Challenge</p>
                          <p className="text-sm text-slate-500 mb-4">The group leader hasn't set a challenge for this week yet.</p>
                          
                          {groupDetails.leader?._id === user?.id && (
                            <div className="max-w-xs mx-auto border-t border-white/5 pt-4 mt-4 text-left">
                              <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Create Challenge</p>
                              <select 
                                value={challengeData.resourceId}
                                onChange={e => setChallengeData({...challengeData, resourceId: e.target.value})}
                                className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-3"
                              >
                                <option value="">Select Resource...</option>
                                {resources.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                              </select>
                              <input 
                                type="number"
                                min={1}
                                value={challengeData.requiredCompletions}
                                onChange={e => setChallengeData({...challengeData, requiredCompletions: parseInt(e.target.value)})}
                                className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-3"
                                placeholder="Target Completions"
                              />
                              <button 
                                onClick={() => createChallengeMutation.mutate(challengeData)}
                                disabled={!challengeData.resourceId || createChallengeMutation.isPending}
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                Start Challenge
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Members List */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Group Members</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupDetails.members.map(m => (
                          <div key={m.id} className="flex items-center gap-3 bg-[#1a1b26] p-3 rounded-xl border border-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                              {m.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate flex items-center gap-2">
                                {m.name}
                                {groupDetails.leader?._id === m.id && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Leader</span>}
                              </p>
                              <p className="text-xs text-slate-500">Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudyGroupModal;
