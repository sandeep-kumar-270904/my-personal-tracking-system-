import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RefreshCw, Medal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const LeaderboardModal = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState('alltime'); // 'week', 'month', 'alltime'

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await api.get(`/gamification/leaderboard?period=${period}`);
      return res.data; // { top20: [], currentUser: {} }
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform border shadow-2xl rounded-2xl bg-zinc-900 border-zinc-800 sm:my-8 sm:p-6 sm:align-middle"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">PrepHub Leaderboard</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 transition-colors rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                disabled={isFetching}
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-1 mb-6 rounded-lg bg-zinc-800/50">
            {['This Week', 'This Month', 'All Time'].map((tab) => {
              const tabValue = tab.replace('This ', '').toLowerCase().replace(' ', '');
              return (
                <button
                  key={tab}
                  onClick={() => setPeriod(tabValue)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    period === tabValue
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden border rounded-xl border-zinc-800 bg-zinc-900/50">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium uppercase border-b text-zinc-400 border-zinc-800 bg-zinc-800/20">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Student</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-2 text-right">Badges</div>
              <div className="col-span-2 text-right">Streak</div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="py-12 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 px-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                      <div className="flex-1 h-8 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : data?.top20?.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Medal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No activity in this period yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {data?.top20?.map((user) => (
                    <div
                      key={user.userId}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors hover:bg-zinc-800/30 ${
                        data?.currentUser?.userId === user.userId ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <div className="col-span-1 font-bold text-center">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : <span className="text-zinc-500">{user.rank}</span>}
                      </div>
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-zinc-700">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-white truncate">{user.name.split(' ')[0]}</p>
                          {user.gradYear && <p className="text-xs text-zinc-500">Class of {user.gradYear}</p>}
                        </div>
                      </div>
                      <div className="col-span-2 font-mono text-sm font-semibold text-right text-indigo-400">
                        {user.score}
                      </div>
                      <div className="col-span-2 text-sm text-right text-zinc-400">
                        {user.badgesCount}
                      </div>
                      <div className="col-span-2 text-sm text-right text-orange-400">
                        {user.streak > 0 ? `${user.streak} 🔥` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data?.currentUser && !data.top20?.some(u => u.userId === data.currentUser.userId) && (
              <div className="border-t border-zinc-800 bg-indigo-500/10 px-4 py-3 grid grid-cols-12 gap-4 items-center">
                 <div className="col-span-1 font-bold text-center text-zinc-500">
                  {data.currentUser.rank}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-indigo-600">
                    {data.currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-white truncate">{data.currentUser.name.split(' ')[0]} (You)</p>
                  </div>
                </div>
                <div className="col-span-2 font-mono text-sm font-semibold text-right text-indigo-400">
                  {data.currentUser.score}
                </div>
                <div className="col-span-2 text-sm text-right text-zinc-400">
                  {data.currentUser.badgesCount}
                </div>
                <div className="col-span-2 text-sm text-right text-orange-400">
                  {data.currentUser.streak > 0 ? `${data.currentUser.streak} 🔥` : '-'}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LeaderboardModal;
