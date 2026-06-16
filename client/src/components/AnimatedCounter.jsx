import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 1 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let isMounted = true;
    const finalValue = parseInt(value, 10);
    
    // Fallback if not a number
    if (isNaN(finalValue)) {
      setDisplayValue(value);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      if (isMounted) {
        setDisplayValue(Math.floor(progress * finalValue));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setDisplayValue(finalValue); // Ensure exact final value
        }
      }
    };

    window.requestAnimationFrame(step);

    return () => {
      isMounted = false;
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

export default AnimatedCounter;
