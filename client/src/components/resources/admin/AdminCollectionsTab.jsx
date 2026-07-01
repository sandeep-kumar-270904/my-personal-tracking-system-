import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2, Edit2, Save, X, Search, Check } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const SortableItem = ({ id, item, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-[#13141f] p-3 rounded-lg border border-white/5 mb-2 group">
      <div {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium text-sm">{item.resourceId?.title || 'Unknown Resource'}</p>
        <p className="text-slate-500 text-xs">{item.resourceId?.category} • {item.resourceId?.difficulty}</p>
      </div>
      <button onClick={() => onRemove(id)} className="text-slate-500 hover:text-red-400 p-2">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const AdminCollectionsTab = () => {
  const queryClient = useQueryClient();
  const [selectedCol, setSelectedCol] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', tagline: '', estimatedTime: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsList, setItemsList] = useState([]); // local state for drag and drop

  const { data: collections = [] } = useQuery({
    queryKey: ['admin_collections'],
    queryFn: async () => {
      const res = await api.get('/admin/collections');
      return res.data;
    }
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await api.get('/resources');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/admin/collections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_collections'] });
      setIsCreating(false);
      setFormData({ name: '', tagline: '', estimatedTime: '' });
      toast.success('Collection created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await api.patch(`/admin/collections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_collections'] });
      toast.success('Collection updated');
    }
  });

  const updateItemsMutation = useMutation({
    mutationFn: async ({ id, items }) => await api.put(`/admin/collections/${id}/items`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_collections'] });
      toast.success('Items saved');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_collections'] });
      setSelectedCol(null);
      toast.success('Collection deleted');
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItemsList((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const selectCollection = (col) => {
    setSelectedCol(col);
    // Give each item a temp id for sortable if it doesn't have one
    setItemsList(col.items.map((it, i) => ({ ...it, _id: it._id || `temp-${i}` })));
  };

  const addResourceToCollection = (resource) => {
    if (itemsList.find(i => i.resourceId?._id === resource.id)) {
      return toast.error('Resource already in collection');
    }
    const newItem = {
      _id: `new-${Date.now()}`,
      resourceId: { _id: resource.id, title: resource.title, category: resource.category, difficulty: resource.difficulty },
      order: itemsList.length + 1
    };
    setItemsList([...itemsList, newItem]);
  };

  const removeResource = (id) => {
    setItemsList(itemsList.filter(i => i._id !== id));
  };

  const saveItems = () => {
    // format items
    const formatted = itemsList.map((it, idx) => ({
      resourceId: it.resourceId._id,
      order: idx + 1
    }));
    updateItemsMutation.mutate({ id: selectedCol.id, items: formatted });
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      {/* Sidebar - List of Collections */}
      <div className="w-full md:w-1/3 flex flex-col bg-[#13141f] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white">Collections</h3>
          <button onClick={() => setIsCreating(true)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => { setIsCreating(false); selectCollection(col); }}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedCol?.id === col.id && !isCreating ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200 text-sm truncate">{col.name}</span>
                <span className={`w-2 h-2 rounded-full ${col.isPublished ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              </div>
              <span className="text-xs text-slate-500">{col.resourceCount} items</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#13141f] rounded-xl border border-white/5 p-6 overflow-y-auto custom-scrollbar">
        {isCreating ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Create New Collection</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Google Interview Prep" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Tagline</label>
                <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="A comprehensive guide to cracking Google..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Estimated Time</label>
                <input type="text" value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 4 Weeks" />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => createMutation.mutate(formData)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">Create</button>
                <button onClick={() => setIsCreating(false)} className="px-6 py-2 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        ) : selectedCol ? (
          <div>
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedCol.name}</h2>
                <p className="text-sm text-slate-400">{selectedCol.tagline}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateMutation.mutate({ id: selectedCol.id, data: { isPublished: !selectedCol.isPublished }})}
                  className={`px-4 py-2 rounded-lg font-bold text-sm border ${selectedCol.isPublished ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
                >
                  {selectedCol.isPublished ? 'Published' : 'Draft'}
                </button>
                <button onClick={() => { if(confirm('Delete collection?')) deleteMutation.mutate(selectedCol.id); }} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left side: Manage Items (DnD) */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white">Collection Items</h3>
                  <button onClick={saveItems} disabled={updateItemsMutation.isPending} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-50">
                    <Save className="w-3 h-3" /> Save Order
                  </button>
                </div>
                
                {itemsList.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                    No items yet. Search and add resources.
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={itemsList.map(i => i._id)} strategy={verticalListSortingStrategy}>
                      {itemsList.map(item => (
                        <SortableItem key={item._id} id={item._id} item={item} onRemove={removeResource} />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Right side: Search Resources */}
              <div>
                <h3 className="font-bold text-white mb-4">Add Resources</h3>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by title or category..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1a1b26] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredResources.map(res => {
                    const isAdded = itemsList.some(i => i.resourceId?._id === res.id);
                    return (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-[#1a1b26] border border-white/5 rounded-lg">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-white text-sm font-medium truncate">{res.title}</p>
                          <p className="text-slate-500 text-xs truncate">{res.category}</p>
                        </div>
                        <button 
                          disabled={isAdded}
                          onClick={() => addResourceToCollection(res)}
                          className={`p-1.5 rounded-lg shrink-0 ${isAdded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                        >
                          {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
            <GripVertical className="w-12 h-12 opacity-20" />
            <p>Select a collection to edit or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCollectionsTab;
