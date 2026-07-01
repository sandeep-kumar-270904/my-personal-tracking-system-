const Event = require('../models/Event');
const { pushEventToGoogle, deleteEventFromGoogle } = require('./googleSync');

const pad = (n) => String(n).padStart(2, '0');

const formatTime = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return '';
  const d = new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const syncEventFromSource = async (sourceType, record) => {
  try {
    const userId = record.userId || record.user;
    if (!userId) {
      console.error(`[calendarSync] No user found on ${sourceType} record:`, record._id);
      return;
    }

    let eventData = {
      user: userId,
      source: `auto_${sourceType}`,
      source_ref_id: record._id,
    };

    if (sourceType === 'interview') {
      if (!record.scheduledAt) return; // Can't sync without date
      const scheduledAt = new Date(record.scheduledAt);
      const duration = record.durationMinutes || 60;
      const end = new Date(scheduledAt.getTime() + duration * 60000);

      eventData.title = `${record.company} — ${record.round || 'Interview'}`;
      eventData.date = scheduledAt;
      eventData.start_time = formatTime(scheduledAt);
      eventData.end_time = formatTime(end);
      eventData.is_all_day = false;
      eventData.type = 'interview';
      eventData.location = record.address || record.platform || record.meetingUrl || '';
      
      let desc = `Role: ${record.role || ''}\nRound Type: ${record.roundType || ''}`;
      if (record.meetingUrl) desc += `\nMeeting Link: ${record.meetingUrl}`;
      if (record.notes) desc += `\nNotes: ${record.notes}`;
      eventData.description = desc;

      // Status mapping
      if (record.status === 'CANCELLED' || record.outcome === 'CANCELLED') {
        eventData.status = 'cancelled';
      } else if (record.outcome && record.outcome !== 'PENDING' && record.outcome !== 'AWAITING_RESULT') {
        eventData.status = 'completed';
      } else {
        eventData.status = 'upcoming';
      }
      
      eventData.reminder_minutes_before = 60; // Default 1 hour before
    } else if (sourceType === 'application') {
      if (!record.deadline) {
        // If application has no deadline but we are updating, remove event if it exists
        await Event.deleteOne({ source: 'auto_application', source_ref_id: record._id });
        return;
      }
      const deadline = new Date(record.deadline);
      eventData.title = `${record.company} — Application Deadline`;
      eventData.date = deadline;
      eventData.is_all_day = true;
      eventData.type = 'application_deadline';
      eventData.location = record.link || '';
      eventData.description = `Role: ${record.role || ''}\nStatus: ${record.status || ''}\nNotes: ${record.notes || ''}`;
      eventData.status = 'upcoming';
      eventData.reminder_minutes_before = 1440; // Default 1 day before
    } else if (sourceType === 'offer') {
      if (!record.decision_deadline) {
        await Event.deleteOne({ source: 'auto_offer', source_ref_id: record._id });
        return;
      }
      const deadline = new Date(record.decision_deadline);
      eventData.title = `${record.company_name} — Offer Deadline`;
      eventData.date = deadline;
      eventData.is_all_day = true;
      eventData.type = 'offer_deadline';
      eventData.location = '';
      
      const base = record.base_salary || record.ctc_annual || 0;
      eventData.description = `Role: ${record.role_title || ''}\nCTC Offered: ${base}\nStatus: ${record.status || ''}\nNotes: ${record.notes || ''}`;
      
      // Map Offer status to Event status
      if (['accepted', 'declined', 'withdrawn_by_company'].includes(record.status)) {
        eventData.status = 'completed';
      } else if (record.status === 'expired') {
        eventData.status = 'missed';
      } else {
        eventData.status = 'upcoming';
      }

      eventData.reminder_minutes_before = 1440; // Default 1 day before, escalated cron handles the rest
    } else {
      return;
    }

    // Upsert the event
    const upserted = await Event.findOneAndUpdate(
      { source: `auto_${sourceType}`, source_ref_id: record._id },
      { $set: eventData },
      { upsert: true, new: true }
    );

    if (upserted) {
      await pushEventToGoogle(userId, upserted);
    }
  } catch (error) {
    console.error(`[calendarSync] Error syncing ${sourceType} event:`, error);
  }
};

const removeEventForSource = async (sourceType, sourceRefId) => {
  try {
    const eventToDelete = await Event.findOne({ source: `auto_${sourceType}`, source_ref_id: sourceRefId });
    if (eventToDelete) {
      if (eventToDelete.googleEventId) {
        await deleteEventFromGoogle(eventToDelete.user, eventToDelete.googleEventId);
      }
      await eventToDelete.deleteOne();
    }
  } catch (error) {
    console.error(`[calendarSync] Error removing ${sourceType} event:`, error);
  }
};

module.exports = {
  syncEventFromSource,
  removeEventForSource,
};
