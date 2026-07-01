import { CheckCircle2, ArrowRight } from 'lucide-react';

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner': return 'text-[#22c55e] border-[#22c55e]';
    case 'Intermediate': return 'text-[#eab308] border-[#eab308]';
    case 'Advanced': return 'text-[#ef4444] border-[#ef4444]';
    default: return 'text-gray-500 border-gray-500';
  }
};

const RoadmapView = ({ resources, category, onPreview }) => {
  // Filter for active category, force DSA if All
  const displayCat = (category === 'All' || category === 'Saved') ? 'DSA' : category;
  
  const pathResources = resources
    .filter(r => r.category === displayCat)
    .sort((a, b) => {
      const diffOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });

  const total = pathResources.length;
  const completedCount = pathResources.filter(r => r.hasCompleted).length;
  
  // Find first uncompleted index to mark as "Current"
  const currentIndex = pathResources.findIndex(r => !r.hasCompleted);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{displayCat} Learning Path</h2>
        <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          {completedCount} of {total} completed
        </div>
      </div>

      <div className="relative">
        {/* Continuous vertical line behind nodes */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-white/5 z-0" />

        <div className="space-y-8 relative z-10">
          {pathResources.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              No resources available for {displayCat}
            </div>
          )}
          
          {pathResources.map((res, index) => {
            const isCompleted = res.hasCompleted;
            const isCurrent = index === currentIndex;
            const diffStyle = getDifficultyColor(res.difficulty);

            return (
              <div key={res.id} className="flex gap-4 md:gap-6 relative">
                {/* Connector Line Fill for Completed */}
                {isCompleted && index !== pathResources.length - 1 && (
                  <div className="absolute left-6 md:left-8 top-12 w-[2px] h-[calc(100%+32px)] bg-emerald-500/50 z-[-1]" />
                )}

                {/* Node Icon */}
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 shrink-0 bg-[#13141f] transition-colors ${
                  isCompleted ? 'border-emerald-500 text-emerald-400' :
                  isCurrent ? 'border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                  'border-white/10 text-slate-600'
                }`}>
                  <span className="font-bold text-sm md:text-lg">{index + 1}</span>
                </div>

                {/* Card */}
                <div 
                  className={`flex-1 p-5 md:p-6 rounded-2xl border transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500/5 border-emerald-500/30' :
                    isCurrent ? 'bg-blue-500/5 border-blue-500/50' :
                    'bg-[#1a1b26] border-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-500 tracking-wider">STEP {index + 1}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${diffStyle}`}>
                      {res.difficulty}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        ▶ Start Here
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{res.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{res.description}</p>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    {isCompleted && (
                      <span className="flex items-center text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Completed
                      </span>
                    )}
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                      ▲ {res.upvoteCount || 0}
                    </span>
                    <button 
                      onClick={() => onPreview(res)}
                      className="ml-auto flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View Resource <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;
