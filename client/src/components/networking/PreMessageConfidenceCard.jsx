import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, ShieldCheck } from 'lucide-react';

const PreMessageConfidenceCard = ({ contactId, contactName }) => {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfidence = async () => {
      try {
        const res = await axios.post('/api/networking/confidence/generate', { contactId });
        setStatements(res.data.statements);
      } catch (err) {
        console.error('Failed to generate confidence card', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (contactId) {
      fetchConfidence();
    }
  }, [contactId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-4 border border-blue-500/20 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded"></div>
          <div className="h-3 w-5/6 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!statements || statements.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-4 border border-blue-500/20 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h4 className="font-semibold text-white">Why you're worth {contactName?.split(' ')[0] || 'their'}'s time</h4>
      </div>
      <ul className="space-y-2">
        {statements.map((statement, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>{statement}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PreMessageConfidenceCard;
