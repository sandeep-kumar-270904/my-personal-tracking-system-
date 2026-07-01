import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const OfferCriteriaSettings = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newCriteria, setNewCriteria] = useState({ criteria_name: '', criteria_type: 'minimum_ctc', target_value: '' });

  const { data: criteria = [] } = useQuery({
    queryKey: ['offer-criteria'],
    queryFn: async () => {
      const res = await api.get('/offer-criteria');
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data) => await api.post('/offer-criteria', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offer-criteria']);
      setNewCriteria({ criteria_name: '', criteria_type: 'minimum_ctc', target_value: '' });
      toast.success('Criteria added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/offer-criteria/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['offer-criteria']);
      toast.success('Criteria removed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCriteria.criteria_name || !newCriteria.target_value) return;
    addMutation.mutate(newCriteria);
  };

  const getPlaceholder = (type) => {
    if (type.includes('ctc') || type.includes('salary')) return 'e.g. 1000000';
    if (type === 'no_bond') return 'e.g. true (enter 1 or true)';
    if (type === 'work_mode') return 'e.g. hybrid or remote';
    return 'Value';
  };

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-colors"
      >
        <Settings2 className="w-4 h-4" /> Personal Offer Criteria
      </button>

      {isOpen && (
        <div className="mt-4 bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-1">Objective Fit-Checking</h4>
          <p className="text-xs text-slate-400 mb-4">Set your non-negotiables. We'll automatically check pending offers against these criteria.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {criteria.map(c => (
              <div key={c._id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center group">
                <div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{c.criteria_name}</p>
                  <p className="text-sm text-white">Target: {c.target_value}</p>
                </div>
                <button 
                  onClick={() => deleteMutation.mutate(c._id)}
                  className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
              <input type="text" placeholder="e.g. Base Pay Target" value={newCriteria.criteria_name} onChange={(e) => setNewCriteria({...newCriteria, criteria_name: e.target.value})} className="input-field py-2 px-3 text-sm w-full" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
              <select value={newCriteria.criteria_type} onChange={(e) => setNewCriteria({...newCriteria, criteria_type: e.target.value})} className="input-field py-2 px-3 text-sm w-full">
                <option value="minimum_ctc">Minimum CTC</option>
                <option value="minimum_base">Minimum Base Salary</option>
                <option value="no_bond">No Service Bond</option>
                <option value="work_mode">Work Mode</option>
                <option value="location">Location</option>
                <option value="custom">Custom Threshold</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Value</label>
              <input type="text" placeholder={getPlaceholder(newCriteria.criteria_type)} value={newCriteria.target_value} onChange={(e) => setNewCriteria({...newCriteria, target_value: e.target.value})} className="input-field py-2 px-3 text-sm w-full" />
            </div>
            <button type="submit" disabled={!newCriteria.criteria_name || !newCriteria.target_value || addMutation.isPending} className="btn-secondary px-4 py-2 text-sm h-[38px] flex items-center">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const checkOfferFit = (offer, criteriaList) => {
  if (!criteriaList || criteriaList.length === 0) return [];
  
  return criteriaList.map(criteria => {
    let isMet = false;
    const value = criteria.target_value.toLowerCase();
    
    switch (criteria.criteria_type) {
      case 'minimum_ctc':
        isMet = offer.ctc_annual >= parseInt(value, 10);
        break;
      case 'minimum_base':
        isMet = offer.base_salary >= parseInt(value, 10);
        break;
      case 'no_bond':
        isMet = !offer.has_bond;
        break;
      case 'work_mode':
        isMet = offer.work_mode?.toLowerCase() === value;
        break;
      case 'location':
        isMet = offer.location?.toLowerCase().includes(value);
        break;
      default:
        isMet = false;
    }

    return {
      name: criteria.criteria_name,
      isMet
    };
  });
};

export default OfferCriteriaSettings;
