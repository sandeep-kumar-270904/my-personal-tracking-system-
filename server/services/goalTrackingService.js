const Goal = require('../models/Goal');
const GoalProgressEntry = require('../models/GoalProgressEntry');

/**
 * Automatically logs progress for goals linked to a specific module.
 * @param {string} userId - ID of the user
 * @param {string} linkedModule - 'applications', 'dsa_tracker', 'networking', 'contests', 'resume_tailoring', 'interviews'
 * @param {number} amount - Usually 1
 * @param {string} sourceRefId - ID of the created document (e.g., Application ID)
 * @param {Date} date - Optional, defaults to now. Overrides logged_at.
 */
const recordGoalProgress = async (userId, linkedModule, amount = 1, sourceRefId = null, date = new Date()) => {
  try {
    // Only process if it's a known linked module
    const validModules = ['applications', 'dsa_tracker', 'networking', 'contests', 'resume_tailoring', 'interviews'];
    if (!validModules.includes(linkedModule)) {
      return;
    }

    // Find active hybrid/auto goals that match this module
    const linkedGoals = await Goal.find({
      user_id: userId,
      linked_module: linkedModule,
      status: 'active',
      tracking_mode: { $in: ['auto', 'hybrid'] }
    });

    for (const goal of linkedGoals) {
      await GoalProgressEntry.create({
        goal_id: goal._id,
        user_id: userId,
        amount,
        source: 'auto',
        source_ref_id: sourceRefId,
        logged_at: date
      });
    }
  } catch (error) {
    console.error(`Error in recordGoalProgress for ${linkedModule}:`, error);
  }
};

/**
 * Removes auto-logged progress if the underlying source record was deleted.
 */
const removeGoalProgress = async (userId, linkedModule, sourceRefId) => {
  try {
    const linkedGoals = await Goal.find({
      user_id: userId,
      linked_module: linkedModule
    });

    for (const goal of linkedGoals) {
      await GoalProgressEntry.deleteMany({
        goal_id: goal._id,
        user_id: userId,
        source: 'auto',
        source_ref_id: sourceRefId
      });
    }
  } catch (error) {
    console.error(`Error in removeGoalProgress for ${linkedModule}:`, error);
  }
};

module.exports = {
  recordGoalProgress,
  removeGoalProgress
};
