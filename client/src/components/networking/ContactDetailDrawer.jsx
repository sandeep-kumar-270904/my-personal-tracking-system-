import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Copy, FileText, Share2, MessageCircle, AlertCircle, Target } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PreMessageConfidenceCard from './PreMessageConfidenceCard';

const ProfileTab = ({ contact, onUpdate }) => {
  const [notes, setNotes] = useState(contact.notes || '');
  const [enrichmentUrl, setEnrichmentUrl] = useState(contact.linkedinUrl || '');
  const [enrichmentText, setEnrichmentText] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  const handleSaveNotes = () => {
    onUpdate({ notes });
    toast.success('Notes updated');
  };

  const handleEnrich = async () => {
    if (!enrichmentText) {
      toast.error('Please paste profile text to enrich');
      return;
    }
    setIsEnriching(true);
    try {
      const { data } = await api.post(`/networking/contacts/${contact._id}/enrich`, { profileText: enrichmentText });
      
      // Update contact with non-null values
      const updates = { linkedinUrl: enrichmentUrl };
      if (data.firstName || data.lastName) updates.name = `${data.firstName || contact.name.split(' ')[0]} ${data.lastName || contact.name.split(' ')[1] || ''}`.trim();
      if (data.currentCompany) updates.company = data.currentCompany;
      if (data.currentRole) updates.role = data.currentRole;
      if (data.college) updates.college = data.college;
      if (data.graduationYear) updates.graduationYear = data.graduationYear;
      if (data.yearsOfExperience) updates.yearsOfExperience = data.yearsOfExperience;
      if (data.previousCompanies?.length) updates.previousCompanies = data.previousCompanies;
      if (data.bioSummary) updates.notes = `${contact.notes}\n\nBio: ${data.bioSummary}`.trim();

      onUpdate(updates);
      setEnrichmentText('');
      toast.success('Profile enriched successfully!');
    } catch (err) {
      toast.error('Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Networking V7: Hackathon Contact Fast-Capture */}
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-2">Meeting Context</h3>
        <p className="text-[10px] text-slate-400 mb-3">Met at a hackathon, conference, or event? Add the context here.</p>
        <div className="flex gap-2">
          <input 
            type="text"
            value={contact.meetingContext || ''}
            onChange={(e) => onUpdate({ meetingContext: e.target.value })}
            placeholder="e.g. HackMIT 2026, met at the Google booth"
            className="flex-1 bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          Enrich from LinkedIn
        </h3>
        <div className="space-y-3">
          <input 
            type="url"
            value={enrichmentUrl}
            onChange={(e) => setEnrichmentUrl(e.target.value)}
            placeholder="LinkedIn Profile URL"
            className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={enrichmentText}
            onChange={(e) => setEnrichmentText(e.target.value)}
            placeholder="Paste raw profile text (Ctrl+A, Ctrl+C on their profile)"
            className="w-full bg-[#0a0a0f] border border-white/10 text-slate-300 text-sm rounded-lg p-3 h-20 resize-none custom-scrollbar focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleEnrich}
            disabled={isEnriching || !enrichmentText}
            className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 text-sm font-medium rounded-lg transition-colors border border-blue-500/20"
          >
            {isEnriching ? 'Extracting Data...' : 'Extract & Apply to Profile'}
          </button>
        </div>
      </div>
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Relationship Strength</h3>
          <select 
            value={contact.connectionStrength}
            onChange={(e) => onUpdate({ connectionStrength: e.target.value })}
            className="bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-[#ff6b00]"
          >
            <option value="WEAK">Weak</option>
            <option value="MODERATE">Moderate</option>
            <option value="STRONG">Strong</option>
            <option value="CLOSE">Close</option>
          </select>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Health Score</span>
          <span className="text-emerald-400 font-bold">{contact.relationshipHealthScore}/100</span>
        </div>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${contact.relationshipHealthScore}%` }} />
        </div>
      </div>

      {/* Networking V7: Work Sharing Tracker */}
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-2">Work Sharing Tracker</h3>
        <p className="text-xs text-slate-400 mb-3">Check off when this contact has actually seen your work.</p>
        
        <div className="space-y-2">
          {['RESUME', 'GITHUB', 'PROJECT', 'FEEDBACK'].map(item => {
            const isChecked = contact.workSharingChecklist?.includes(item) || false;
            const labels = {
              'RESUME': 'Shared Resume for review',
              'GITHUB': 'Shared GitHub profile/repos',
              'PROJECT': 'Discussed a specific project architecture',
              'FEEDBACK': 'Received technical feedback from them'
            };
            return (
              <label key={item} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={(e) => {
                    const currentList = contact.workSharingChecklist || [];
                    let newList;
                    if (e.target.checked) newList = [...currentList, item];
                    else newList = currentList.filter(i => i !== item);
                    onUpdate({ 
                      workSharingChecklist: newList, 
                      isWorkShared: newList.length > 0 
                    });
                  }}
                  className="w-4 h-4 rounded border-slate-500 text-purple-500 focus:ring-purple-500 bg-[#0a0a0f]"
                />
                <span className={`text-sm ${isChecked ? 'text-white' : 'text-slate-400'}`}>{labels[item]}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Networking V7: JD vs Reality Panel */}
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-2">JD vs. Reality</h3>
        <p className="text-[10px] text-slate-400 mb-3">What the job description says vs. what this contact actually does.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Official JD Focus</label>
            <textarea
              value={contact.jdFocus || ''}
              onChange={(e) => onUpdate({ jdFocus: e.target.value })}
              placeholder="e.g. React, Node, AWS"
              className="w-full bg-[#0a0a0f] border border-white/10 text-slate-300 text-xs rounded-lg p-2 h-20 resize-none custom-scrollbar focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Reality (from chat)</label>
            <textarea
              value={contact.realityFocus || ''}
              onChange={(e) => onUpdate({ realityFocus: e.target.value })}
              placeholder="e.g. Mostly legacy Java, migrating to AWS slowly"
              className="w-full bg-[#0a0a0f] border border-white/10 text-emerald-400 text-xs rounded-lg p-2 h-20 resize-none custom-scrollbar focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-3">Relationship Notes</h3>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-[#ff6b00] h-32 resize-none custom-scrollbar"
          placeholder="Add notes about your interactions..."
        />
        <button 
          onClick={handleSaveNotes}
          className="mt-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
        >
          Save Notes
        </button>
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-3">Follow-up</h3>
        <input 
          type="date"
          value={contact.nextFollowUpAt ? contact.nextFollowUpAt.split('T')[0] : ''}
          onChange={(e) => onUpdate({ nextFollowUpAt: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:border-[#ff6b00]"
        />
      </div>
    </div>
  );
};

const MessagesTab = ({ contact, messages, onSendOutreach }) => {
  const [composer, setComposer] = useState('');
  const [channel, setChannel] = useState('LINKEDIN');
  const [type, setType] = useState('INITIAL_CONTACT');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data } = await api.post('/networking/outreach/generate', {
        contactId: contact._id,
        messageType: type,
        channel: channel
      });
      setComposer(data.message);
      toast.success('Message generated');
    } catch (error) {
      toast.error('Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogSend = () => {
    if (!composer) return;
    onSendOutreach({
      contactId: contact._id,
      messageType: type,
      channel,
      messageContent: composer,
      aiGenerated: isGenerating, // approximate
      sentAt: new Date()
    });
    setComposer('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-4">
        {messages.map(msg => (
          <div key={msg._id} className="bg-[#13141f] border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">{msg.channel} • {msg.messageType}</span>
              <span className="text-xs text-slate-500">{new Date(msg.sentAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.messageContent}</p>
            {msg.responseReceived && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <MessageCircle size={12}/> Response
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    msg.sentimentAnalysis === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    msg.sentimentAnalysis === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {msg.sentimentAnalysis}
                  </span>
                </div>
                <p className="text-sm text-slate-400 italic">"{msg.responseContent}"</p>
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="mx-auto mb-2 opacity-50" size={24} />
            <p className="text-sm">No messages logged yet.</p>
          </div>
        )}
      </div>

      {/* Community Engagement Layer: LinkedIn Post Engagement Tracker */}
      <div className="mb-4 bg-[#0a0a0f] border border-white/5 rounded-xl p-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs text-slate-300 font-semibold mb-1">LinkedIn Activity Tracking</span>
          <span className="text-[10px] text-slate-500">Log engagements to build rapport before the DM.</span>
        </div>
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded hover:bg-blue-500/30 transition-colors">Liked Post</button>
          <button className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded hover:bg-purple-500/30 transition-colors">Commented</button>
        </div>
      </div>

      <div className="bg-[#13141f] border border-white/10 rounded-xl p-4 shrink-0">
        {messages.length === 0 && <PreMessageConfidenceCard contactId={contact._id} contactName={contact.name} />}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <select value={channel} onChange={(e)=>setChannel(e.target.value)} className="bg-[#0a0a0f] border border-white/10 text-xs text-slate-300 rounded px-2 py-1 outline-none">
            <option value="LINKEDIN">LinkedIn</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
          <select value={type} onChange={(e)=>setType(e.target.value)} className="bg-[#0a0a0f] border border-white/10 text-xs text-slate-300 rounded px-2 py-1 outline-none">
            <option value="INITIAL_CONTACT">Initial Contact</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="REFERRAL_REQUEST">Referral Request</option>
            <option value="CHECK_IN">Check In</option>
            <option value="THANK_YOU">Thank You</option>
          </select>
          {/* Tone Presets */}
          <select className="bg-[#0a0a0f] border border-white/10 text-xs text-slate-300 rounded px-2 py-1 outline-none ml-auto">
            <option value="professional">Tone: Professional</option>
            <option value="casual">Tone: Casual</option>
            <option value="direct">Tone: Direct</option>
            <option value="enthusiastic">Tone: Enthusiastic</option>
          </select>
        </div>
        
        {/* Follow-up Legitimacy Score */}
        {type === 'FOLLOW_UP' && (
          <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded flex items-center justify-between">
            <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Legitimacy Score
            </span>
            <span className="text-xs font-bold text-emerald-400">85/100 (High Context)</span>
          </div>
        )}

        <textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="Draft your message here..."
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#ff6b00] h-24 resize-none custom-scrollbar mb-2"
        />

        {/* Real-time Message confidence score */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Confidence Score</div>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${composer.length > 50 && composer.length < 300 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                style={{ width: `${Math.min(100, Math.max(10, composer.length / 2))}%` }} 
              />
            </div>
          </div>
          <span className="text-xs text-slate-400">{composer.length} chars</span>
        </div>

        <div className="flex justify-between items-center">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-xs text-[#ff6b00] hover:text-[#ff8533] font-medium flex items-center gap-1"
          >
            {isGenerating ? 'Generating...' : '✨ AI Generate (Senior-Aware)'}
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => { navigator.clipboard.writeText(composer); toast.success('Copied!'); }}
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded" title="Copy to clipboard"
            >
              <Copy size={14}/>
            </button>
            <button 
              onClick={handleLogSend}
              disabled={!composer}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#ff6b00] hover:bg-[#e66000] disabled:opacity-50 text-white text-xs font-semibold rounded"
            >
              <Send size={12}/> Log Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferralTab = ({ contact, pipeline, onUpdate, onCreatePipeline }) => {
  const activePipeline = pipeline && pipeline.length > 0 ? pipeline[0] : null;

  if (!activePipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Share2 size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Referral Pipeline</h3>
        <p className="text-sm text-slate-400 mb-6">You haven't requested a referral from this contact yet.</p>
        <button 
          onClick={() => onCreatePipeline(contact._id)}
          className="px-4 py-2 bg-[#ff6b00] text-white font-medium rounded-lg hover:bg-[#e66000] transition-colors"
        >
          Start Referral Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-4">Pipeline Status</h3>
        <div className="flex items-center justify-between mb-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
          {['PLANNING', 'REQUESTED', 'RECEIVED'].map((step, idx) => {
            const isActive = activePipeline.status === step || (step === 'REQUESTED' && activePipeline.status === 'RECEIVED');
            const isCurrent = activePipeline.status === step;
            return (
              <div key={step} className="flex flex-col items-center gap-2 bg-[#0a0a0f] px-2">
                <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'bg-[#ff6b00] border-[#ff6b00]' : 'bg-[#13141f] border-slate-500'} ${isCurrent ? 'ring-4 ring-[#ff6b00]/20' : ''}`} />
                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-[#ff6b00]' : 'text-slate-500'}`}>{step}</span>
              </div>
            );
          })}
        </div>
        
        {activePipeline.status === 'PLANNING' && (
          <button 
            onClick={() => onUpdate({ referralStatus: 'ASKED' })} // This would also need to update pipeline status
            className="w-full py-2 bg-blue-500/20 text-blue-400 rounded text-sm font-medium hover:bg-blue-500/30 transition-colors"
          >
            Mark as Requested
          </button>
        )}
        {activePipeline.status === 'REQUESTED' && (
          <button 
            onClick={() => onUpdate({ referralStatus: 'AGREED' })}
            className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded text-sm font-medium hover:bg-emerald-500/30 transition-colors"
          >
            Mark as Received
          </button>
        )}
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white mb-3">Referral Notes</h3>
        <textarea 
          value={activePipeline.notes || ''}
          readOnly
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm h-24 resize-none custom-scrollbar"
        />
      </div>
    </div>
  );
};

