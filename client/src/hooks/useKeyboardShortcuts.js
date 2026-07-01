import { useEffect, useState } from 'react';

const useKeyboardShortcuts = (handlers) => {
  const [keysPressed, setKeysPressed] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      
      setKeysPressed((prev) => {
        const newKeys = { ...prev, [key]: true };
        
        // Sequence checking (e.g. 'n' then 'a')
        if (newKeys['n'] && key === 'a') {
          e.preventDefault();
          handlers.onAddApplication?.();
          return {}; // clear keys
        }
        if (newKeys['n'] && key === 'd') {
          e.preventDefault();
          handlers.onLogDSA?.();
          return {};
        }
        if (newKeys['n'] && key === 'i') {
          e.preventDefault();
          handlers.onAddInterview?.();
          return {};
        }

        // Single keys
        if (key === 'g' && !newKeys['n']) {
          e.preventDefault();
          handlers.onNavigateGoals?.();
        }
        if (key === 'c' && !newKeys['n']) {
          e.preventDefault();
          handlers.onNavigateContests?.();
        }
        if (key === '/') {
          e.preventDefault();
          handlers.onFocusSearch?.();
        }

        return newKeys;
      });
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setKeysPressed((prev) => {
        const newKeys = { ...prev };
        delete newKeys[key];
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlers]);
};

export default useKeyboardShortcuts;
