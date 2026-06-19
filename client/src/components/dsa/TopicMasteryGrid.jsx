import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, LayoutGrid, List } from 'lucide-react';

const MASTERY_COLORS = {
  NOT_STARTED: 'border-gray-700 bg-gray-800 text-gray-400',
  BEGINNER: 'border-red-900 bg-red-900/20 text-red-400',
  INTERMEDIATE: 'border-amber-900 bg-amber-900/20 text-amber-400',
  ADVANCED: 'border-cyan-900 bg-cyan-900/20 text-cyan-400',
  MASTERED: 'border-green-900 bg-green-900/20 text-green-400'
};

const TopicMasteryGrid = ({ topics = [] }) => {
  const [viewMode, setViewMode] = useState('grid');
  
  // Sort by weakness descending
  const sortedTopics = [...topics].sort((a, b) => b.weaknessScore - a.weaknessScore);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-white">Topic Mastery</h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedTopics.map((topic, i) => (
            <motion.div 
              key={topic._id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl border ${MASTERY_COLORS[topic.masteryLevel].split(' ')[0]} bg-gray-900 flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {topic.topicName}
                  {topic.decayScore > 20 && (
                    <span title="Knowledge Decay Detected" className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${MASTERY_COLORS[topic.masteryLevel].split(' ').slice(1).join(' ')}`}>
                  {topic.masteryLevel.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{topic.solvedCount}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Solved</p>
                  </div>
                </div>
                
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Weakness</span>
                    <span className={topic.weaknessScore > 60 ? 'text-red-400 font-medium' : 'text-gray-400'}>{topic.weaknessScore}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${topic.weaknessScore > 60 ? 'bg-red-500' : topic.weaknessScore > 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${topic.weaknessScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Topic</th>
                <th className="px-6 py-4 font-medium">Mastery</th>
                <th className="px-6 py-4 font-medium">Solved</th>
                <th className="px-6 py-4 font-medium">Weakness Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedTopics.map((topic) => (
                <tr key={topic._id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    {topic.topicName}
                    {topic.decayScore > 20 && <AlertCircle className="w-3 h-3 text-rose-500" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${MASTERY_COLORS[topic.masteryLevel].split(' ').slice(1).join(' ')}`}>
                      {topic.masteryLevel.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{topic.solvedCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={topic.weaknessScore > 60 ? 'text-red-400 font-medium' : 'text-gray-400'}>{topic.weaknessScore}</span>
                      <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${topic.weaknessScore > 60 ? 'bg-red-500' : topic.weaknessScore > 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${topic.weaknessScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopicMasteryGrid;
