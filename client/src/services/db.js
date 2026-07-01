import Dexie from 'dexie';

export const db = new Dexie('StudentTrackerDB');

db.version(1).stores({
  applications: '_id, company, status, appliedDate, updatedAt',
  interviews: '_id, company, scheduledAt, status',
  dsa: '_id, user', // single document usually, but let's key by _id
  goals: '_id, weekStartDate',
  outbox: '++id, method, url, payload, timestamp' // Local queue for offline requests
});

db.version(2).stores({
  applications: '_id, company, status, appliedDate, updatedAt',
  interviews: '_id, company, scheduledAt, status',
  dsa: '_id, user',
  goals: '_id, weekStartDate',
  outbox: '++id, method, url, payload, timestamp',
  events: '_id, date, start_time, end_date'
});
