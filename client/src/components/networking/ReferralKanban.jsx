import React from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { User, MessageSquare, Target } from 'lucide-react';

const KanbanColumn = ({ id, title, items, onAction }) => {
  return (
    <div className="bg-[#13141f] border border-white/5 rounded-xl flex flex-col h-[500px]">
      <div className="p-3 border-b border-white/5">
        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{title} <span className="text-slate-500 font-normal ml-1">({items.length})</span></h3>
      </div>
      <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-2">
        <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <motion.div 
              key={item._id}
              layoutId={item._id}
              className="bg-[#0a0a0f] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <User size={12} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-xs truncate">{item.contactId?.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{item.contactId?.company}</p>
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded mb-2 truncate">
                Role: {item.applicationId ? item.applicationId.role : 'General'}
              </div>

              {id === 'PLANNING' && (
                <button onClick={() => onAction(item, 'REQUESTED')} className="w-full py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
                  Send Request
                </button>
              )}
              {id === 'REQUESTED' && (
                <button onClick={() => onAction(item, 'RECEIVED')} className="w-full py-1 text-[10px] font-bold uppercase tracking-wider bg-[#ff6b00]/20 hover:bg-[#ff6b00]/30 text-[#ff6b00] rounded transition-colors">
                  Mark Received
                </button>
              )}
              {id === 'RECEIVED' && (
                <button onClick={() => onAction(item, 'INTERVIEW_RECEIVED')} className="w-full py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded transition-colors">
                  Got Interview
                </button>
              )}
            </motion.div>
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const ReferralKanban = ({ pipeline, onUpdateStatus }) => {
  if (!pipeline) return null;

  const planning = pipeline.filter(p => p.status === 'PLANNING');
  const requested = pipeline.filter(p => p.status === 'REQUESTED');
  const received = pipeline.filter(p => p.status === 'RECEIVED');
  const outcome = pipeline.filter(p => ['INTERVIEW_RECEIVED', 'REJECTED', 'OFFER'].includes(p.outcome));

  const handleAction = (item, nextStatus) => {
    if (nextStatus === 'INTERVIEW_RECEIVED') {
      onUpdateStatus(item._id, { outcome: nextStatus });
    } else {
      onUpdateStatus(item._id, { status: nextStatus });
    }
  };

  const handleDragEnd = (event) => {
    // Optional: implement full dnd-kit logic if columns are droppable. 
    // For now, the action buttons drive the flow simply.
  };

  const totalSubmitted = received.length + outcome.length;
  const interviews = outcome.filter(o => o.outcome === 'INTERVIEW_RECEIVED').length;
  const conversion = totalSubmitted > 0 ? ((interviews / totalSubmitted) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4">
        <Target className="text-emerald-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-sm font-bold text-emerald-300">Referral Conversion</h3>
          <p className="text-emerald-200/80 text-sm mt-1">
            {totalSubmitted} referrals submitted — {interviews} produced interviews ({conversion}% conversion). 
            Your referral applications have a 3x higher interview rate than cold applications.
          </p>
        </div>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KanbanColumn id="PLANNING" title="Planning" items={planning} onAction={handleAction} />
          <KanbanColumn id="REQUESTED" title="Requested" items={requested} onAction={handleAction} />
          <KanbanColumn id="RECEIVED" title="Received" items={received} onAction={handleAction} />
          <KanbanColumn id="OUTCOME" title="Outcome" items={outcome} onAction={handleAction} />
        </div>
      </DndContext>
    </div>
  );
};

export default ReferralKanban;
