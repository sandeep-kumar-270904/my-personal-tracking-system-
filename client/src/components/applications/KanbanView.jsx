import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Clock, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'Applied', title: 'Applied', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { id: 'OA', title: 'Online Assessment', color: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  { id: 'Interview', title: 'Interview', color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { id: 'Selected', title: 'Offer', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { id: 'Rejected', title: 'Rejected', color: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
];

const SortableAppCard = ({ app, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app._id, data: { status: app.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : 1 };
  
  const isGhosted = app.status === 'Applied' && (new Date() - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24) > 14;

  const colColor = COLUMNS.find(c => c.id === app.status)?.color || 'border-slate-500';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(app)}
      className={`glass-card p-4 rounded-xl border-l-4 ${colColor} mb-3 cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors relative group`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white text-sm truncate pr-2">{app.company}</h4>
        {isGhosted && (
          <div className="flex-shrink-0 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1" title="Ghosted? No update in 14 days">
            <AlertCircle className="w-3 h-3" /> Ghosted
          </div>
        )}
      </div>
      <p className="text-slate-300 text-xs mb-3 truncate">{app.role}</p>
      <div className="flex items-center text-slate-400 text-[11px] gap-2">
        <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(app.appliedDate).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ column, applications, onCardClick }) => {
  const appsInColumn = applications.filter(a => a.status === column.id);
  
  return (
    <div className="flex flex-col h-full bg-[#13141f] border border-white/5 rounded-2xl overflow-hidden min-w-[280px]">
      <div className={`p-3 flex justify-between items-center border-b border-white/5 ${column.bg}`}>
        <h3 className={`font-semibold text-sm ${column.text}`}>{column.title}</h3>
        <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">{appsInColumn.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={appsInColumn.map(a => a._id)} strategy={verticalListSortingStrategy}>
          {appsInColumn.map(app => (
            <SortableAppCard key={app._id} app={app} onClick={onCardClick} />
          ))}
        </SortableContext>
        {appsInColumn.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-8">
            <Building2 className="w-8 h-8 mb-2" />
            <span className="text-xs">No items</span>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanView = ({ applications, onStatusChange, onAppClick }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const appId = active.id;
    const overId = over.id;

    // Find what status we dropped over
    let newStatus = null;
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId; // dropped on empty column
    } else {
      const overApp = applications.find(a => a._id === overId);
      if (overApp) newStatus = overApp.status;
    }

    const activeApp = applications.find(a => a._id === appId);
    if (activeApp && newStatus && activeApp.status !== newStatus) {
      onStatusChange(appId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="w-1/5 min-w-[280px]">
            <SortableContext items={[col.id]} strategy={verticalListSortingStrategy}>
              <KanbanColumn column={col} applications={applications} onCardClick={onAppClick} />
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanView;
