import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, heading, subtext, ctaText, ctaLink, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center border border-white/5 bg-[#0a0a0f]/50 rounded-3xl w-full glass-card"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {Icon && <Icon className="w-12 h-12 text-slate-500" />}
      </div>
      
      <h3 className="text-[18px] font-bold text-white mb-2">{heading}</h3>
      <p className="text-[14px] text-slate-400 mb-6 max-w-md leading-relaxed">{subtext}</p>
      
      {ctaLink ? (
        <Link 
          to={ctaLink}
          className="btn-primary px-6 py-2.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          {ctaText}
        </Link>
      ) : onClick ? (
        <button 
          onClick={onClick}
          className="btn-primary px-6 py-2.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          {ctaText}
        </button>
      ) : null}
    </motion.div>
  );
};

export default EmptyState;
