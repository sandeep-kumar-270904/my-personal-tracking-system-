import React from 'react';

// A simple SVG sparkline for the forgetting curve without needing recharts
const ForgettingCurveSparkline = ({ decayScore, lastReviewedDaysAgo }) => {
  // Generate points for an exponential decay curve
  // y = e^(-k*t)
  const points = [];
  const width = 100;
  const height = 30;
  const numPoints = 20;
  
  // Calculate a mock decay constant based on the score
  const k = Math.max(0.05, decayScore / 100);

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width;
    const t = (i / numPoints) * 10; // 0 to 10 scale
    const y = Math.exp(-k * t) * height;
    points.push(`${x},${height - y}`);
  }

  const pointString = points.join(' ');
  const isHighDecay = decayScore > 50;

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Retention</span>
        <span className={`text-[10px] font-bold ${isHighDecay ? 'text-red-400' : 'text-gray-400'}`}>
          {isHighDecay ? 'Review Needed' : 'Stable'}
        </span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={isHighDecay ? '#ef4444' : '#6366f1'}
          strokeWidth="2"
          points={pointString}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current position dot */}
        <circle 
          cx={width} 
          cy={height - (Math.exp(-k * 10) * height)} 
          r="3" 
          fill={isHighDecay ? '#ef4444' : '#6366f1'} 
        />
      </svg>
    </div>
  );
};

export default ForgettingCurveSparkline;
