const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Event = require('../models/Event');

const pad = (n) => String(n).padStart(2, '0');

const getOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
    'http://localhost:5173/settings'
  );
};

const getAuthUrl = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    // If not configured, we allow mock login
    return 'http://localhost:5173/settings?code=mock_code';
  }
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
};

const exchangeCode = async (code) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || code === 'mock_code') {
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expiry_date: Date.now() + 3600000
    };
  }
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

const getValidAccessToken = async (user) => {
  if (!user.googleCalendarSync || !user.googleCalendarSync.connected) {
    return null;
  }
  const syncInfo = user.googleCalendarSync;
  if (syncInfo.refreshToken === 'mock_refresh_token') {
    return 'mock_access_token';
  }

  // Check if expired (or within 5 minutes of expiry)
  const isExpired = Date.now() >= (syncInfo.expiryDate - 300000);
  if (!isExpired) {
    return syncInfo.accessToken;
  }

  // Refresh token
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: syncInfo.refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    if (!res.ok) {
      throw new Error(`Token refresh failed: ${await res.text()}`);
    }

    const data = await res.json();
    const newExpiry = Date.now() + (data.expires_in * 1000);
    
    user.googleCalendarSync.accessToken = data.access_token;
    user.googleCalendarSync.expiryDate = newExpiry;
    await user.save();

    return data.access_token;
  } catch (error) {
    console.error('[Google Sync] Error refreshing access token:', error);
    return null;
  }
};