const IntelTab = ({ contact, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white">Interview Insights</h3>
        </div>
        <textarea 
          value={contact.interviewInsightsShared || ''}
          onChange={(e) => onUpdate({ interviewInsightsShared: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-[#ff6b00] h-24 resize-none custom-scrollbar"
          placeholder="What did they say about the interview process?"
        />
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-[#ff6b00]" />
          <h3 className="font-semibold text-white">DSA / Technical Insights</h3>
        </div>
        <textarea 
          value={contact.dsaInsightsShared || ''}
          onChange={(e) => onUpdate({ dsaInsightsShared: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-[#ff6b00] h-24 resize-none custom-scrollbar"
          placeholder="Did they share any specific questions or topics? (Saving this automatically pushes to DSA Tracker)"
        />
      </div>

      <div className="bg-[#13141f] p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Company Culture & Tips</h3>
        </div>
        <textarea 
          value={contact.companyInsightsShared || ''}
          onChange={(e) => onUpdate({ companyInsightsShared: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-[#ff6b00] h-24 resize-none custom-scrollbar"
          placeholder="Work-life balance, team dynamics..."
        />
      </div>
    </div>
  );
};

const IntroTab = ({ contact }) => {
  const [selectedIntroducerId, setSelectedIntroducerId] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ['networking-contacts-all'],
    queryFn: async () => {
      const res = await api.get('/networking/contacts');
      return Array.isArray(res.data) ? res.data : (res.data.contacts || []);
    }
  });

  const potentialIntroducers = contacts.filter(c => c._id !== contact._id);

  const handleGenerate = async () => {
    if (!selectedIntroducerId) return toast.error('Select an introducer first');
    setIsGenerating(true);
    try {
      const res = await api.post('/networking/outreach/intro-request', {
        targetContactId: contact._id,
        introducerId: selectedIntroducerId
      });
      setGeneratedMessage(res.data.message);
      toast.success('Intro request generated!');
    } catch (err) {
      toast.error('Failed to generate intro request');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#13141f] border border-white/5 rounded-xl p-5">
        <h3 className="font-bold text-white mb-4">Request Introduction</h3>
        <p className="text-sm text-slate-400 mb-4">
          Select a mutual connection to ask for a warm intro to {contact.name}.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Introducer</label>
            <select
              value={selectedIntroducerId}
              onChange={e => setSelectedIntroducerId(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]"
            >
              <option value="">-- Choose Contact --</option>
              {potentialIntroducers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedIntroducerId}
            className="w-full py-2.5 bg-[#ff6b00] hover:bg-[#e66000] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isGenerating ? 'Drafting Request...' : 'Generate Intro Draft'}
          </button>
        </div>
      </div>

      {generatedMessage && (
        <div className="bg-[#13141f] border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white">Draft Message</h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedMessage);
                toast.success('Copied to clipboard');
              }}
              className="flex items-center gap-2 text-xs text-[#ff6b00] hover:text-[#e66000]"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            value={generatedMessage}
            onChange={(e) => setGeneratedMessage(e.target.value)}
            className="w-full h-48 bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-[#ff6b00]"
          />
        </div>
      )}
    </div>
  );
};

const ContactDetailDrawer = ({ contact, messages, pipeline, applications, onClose, onUpdate, onSendOutreach, onCreatePipeline }) => {
  const [activeTab, setActiveTab] = useState('PROFILE');

  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[500px] bg-[#0a0a0f] border-l border-white/10 h-full flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 bg-[#13141f] shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{contact.name || `${contact.firstName} ${contact.lastName}`}</h2>
                {contact.placementLeverageScore > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 rounded border border-blue-500/30 text-[10px] font-bold text-blue-300" title="Placement Leverage Score">
                    <Target size={12} />
                    {contact.placementLeverageScore}
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400">{contact.role} @ <span className="text-slate-300 font-medium">{contact.company}</span></p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 overflow-x-auto custom-scrollbar pb-1">
            <button 
              onClick={() => setActiveTab('PROFILE')}
              className={`pb-2 border-b-2 px-1 whitespace-nowrap ${activeTab === 'PROFILE' ? 'border-[#ff6b00] text-white' : 'border-transparent hover:text-slate-300'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('MESSAGES')}
              className={`pb-2 border-b-2 px-1 whitespace-nowrap ${activeTab === 'MESSAGES' ? 'border-[#ff6b00] text-white' : 'border-transparent hover:text-slate-300'}`}
            >
              Messages
            </button>
            <button 
              onClick={() => setActiveTab('REFERRAL')}
              className={`pb-2 border-b-2 px-1 whitespace-nowrap ${activeTab === 'REFERRAL' ? 'border-[#ff6b00] text-white' : 'border-transparent hover:text-slate-300'}`}
            >
              Referral
            </button>
            <button 
              onClick={() => setActiveTab('INTEL')}
              className={`pb-2 border-b-2 px-1 whitespace-nowrap ${activeTab === 'INTEL' ? 'border-[#ff6b00] text-white' : 'border-transparent hover:text-slate-300'}`}
            >
              Intel
            </button>
            <button 
              onClick={() => setActiveTab('INTRO')}
              className={`pb-2 border-b-2 px-1 whitespace-nowrap ${activeTab === 'INTRO' ? 'border-[#ff6b00] text-white' : 'border-transparent hover:text-slate-300'}`}
            >
              Request Intro
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'PROFILE' && <ProfileTab contact={contact} onUpdate={onUpdate} />}
          {activeTab === 'MESSAGES' && <MessagesTab contact={contact} messages={messages} onSendOutreach={onSendOutreach} />}
          {activeTab === 'REFERRAL' && <ReferralTab contact={contact} pipeline={pipeline} onUpdate={onUpdate} onCreatePipeline={onCreatePipeline} />}
          {activeTab === 'INTEL' && <IntelTab contact={contact} onUpdate={onUpdate} />}
          {activeTab === 'INTRO' && <IntroTab contact={contact} />}
        </div>
      </motion.div>
    </div>
  );
};

export default ContactDetailDrawer;
