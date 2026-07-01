import { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { id: 'APPLIED', title: 'Applied' },
  { id: 'OA_PENDING', title: 'OA Pending' },
  { id: 'OA_DONE', title: 'OA Done' },
  { id: 'INTERVIEW_SCHEDULED', title: 'Interview' },
  { id: 'SHORTLISTED', title: 'Shortlisted' },
  { id: 'OFFER', title: 'Offer' },
  { id: 'REJECTED', title: 'Rejected' }
];

const SortableAppCard = ({ app, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app._id, data: app });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDead = app.momentumScore < 30;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white/5 p-3 rounded-xl border ${isDead ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : 'border-white/10 shadow-sm'} cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors ${isOverlay ? 'scale-105 shadow-xl rotate-2' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <img src={`https://logo.clearbit.com/${app.company.replace(/ /g, '').toLowerCase()}.com`} alt={app.company} className="w-6 h-6 rounded bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
        <h4 className="font-semibold text-white text-sm truncate">{app.company}</h4>
      </div>
      <p className="text-xs text-slate-400 mb-2 truncate">{app.role}</p>
      
      {/* Momentum Bar */}
      <div className="w-full bg-white/5 rounded-full h-1 mt-1 mb-2 overflow-hidden relative" title={`Momentum: ${app.momentumScore ?? 100}`}>
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            app.momentumScore >= 80 ? 'bg-emerald-500' :
            app.momentumScore >= 50 ? 'bg-blue-500' :
            app.momentumScore >= 20 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${app.momentumScore ?? 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
        <span>{new Date(app.dateApplied).toLocaleDateString()}</span>
        <span className={`px-1.5 py-0.5 rounded border ${app.priority === 'HIGH' ? 'border-red-500/20 text-red-500 bg-red-500/10' : app.priority === 'MEDIUM' ? 'border-amber-500/20 text-amber-500 bg-amber-500/10' : 'border-gray-500/20 text-gray-500 bg-gray-500/10'}`}>
          {app.priority}
        </span>
      </div>
    </div>
  );
};

const Column = ({ column, items }) => {
  return (
    <div className="flex-1 min-w-[250px] bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{column.title}</h3>
        <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-1 custom-scrollbar">
        <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(app => (
            <SortableAppCard key={app._id} app={app} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-20 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanView = ({ applications }) => {
  const [items, setItems] = useState(applications);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    setItems(applications);
  }, [applications]);

  const activeApp = activeId ? items.find(app => app._id === activeId) : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeApp = items.find(app => app._id === active.id);
    
    // Find what column it dropped over
    let overStatus = null;
    if (STATUS_COLUMNS.some(c => c.id === over.id)) {
       overStatus = over.id; // Dropped directly onto a column
    } else {
       const overApp = items.find(app => app._id === over.id);
       if (overApp) overStatus = overApp.status;
    }

    if (overStatus && activeApp.status !== overStatus) {
      // Optimistic update
      const prevStatus = activeApp.status;
      setItems(items.map(app => app._id === active.id ? { ...app, status: overStatus } : app));
      
      try {
        await api.patch(`/applications/${active.id}`, { status: overStatus });
        toast.success(`Moved to ${overStatus.replace('_', ' ')}`);
      } catch (error) {
        // Revert on error
        setItems(items.map(app => app._id === active.id ? { ...app, status: prevStatus } : app));
        toast.error('Failed to update status');
      }
    }
  };

  const getAppsForColumn = (statusId) => items.filter(app => app.status === statusId);

  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        {STATUS_COLUMNS.map(column => (
          <Column key={column.id} column={column} items={getAppsForColumn(column.id)} />
        ))}
        <DragOverlay>
          {activeApp ? <SortableAppCard app={activeApp} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanView;