const getOrCreateStudentTrackerCalendar = async (accessToken) => {
  if (accessToken === 'mock_access_token') {
    return 'mock_secondary_calendar_id';
  }
  try {
    // 1. List calendar items
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!listRes.ok) {
      throw new Error(`Failed to list calendars: ${await listRes.text()}`);
    }

    const listData = await listRes.json();
    const existing = listData.items?.find(c => c.summary === 'StudentTracker');
    if (existing) return existing.id;

    // 2. Create secondary calendar
    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ summary: 'StudentTracker' })
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create calendar: ${await createRes.text()}`);
    }

    const createData = await createRes.json();
    return createData.id;
  } catch (error) {
    console.error('[Google Sync] Error in getOrCreateStudentTrackerCalendar:', error);
    return 'primary'; // Fallback to primary if secondary fails
  }
};

const pushEventToGoogle = async (userId, event) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleCalendarSync?.connected) return;
    if (user.googleCalendarSync.syncDirection === 'pull') return; // Pull-only direction

    const accessToken = await getValidAccessToken(user);
    if (!accessToken) return;

    if (accessToken === 'mock_access_token') {
      if (!event.googleEventId) {
        event.googleEventId = `mock_google_id_${Math.random().toString(36).substr(2, 9)}`;
        await event.save();
      }
      return;
    }

    const calendarId = user.googleCalendarSync.calendarId || 'primary';
    
    const startObj = {};
    const endObj = {};
    
    if (event.is_all_day) {
      const startStr = new Date(event.date).toISOString().split('T')[0];
      startObj.date = startStr;
      
      const endDay = event.end_date ? new Date(event.end_date) : new Date(event.date);
      const endDayPlusOne = new Date(endDay.getTime() + 24 * 60 * 60 * 1000);
      endObj.date = endDayPlusOne.toISOString().split('T')[0];
    } else {
      const startD = new Date(event.date);
      if (event.start_time) {
        const [h, m] = event.start_time.split(':').map(Number);
        startD.setHours(h, m, 0, 0);
      }
      startObj.dateTime = startD.toISOString();

      const endD = new Date(event.date);
      if (event.end_time) {
        const [h, m] = event.end_time.split(':').map(Number);
        endD.setHours(h, m, 0, 0);
      } else {
        endD.setHours(startD.getHours() + 1);
      }
      endObj.dateTime = endD.toISOString();
    }

    const body = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: startObj,
      end: endObj
    };

    let res;
    if (event.googleEventId) {
      res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.googleEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (!event.googleEventId) {
        event.googleEventId = data.id;
        await event.save();
      }
    } else {
      console.error('[Google Sync] Failed to push event:', await res.text());
    }
  } catch (error) {
    console.error('[Google Sync] pushEventToGoogle error:', error);
  }
};

const deleteEventFromGoogle = async (userId, googleEventId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleCalendarSync?.connected || !googleEventId) return;
    if (user.googleCalendarSync.syncDirection === 'pull') return;

    const accessToken = await getValidAccessToken(user);
    if (!accessToken || accessToken === 'mock_access_token') return;

    const calendarId = user.googleCalendarSync.calendarId || 'primary';
    
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error('[Google Sync] deleteEventFromGoogle error:', error);
  }
};

const pullEventsFromGoogle = async (user) => {
  try {
    if (!user.googleCalendarSync || !user.googleCalendarSync.connected) return;
    if (user.googleCalendarSync.syncDirection === 'push') return; // Push-only direction

    const accessToken = await getValidAccessToken(user);
    if (!accessToken) return;

    const googleCalendarId = user.googleCalendarSync.googleCalendarId || 'primary';
    
    let items = [];
    if (accessToken === 'mock_access_token') {
      // Mock pull
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      items = [
        {
          id: 'mock_g_event_1',
          summary: 'Mock Google Commit: Dentist Appointment',
          description: 'Regular checkup. Pulled from Google Calendar.',
          location: 'City Dental Clinic',
          start: { dateTime: new Date(today.setHours(15, 0, 0, 0)).toISOString() },
          end: { dateTime: new Date(today.setHours(16, 0, 0, 0)).toISOString() }
        },
        {
          id: 'mock_g_event_2',
          summary: 'Mock Google Commit: Family Dinner',
          description: 'Family gathering.',
          location: 'Grand Buffet Restaurant',
          start: { dateTime: new Date(tomorrow.setHours(19, 0, 0, 0)).toISOString() },
          end: { dateTime: new Date(tomorrow.setHours(21, 0, 0, 0)).toISOString() }
        }
      ];
    } else {
      // Real API fetch
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch Google events: ${await res.text()}`);
      }
      
      const data = await res.json();
      items = data.items || [];
    }

    const pulledGoogleEventIds = [];

    for (const item of items) {
      pulledGoogleEventIds.push(item.id);

      const startVal = item.start.dateTime || item.start.date;
      const endVal = item.end.dateTime || item.end.date;
      const isAllDay = !!item.start.date;
      const startD = new Date(startVal);
      const endD = new Date(endVal);

      let end_date = null;
      if (isAllDay) {
        // Subtract 1 day because Google all-day end dates are exclusive
        const adjustedEnd = new Date(endD.getTime() - 24 * 60 * 60 * 1000);
        if (adjustedEnd > startD) {
          end_date = adjustedEnd;
        }
      } else {
        const startDay = new Date(startD);
        const endDay = new Date(endD);
        startDay.setHours(0,0,0,0);
        endDay.setHours(0,0,0,0);
        if (endDay > startDay) {
          end_date = endD;
        }
      }

      const start_time = isAllDay ? '' : `${pad(startD.getHours())}:${pad(startD.getMinutes())}`;
      const end_time = isAllDay ? '' : `${pad(endD.getHours())}:${pad(endD.getMinutes())}`;

      await Event.findOneAndUpdate(
        { user: user._id, googleEventId: item.id },
        {
          $set: {
            user: user._id,
            title: item.summary || 'Google Commitment',
            date: startD,
            start_time,
            end_time,
            is_all_day: isAllDay,
            end_date,
            description: item.description || '',
            location: item.location || '',
            type: 'event',
            source: 'google',
            source_ref_id: null,
            status: 'upcoming',
            is_recurring: false,
            is_read_only: true,
            googleEventId: item.id
          }
        },
        { upsert: true, new: true }
      );
    }

    // Clean up events that were deleted in Google Calendar
    await Event.deleteMany({
      user: user._id,
      source: 'google',
      googleEventId: { $nin: pulledGoogleEventIds }
    });

    console.log(`[Google Sync] Pulled ${pulledGoogleEventIds.length} events for user:`, user._id);
  } catch (error) {
    console.error('[Google Sync] pullEventsFromGoogle error:', error);
  }
};

module.exports = {
  getAuthUrl,
  exchangeCode,
  getValidAccessToken,
  getOrCreateStudentTrackerCalendar,
  pushEventToGoogle,
  deleteEventFromGoogle,
  pullEventsFromGoogle
};
