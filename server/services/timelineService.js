const ApplicationTimeline = require('../models/ApplicationTimeline');

const logTimelineEvent = async (applicationId, event, previousStatus, newStatus, note = '') => {
  try {
    const log = new ApplicationTimeline({
      applicationId,
      event,
      previousStatus,
      newStatus,
      note
    });
    await log.save();
  } catch (error) {
    console.error('Failed to log timeline event:', error);
  }
};

module.exports = {
  logTimelineEvent
};
