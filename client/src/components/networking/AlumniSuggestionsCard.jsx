import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { GraduationCap, ExternalLink, Users } from 'lucide-react';

const AlumniSuggestionsCard = () => {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['alumniSuggestions'],
    queryFn: async () => {
      const { data } = await api.get('/networking/outreach/alumni-suggestions');
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-[#13141f] border border-white/5 rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded"></div>
          <div className="h-16 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-[#13141f] border border-white/5 rounded-xl p-5">
      <h3 className="font-bold text-white flex items-center gap-2 mb-4">
        <GraduationCap className="text-emerald-400" /> Alumni Network Engine
      </h3>
      
      <div className="space-y-4">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-white">{suggestion.company}</span>
              {suggestion.needsAlumni ? (
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Need Alumni</span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  {suggestion.alumniContacts.length} Alumni
                </span>
              )}
            </div>
            
            {suggestion.needsAlumni ? (
              <p className="text-xs text-slate-400 mb-3">You have {suggestion.totalContacts} contacts here, but no alumni. Alumni respond 3x more often.</p>
            ) : (
              <div className="flex -space-x-2 mb-3">
                {suggestion.alumniContacts.slice(0,3).map((alumni, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400 font-bold" title={alumni.name}>
                    {alumni.name.charAt(0)}
                  </div>
                ))}
                {suggestion.alumniContacts.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                    +{suggestion.alumniContacts.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(suggestion.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              <ExternalLink size={12} /> Search LinkedIn via Google
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlumniSuggestionsCard;
