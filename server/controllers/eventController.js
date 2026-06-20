const Event = require('../models/Event');
const User = require('../models/User');
const { pushEventToGoogle, deleteEventFromGoogle, getAuthUrl, exchangeCode, pullEventsFromGoogle } = require('../utils/googleSync');

const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0 };
const BUFFER_MINUTES = 90;

const checkForConflicts = (newEvent, existingEvents) => {
  if (newEvent.is_all_day) return { isConflict: false, conflicts: [] };

  const startD = new Date(newEvent.date);
  if (newEvent.start_time) {
    const [h, m] = newEvent.start_time.split(':').map(Number);
    startD.setHours(h, m, 0, 0);
  }
  
  const duration = newEvent.end_time ? 0 : (DEFAULT_DURATIONS[newEvent.type] || 60);
  const endD = new Date(startD.getTime());
  if (newEvent.end_time) {
    const [h, m] = newEvent.end_time.split(':').map(Number);
    endD.setHours(h, m, 0, 0);
  } else {
    endD.setMinutes(endD.getMinutes() + duration);
  }

  const conflicts = [];
  
  for (const event of existingEvents) {
    if (event.is_all_day || event.status === 'cancelled') continue;
    if (String(event._id) === String(newEvent._id)) continue;

    const evStart = new Date(event.date);
    if (event.start_time) {
      const [h, m] = event.start_time.split(':').map(Number);
      evStart.setHours(h, m, 0, 0);
    }
    
    const evDuration = event.end_time ? 0 : (DEFAULT_DURATIONS[event.type] || 60);
    const evEnd = new Date(evStart.getTime());
    if (event.end_time) {
      const [h, m] = event.end_time.split(':').map(Number);
      evEnd.setHours(h, m, 0, 0);
    } else {
      evEnd.setMinutes(evEnd.getMinutes() + evDuration);
    }

    // 1. Hard Conflict
    if (startD < evEnd && evStart < endD) {
      conflicts.push({
        type: 'hard',
        eventId: event._id,
        title: event.title,
        start_time: event.start_time,
        message: `Time overlap with "${event.title}" (${event.start_time || 'all day'})`
      });
      continue;
    }

    // 2. Soft Conflict (Tight gap at different locations)
    const diffMinutes1 = Math.abs(startD.getTime() - evEnd.getTime()) / 60000;
    const diffMinutes2 = Math.abs(evStart.getTime() - endD.getTime()) / 60000;
    const minGap = Math.min(diffMinutes1, diffMinutes2);

    if (minGap < BUFFER_MINUTES) {
      if (newEvent.location && event.location && newEvent.location.trim().toLowerCase() !== event.location.trim().toLowerCase()) {
        conflicts.push({
          type: 'soft',
          eventId: event._id,
          title: event.title,
          message: `Tight gap (${Math.round(minGap)} mins) between this and "${event.title}", different locations ("${newEvent.location}" vs "${event.location}").`
        });
      }
    }
  }

  return {
    isConflict: conflicts.length > 0,
    conflicts
  };
};

