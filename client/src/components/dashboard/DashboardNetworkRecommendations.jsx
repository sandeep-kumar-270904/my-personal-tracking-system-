import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Network, ArrowRight } from 'lucide-react';
import { ContactMiniCard } from '../networking/shared';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const fetchRecommendations = async () => {
  const res = await api.get('/networking/recommendations');
  return res.data;
};

const fetchStats = async () => {
  const res = await api.get('/networking/stats');
  return res.data;
};

const DashboardNetworkRecommendations = () => {
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['networking', 'recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['networking', 'stats'],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000,
  });

  if (recLoading || statsLoading) return null;

  const totalContacts = statsData?.data?.totalContacts || 0;
  
  if (totalContacts === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-white/5 mb-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
          <Network className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium text-lg mb-2">Activate your network</h3>
        <p className="text-slate-400 text-sm max-w-md mb-4">
          You haven't added any contacts yet. Your network is your biggest placement advantage. 
        </p>
        <Link 
          to="/networking?tab=alumni"
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Add first contact
        </Link>
      </div>
    );
  }

  const recommendations = recData?.recommendations?.slice(0, 3) || [];
  
  if (recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-400" />
          Activate your network
        </h3>
        <Link to="/networking" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <ContactMiniCard
            key={idx}
            contact={rec.contact}
            actionLabel="Message"
            onAction={() => window.location.href = `/networking?contactId=${rec.contact._id}&action=message`}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardNetworkRecommendations;
