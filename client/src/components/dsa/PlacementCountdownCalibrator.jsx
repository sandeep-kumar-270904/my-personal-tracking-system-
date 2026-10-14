import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PlacementCountdownCalibrator = ({ targetDate = new Date(Date.now() + 86400000 * 60) }) => {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const diff = targetDate.getTime() - Date.now();
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [targetDate]);

  const totalDays = 90; // Typical 3 month prep
  const progressPercent = Math.max(0, Math.min(100, 100 - (daysLeft / totalDays) * 100));

  const isCritical = daysLeft < 30;

  return (
    <div className={`border rounded-2xl p-6 mb-8 relative overflow-hidden transition-colors ${isCritical ? 'bg-rose-900/10 border-rose-500/30' : 'bg-gray-900 border-gray-800'}`}>
      {isCritical && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 animate-gradient-x"></div>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isCritical ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {daysLeft} Days Until Placement Season
            </h2>
            <p className={`text-sm font-medium ${isCritical ? 'text-rose-400' : 'text-gray-400'}`}>
              {isCritical ? 'Crunch time. Focus entirely on weak high-frequency patterns.' : 'You have time. Build a solid foundation.'}
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-gray-500">Prep Progress</span>
            <span className={isCritical ? 'text-rose-400' : 'text-indigo-400'}>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-indigo-500'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementCountdownCalibrator;