exports.getEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { user: req.user._id };
    
    if (start && end) {
      query.date = { 
        $gte: new Date(start), 
        $lte: new Date(end) 
      };
    }
    
    const events = await Event.find(query).sort({ date: 1, start_time: 1 });

    // Batch resolve prep readiness signals for interviews
    const interviewEvents = events.filter(e => e.type === 'interview' && e.source_ref_id);
    if (interviewEvents.length > 0) {
      const interviewIds = interviewEvents.map(e => e.source_ref_id);
      
      const InterviewPrepChecklist = require('../models/InterviewPrepChecklist');
      const Interview = require('../models/Interview');
      
      const [completedChecklists, interviewRecords] = await Promise.all([
        InterviewPrepChecklist.find({ interviewId: { $in: interviewIds }, isCompleted: true }),
        Interview.find({ _id: { $in: interviewIds } })
      ]);
      
      const completedIds = new Set(completedChecklists.map(c => c.interviewId.toString()));
      const prepRecordsMap = new Map(interviewRecords.map(i => [
        i._id.toString(), 
        (i.prepBrief && i.prepBrief.trim().length > 0) || (i.prepNotes && i.prepNotes.trim().length > 0)
      ]));

      const mappedEvents = events.map(e => {
        if (e.type === 'interview' && e.source_ref_id) {
          const idStr = e.source_ref_id.toString();
          const hasChecklist = completedIds.has(idStr);
          const hasNotes = prepRecordsMap.get(idStr) || false;
          return {
            ...e.toObject(),
            hasPrep: hasChecklist || hasNotes
          };
        }
        return e.toObject();
      });
      return res.json(mappedEvents);
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { 
      title, 
      date, 
      start_time, 
      end_time, 
      is_all_day, 
      type = 'event', 
      description, 
      location, 
      reminder_minutes_before,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
      end_date,
      ignoreConflict
    } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }

    // Validation: Multi-day spans are only valid for type in ["application_deadline", "event"]
    if (end_date && !['application_deadline', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Multi-day spans are only valid for applications and custom events.' });
    }

    // Time validation
    if (!is_all_day && start_time && end_time) {
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      if (eh < sh || (eh === sh && em <= sm)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
    }

    // Recurrence validation
    if (is_recurring) {
      if (!recurrence_pattern || recurrence_pattern === 'none') {
        return res.status(400).json({ message: 'Recurrence pattern is required for recurring events' });
      }
      if (!recurrence_end_date) {
        return res.status(400).json({ message: 'Recurrence end date is required for recurring events' });
      }
      if (new Date(recurrence_end_date) <= new Date(date)) {
        return res.status(400).json({ message: 'Recurrence end date must be after the start date' });
      }
    }

    // Conflict detection
    if (!ignoreConflict) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);

      const existingEvents = await Event.find({
        user: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      });

      const tempEvent = { date, start_time, end_time, is_all_day, type, location };
      const { isConflict, conflicts } = checkForConflicts(tempEvent, existingEvents);
      
      const hasHardConflict = conflicts.some(c => c.type === 'hard');
      if (hasHardConflict) {
        return res.status(200).json({ hasConflict: true, conflicts });
      }
    }

    // Create the base (parent) event
    const parentEvent = await Event.create({
      user: req.user._id,
      title,
      date: new Date(date),
      start_time: is_all_day ? '' : start_time,
      end_time: is_all_day ? '' : end_time,
      is_all_day: !!is_all_day,
      type,
      description,
      location,
      reminder_minutes_before: reminder_minutes_before || null,
      source: 'manual',
      source_ref_id: null,
      status: 'upcoming',
      is_recurring: !!is_recurring,
      recurrence_pattern: is_recurring ? recurrence_pattern : 'none',
      recurrence_end_date: is_recurring ? new Date(recurrence_end_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      parent_event_id: null
    });

    // Push to Google Calendar in background
    pushEventToGoogle(req.user._id, parentEvent);

    // Generate and save child events if recurring
    if (is_recurring) {
      const instances = [];
      const start = new Date(date);
      const end = new Date(recurrence_end_date);
      
      let current = new Date(start);
      let count = 0;

      while (count < 52) {
        if (recurrence_pattern === 'daily') {
          current.setDate(current.getDate() + 1);
        } else if (recurrence_pattern === 'weekly') {
          current.setDate(current.getDate() + 7);
        } else if (recurrence_pattern === 'biweekly') {
          current.setDate(current.getDate() + 14);
        } else if (recurrence_pattern === 'monthly') {
          current.setMonth(current.getMonth() + 1);
        } else {
          break;
        }

        if (current > end) break;

        instances.push({
          user: req.user._id,
          title,
          date: new Date(current),
          start_time: is_all_day ? '' : start_time,
          end_time: is_all_day ? '' : end_time,
          is_all_day: !!is_all_day,
          type,
          description,
          location,
          reminder_minutes_before: reminder_minutes_before || null,
          source: 'manual',
          source_ref_id: null,
          status: 'upcoming',
          is_recurring: true,
          recurrence_pattern,
          recurrence_end_date: new Date(recurrence_end_date),
          end_date: end_date ? new Date(end_date) : null,
          parent_event_id: parentEvent._id,
          reminderSent: false
        });
        count++;
      }

      if (count >= 52) {
        await parentEvent.deleteOne();
        return res.status(400).json({ message: 'Recurrence series exceeds the limit of 52 occurrences. Please choose a closer end date.' });
      }

      if (instances.length > 0) {
        const createdInstances = await Event.insertMany(instances);
        // Push instances to Google Calendar too
        for (const inst of createdInstances) {
          pushEventToGoogle(req.user._id, inst);
        }
      }
    }

    res.status(201).json(parentEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { recurrenceEditMode = 'single', ignoreConflict, ...updateData } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Title validation if updating title
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
      }
      if (updateData.title.length > 100) {
        return res.status(400).json({ message: 'Title must be 100 characters or less' });
      }
    }

    // Validation: Multi-day spans
    const type = updateData.type !== undefined ? updateData.type : event.type;
    const end_date = updateData.end_date !== undefined ? updateData.end_date : event.end_date;
    if (end_date && !['application_deadline', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Multi-day spans are only valid for applications and custom events.' });
    }

    // Time validation if updating times
    const start_time = updateData.start_time !== undefined ? updateData.start_time : event.start_time;
    const end_time = updateData.end_time !== undefined ? updateData.end_time : event.end_time;
    const is_all_day = updateData.is_all_day !== undefined ? updateData.is_all_day : event.is_all_day;
    const date = updateData.date !== undefined ? updateData.date : event.date;

    if (!is_all_day && start_time && end_time) {
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      if (eh < sh || (eh === sh && em <= sm)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
    }

    // Conflict detection
    if (!ignoreConflict) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);

      const existingEvents = await Event.find({
        user: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      });

      const tempEvent = { _id: event._id, date, start_time, end_time, is_all_day, type, location: updateData.location !== undefined ? updateData.location : event.location };
      const { isConflict, conflicts } = checkForConflicts(tempEvent, existingEvents);
      
      const hasHardConflict = conflicts.some(c => c.type === 'hard');
      if (hasHardConflict) {
        return res.status(200).json({ hasConflict: true, conflicts });
      }
    }

    // Handle updates based on recurrenceEditMode
    if (event.is_recurring && recurrenceEditMode === 'future') {
      const parentId = event.parent_event_id || event._id;

      const filter = {
        $and: [
          { user: req.user._id },
          { date: { $gte: event.date } },
          {
            $or: [
              { _id: parentId },
              { parent_event_id: parentId }
            ]
          }
        ]
      };

      const fieldsToUpdate = {};
      const fields = ['title', 'description', 'location', 'start_time', 'end_time', 'is_all_day', 'type', 'status', 'reminder_minutes_before', 'end_date'];
      
      fields.forEach(field => {
        if (updateData[field] !== undefined) {
          fieldsToUpdate[field] = updateData[field];
        }
      });

      if (updateData.reminder_minutes_before !== undefined) {
        fieldsToUpdate.reminderSent = false;
      }

      await Event.updateMany(filter, { $set: fieldsToUpdate });
      
      // Fetch and push all updated events in series
      const updatedEvents = await Event.find(filter);
      for (const ev of updatedEvents) {
        pushEventToGoogle(req.user._id, ev);
      }
      
      const updatedEvent = await Event.findById(id);
      return res.json(updatedEvent);
    } else {
      if (event.is_recurring) {
        event.is_recurring = false;
        event.recurrence_pattern = 'none';
        event.recurrence_end_date = null;
        event.parent_event_id = null;
      }

      Object.keys(updateData).forEach(key => {
        event[key] = updateData[key];
      });

      if (updateData.reminder_minutes_before !== undefined) {
        event.reminderSent = false;
      }

      const updatedEvent = await event.save();
      
      // Push single event
      pushEventToGoogle(req.user._id, updatedEvent);

      res.json(updatedEvent);
    }
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const recurrenceEditMode = req.query.recurrenceEditMode || 'single';

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (event.is_recurring && recurrenceEditMode === 'future') {
      const parentId = event.parent_event_id || event._id;

      const filter = {
        $and: [
          { user: req.user._id },
          { date: { $gte: event.date } },
          {
            $or: [
              { _id: parentId },
              { parent_event_id: parentId }
            ]
          }
        ]
      };

      const eventsToDelete = await Event.find(filter);
      for (const ev of eventsToDelete) {
        deleteEventFromGoogle(req.user._id, ev.googleEventId);
      }

      await Event.deleteMany(filter);
      res.json({ message: 'Series events removed' });
    } else {
      deleteEventFromGoogle(req.user._id, event.googleEventId);
      await event.deleteOne();
      res.json({ message: 'Event removed' });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.scheduleResumeRevamp = async (req, res) => {
  try {
    const { resumeName } = req.body;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const event = await Event.create({
      user: req.user._id,
      title: `Resume Revamp: ${resumeName || 'General'}`,
      date: targetDate,
      is_all_day: true,
      type: 'event',
      description: 'Your resume health is declining or stale. Take some time to revamp it.',
      reminder_minutes_before: 1440,
      reminderSent: false,
      source: 'manual'
    });
    
    pushEventToGoogle(req.user._id, event);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Google Calendar Sync Enpoints Implementation
exports.getGoogleAuthUrl = async (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error in getGoogleAuthUrl:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.connectGoogleCalendar = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const tokens = await exchangeCode(code);
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.googleCalendarSync = {
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.googleCalendarSync.refreshToken || 'mock_refresh_token',
      expiryDate: tokens.expiry_date || (Date.now() + 3600000),
      syncDirection: 'both',
      calendarId: '',
      googleCalendarId: 'primary',
      lastSyncTime: new Date()
    };

    const calendarId = await getOrCreateStudentTrackerCalendar(tokens.access_token);
    user.googleCalendarSync.calendarId = calendarId;
    await user.save();

    // Pull events from google in background
    pullEventsFromGoogle(user).catch(err => console.error('Initial pull failed:', err));

    res.json({
      message: 'Google Calendar connected successfully',
      settings: user.googleCalendarSync
    });
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    res.status(500).json({ message: 'Connection failed', error: error.message });
  }
};

exports.updateGoogleSyncSettings = async (req, res) => {
  try {
    const { syncDirection, googleCalendarId } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldDirection = user.googleCalendarSync.syncDirection;
    user.googleCalendarSync.syncDirection = syncDirection;
    user.googleCalendarSync.googleCalendarId = googleCalendarId || 'primary';
    await user.save();

    if (syncDirection === 'pull' || syncDirection === 'both') {
      pullEventsFromGoogle(user).catch(err => console.error('Pull sync failed:', err));
    }
    
    if (syncDirection === 'push') {
      // Clear previous pulled google events
      await Event.deleteMany({ user: user._id, source: 'google' });
    }

    res.json({
      message: 'Sync preferences updated successfully',
      settings: user.googleCalendarSync
    });
  } catch (error) {
    console.error('Error updating Google sync settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.disconnectGoogleCalendar = async (req, res) => {
  try {
    const removeEvents = req.query.removeEvents === 'true';
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (removeEvents && user.googleCalendarSync?.connected) {
      // Delete pushed manual events from Google Calendar
      const events = await Event.find({ user: user._id, googleEventId: { $ne: null }, source: 'manual' });
      for (const ev of events) {
        await deleteEventFromGoogle(user._id, ev.googleEventId);
        ev.googleEventId = null;
        await ev.save();
      }
    }

    // Delete pulled google events from our DB
    await Event.deleteMany({ user: user._id, source: 'google' });

    // Reset settings
    user.googleCalendarSync = {
      connected: false,
      accessToken: '',
      refreshToken: '',
      expiryDate: 0,
      syncDirection: 'both',
      calendarId: '',
      googleCalendarId: 'primary'
    };
    await user.save();

    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.triggerGoogleSync = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleCalendarSync?.connected) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    await pullEventsFromGoogle(user);
    res.json({ message: 'Google Calendar sync completed successfully' });
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    res.status(500).json({ message: 'Sync failed' });
  }
};

// Pure ICS Formatter Helpers
const formatICSAllDayDate = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

const formatICSDate = (date, timeStr) => {
  const d = new Date(date);
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

exports.exportICS = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//StudentTracker//Placement Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    const addEventToICS = (ev) => {
      let evContent = 'BEGIN:VEVENT\r\n';
      evContent += `UID:${ev._id}@studenttracker.com\r\n`;
      evContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      evContent += `SUMMARY:${ev.title.replace(/[,;]/g, '\\$&')}\r\n`;
      if (ev.description) {
        evContent += `DESCRIPTION:${ev.description.replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&')}\r\n`;
      }
      if (ev.location) {
        evContent += `LOCATION:${ev.location.replace(/[,;]/g, '\\$&')}\r\n`;
      }

      if (ev.is_all_day) {
        const startStr = formatICSAllDayDate(ev.date);
        const endDay = ev.end_date ? new Date(ev.end_date) : new Date(ev.date);
        endDay.setDate(endDay.getDate() + 1);
        const endStr = formatICSAllDayDate(endDay);
        evContent += `DTSTART;VALUE=DATE:${startStr}\r\n`;
        evContent += `DTEND;VALUE=DATE:${endStr}\r\n`;
      } else {
        const startStr = formatICSDate(ev.date, ev.start_time);
        let endStr;
        if (ev.end_time) {
          endStr = formatICSDate(ev.date, ev.end_time);
        } else {
          const startD = new Date(ev.date);
          if (ev.start_time) {
            const [h, m] = ev.start_time.split(':').map(Number);
            startD.setHours(h, m, 0, 0);
          }
          const endD = new Date(startD.getTime() + 60 * 60000);
          endStr = endD.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        }
        evContent += `DTSTART:${startStr}\r\n`;
        evContent += `DTEND:${endStr}\r\n`;
      }

      if (ev.is_recurring && ev.recurrence_pattern && ev.recurrence_pattern !== 'none') {
        let rrule = 'RRULE:FREQ=';
        if (ev.recurrence_pattern === 'daily') rrule += 'DAILY';
        else if (ev.recurrence_pattern === 'weekly') rrule += 'WEEKLY';
        else if (ev.recurrence_pattern === 'biweekly') rrule += 'WEEKLY;INTERVAL=2';
        else if (ev.recurrence_pattern === 'monthly') rrule += 'MONTHLY';
        
        if (ev.recurrence_end_date) {
          rrule += `;UNTIL=${formatICSAllDayDate(ev.recurrence_end_date)}`;
        }
        evContent += rrule + '\r\n';
      }

      evContent += 'END:VEVENT\r\n';
      return evContent;
    };

    icsContent += addEventToICS(event);
    icsContent += 'END:VCALENDAR\r\n';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="event_${event._id}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Error exporting ICS:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.findFreeSlots = async (req, res) => {
  try {
    const { dateStart, dateEnd, duration = 60 } = req.query;
    if (!dateStart || !dateEnd) {
      return res.status(400).json({ message: 'dateStart and dateEnd are required' });
    }

    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    const dur = Number(duration);

    const events = await Event.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    });

    const freeSlots = [];
    let currentDay = new Date(start);
    currentDay.setHours(0,0,0,0);

    while (currentDay <= end && freeSlots.length < 3) {
      let slotTime = new Date(currentDay);
      slotTime.setHours(9, 0, 0, 0); // 9:00 AM

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(19, 0, 0, 0); // 7:00 PM

      while (slotTime.getTime() + dur * 60000 <= dayEnd.getTime() && freeSlots.length < 3) {
        const slotEnd = new Date(slotTime.getTime() + dur * 60000);
        
        let hasConflict = false;
        for (const event of events) {
          if (event.is_all_day) continue;
          
          const evStart = new Date(event.date);
          if (event.start_time) {
            const [h, m] = event.start_time.split(':').map(Number);
            evStart.setHours(h, m, 0, 0);
          }
          
          const evDuration = event.end_time ? 0 : (DEFAULT_DURATIONS[event.type] || 60);
          const evEnd = new Date(evStart.getTime());
          if (event.end_time) {
            const [h, m] = event.end_time.split(':').map(Number);
            evEnd.setHours(h, m, 0, 0);
          } else {
            evEnd.setMinutes(evEnd.getMinutes() + evDuration);
          }

          if (slotTime < evEnd && evStart < slotEnd) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          const pad = (n) => String(n).padStart(2, '0');
          freeSlots.push({
            date: new Date(currentDay),
            start_time: `${pad(slotTime.getHours())}:${pad(slotTime.getMinutes())}`,
            end_time: `${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`
          });
        }

        slotTime.setMinutes(slotTime.getMinutes() + 30);
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    res.json(freeSlots);
  } catch (error) {
    console.error('Error finding free slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
