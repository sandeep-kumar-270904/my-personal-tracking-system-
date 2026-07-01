import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false); // Re-show on new offline event
    };
    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 w-full p-2 flex items-center justify-between z-50 sticky top-0 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-amber-500 text-sm font-medium px-4">
        <WifiOff className="w-4 h-4" />
        You're offline — showing your last synced data. Changes will be saved locally.
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-amber-500/20 rounded-full text-amber-500/70 hover:text-amber-500 transition-colors mr-2"
        aria-label="Dismiss offline banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default OfflineBanner;
