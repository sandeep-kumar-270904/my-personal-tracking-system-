import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Table, Search, Filter, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CONF_COLORS = {
  SHAKY: 'bg-red-900/40 text-red-400',
  OKAY: 'bg-amber-900/40 text-amber-400',
  SOLID: 'bg-cyan-900/40 text-cyan-400',
  MASTERED: 'bg-green-900/40 text-green-400'
};

const ProblemLog = () => {
  const [search, setSearch] = useState('');
  const [filterConf, setFilterConf] = useState('');

  const { data: problems, isLoading } = useQuery({
    queryKey: ['dsa', 'problems', search, filterConf],
    queryFn: async () => {
      let url = '/dsa/problems?';
      if (search) url += `search=${search}&`;
      if (filterConf) url += `confidenceLevel=${filterConf}&`;
      const res = await api.get(url);
      return res.data;
    }
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-10">
      <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-white">Problem Log</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search problems..." 
              className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            value={filterConf}
            onChange={(e) => setFilterConf(e.target.value)}
          >
            <option value="">All Confidence</option>
            <option value="SHAKY">Shaky</option>
            <option value="OKAY">Okay</option>
            <option value="SOLID">Solid</option>
            <option value="MASTERED">Mastered</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Problem</th>
              <th className="px-6 py-4 font-medium">Topic</th>
              <th className="px-6 py-4 font-medium">Confidence</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Review Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="animate-pulse flex flex-col gap-2 items-center justify-center">
                    <div className="h-4 w-48 bg-gray-800 rounded"></div>
                    <div className="h-4 w-32 bg-gray-800 rounded"></div>
                  </div>
                </td>
              </tr>
            ) : problems?.length > 0 ? (
              problems.map((prob) => (
                <tr key={prob._id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {prob.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      <a href={prob.url} target="_blank" rel="noreferrer" className="font-medium text-white hover:text-cyan-400 transition-colors">
                        {prob.title || 'Untitled'}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 bg-gray-800 px-2 py-1 rounded text-xs">
                      {prob.topic}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${CONF_COLORS[prob.confidenceLevel]}`}>
                      {prob.confidenceLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {prob.timeToSolve ? (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" /> {prob.timeToSolve}m
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {prob.reviewDue ? new Date(prob.reviewDue).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No problems found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemLog;
