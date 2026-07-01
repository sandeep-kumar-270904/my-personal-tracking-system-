/**
 * Spaced Repetition Utility (Modified SM-2)
 */

const CONFIDENCE_LEVELS = {
  SHAKY: 1,
  OKAY: 2,
  SOLID: 3,
  MASTERED: 4
};

const INITIAL_INTERVALS = {
  SHAKY: 1,
  OKAY: 3,
  SOLID: 7,
  MASTERED: 14
};

/**
 * Calculates the next review date and interval based on confidence level changes
 * @param {string} oldConfidence - The previous confidence level
 * @param {string} newConfidence - The new confidence level
 * @param {number} currentInterval - The current interval in days
 * @returns {Object} { nextReviewDue: Date, newInterval: number, isRegression: boolean }
 */
const calculateNextReview = (oldConfidence, newConfidence, currentInterval) => {
  const oldScore = CONFIDENCE_LEVELS[oldConfidence] || 2;
  const newScore = CONFIDENCE_LEVELS[newConfidence] || 2;
  
  let newInterval;
  let isRegression = false;

  if (!currentInterval) {
    // First time review
    newInterval = INITIAL_INTERVALS[newConfidence] || 3;
  } else {
    if (newScore < oldScore) {
      // Regression
      newInterval = 1;
      isRegression = true;
    } else if (newScore > oldScore) {
      // Improvement
      newInterval = Math.round(currentInterval * 1.5);
    } else {
      // Same
      newInterval = Math.round(currentInterval * 1.2);
    }
  }

  // Cap interval at 90 days max
  if (newInterval > 90) newInterval = 90;

  const nextReviewDue = new Date();
  nextReviewDue.setDate(nextReviewDue.getDate() + newInterval);
  // Set to start of day for consistency
  nextReviewDue.setHours(0, 0, 0, 0);

  return {
    nextReviewDue,
    newInterval,
    isRegression
  };
};

module.exports = {
  calculateNextReview,
  CONFIDENCE_LEVELS,
  INITIAL_INTERVALS
};
