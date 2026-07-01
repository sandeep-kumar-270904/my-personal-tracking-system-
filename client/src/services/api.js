import axios from 'axios';
import { db } from './db';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Offline outbox logic
    if (!navigator.onLine && ['post', 'put', 'delete'].includes(config.method)) {
      toast('You are offline. Action saved and will sync later.', { icon: '📡' });
      
      const tempId = config.data?._id || 'temp_' + Date.now();
      const payload = { ...config.data };
      
      // Update Dexie database immediately so it is viewable offline!
      if (config.url && config.url.startsWith('/events')) {
        if (config.method === 'post') {
          const newEvent = {
            ...config.data,
            _id: tempId,
            pendingSync: true,
            status: config.data.status || 'upcoming'
          };
          await db.events.add(newEvent);
          payload._id = tempId;
        } else if (config.method === 'put') {
          const parts = config.url.split('/');
          const id = parts[parts.length - 1];
          const existing = await db.events.get(id);
          if (existing) {
            await db.events.put({
              ...existing,
              ...config.data,
              lastKnownUpdatedAt: existing.updatedAt,
              pendingSync: true
            });
            payload.lastKnownUpdatedAt = existing.updatedAt;
          }
        } else if (config.method === 'delete') {
          const parts = config.url.split('/');
          const id = parts[parts.length - 1];
          await db.events.delete(id);
        }
      }

      await db.outbox.add({
        method: config.method,
        url: config.url,
        payload: payload,
        timestamp: new Date().toISOString()
      });

      // Simulate a success response so the UI optimistically updates
      return Promise.reject({
        isOfflineQueued: true,
        message: 'Queued offline',
        config
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  async (response) => {
    // Cache GET requests to Dexie
    if (response.config.method === 'get') {
      try {
        if (response.config.url === '/applications') {
          await db.applications.clear();
          const appsData = Array.isArray(response.data) ? response.data : (response.data.applications || []);
          if (appsData.length > 0) await db.applications.bulkAdd(appsData);
        } else if (response.config.url === '/interviews') {
          await db.interviews.clear();
          const intsData = Array.isArray(response.data) ? response.data : (response.data.interviews || []);
          if (intsData.length > 0) await db.interviews.bulkAdd(intsData);
        } else if (response.config.url.startsWith('/events') || response.config.url.startsWith('events')) {
          const eventsData = Array.isArray(response.data) ? response.data : [];
          if (eventsData.length > 0) {
            // Keep local pending events so they don't get deleted by sync read
            const allLocal = await db.events.toArray();
            const pendingIds = new Set(allLocal.filter(e => e.pendingSync).map(e => e._id));
            
            // Filter incoming to not overwrite pending items
            const filteredIncoming = eventsData.filter(e => !pendingIds.has(e._id));
            if (filteredIncoming.length > 0) {
              await db.events.bulkPut(filteredIncoming);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to cache to Dexie', e);
      }
    }
    return response;
  },
  async (error) => {
    if (error.isOfflineQueued) {
      // Resolve immediately for queued offline actions
      return Promise.resolve({ data: { _offline: true } });
    }

    if (!navigator.onLine && error.config?.method === 'get') {
      // Fallback to Dexie cache for reads
      try {
        if (error.config.url === '/applications') {
          const data = await db.applications.toArray();
          return Promise.resolve({ data });
        } else if (error.config.url === '/interviews') {
          const data = await db.interviews.toArray();
          return Promise.resolve({ data });
        } else if (error.config.url?.startsWith('/events')) {
          let data = await db.events.toArray();
          // Filter if start/end parameters are present
          const urlPart = error.config.url;
          const qIndex = urlPart.indexOf('?');
          if (qIndex !== -1) {
            const queryParams = new URLSearchParams(urlPart.slice(qIndex));
            const startParam = queryParams.get('start');
            const endParam = queryParams.get('end');
            if (startParam && endParam) {
              const start = new Date(startParam);
              const end = new Date(endParam);
              data = data.filter(e => {
                const date = new Date(e.date);
                return date >= start && date <= end;
              });
            }
          }
          return Promise.resolve({ data });
        }
      } catch (e) {
        console.error('Dexie fallback failed', e);
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Process outbox function
export const processOutbox = async () => {
  if (!navigator.onLine) return;
  const queue = await db.outbox.toArray();
  if (queue.length === 0) return;

  toast('Syncing offline changes...', { icon: '🔄' });
  let successCount = 0;

  for (const item of queue) {
    try {
      const res = await api({
        method: item.method,
        url: item.url,
        data: item.payload
      });
      
      // Update local storage representation
      if (item.url.startsWith('/events')) {
        if (item.method === 'post') {
          const tempId = item.payload?._id;
          if (tempId) {
            await db.events.delete(tempId);
          }
          if (res.data && res.data._id) {
            await db.events.put(res.data);
          }
        } else if (item.method === 'put') {
          if (res.data && res.data._id) {
            await db.events.put(res.data);
          }
        }
      }
      
      await db.outbox.delete(item.id);
      successCount++;
    } catch (e) {
      if (e.response && e.response.status === 409) {
        // Genuine conflict detected!
        const serverEvent = e.response.data?.serverEvent;
        if (serverEvent) {
          const keepLocal = window.confirm(
            `Sync Conflict for "${item.payload.title || 'Event'}":\n\nThis event was edited on the server while you were offline. Do you want to overwrite the server version with your offline edits?\n\n- Click OK to KEEP your offline version.\n- Click Cancel to DISCARD your offline version.`
          );
          if (keepLocal) {
            try {
              const res = await api({
                method: item.method,
                url: item.url,
                data: { ...item.payload, ignoreConflict: true }
              });
              if (item.method === 'post' && item.payload?._id) {
                await db.events.delete(item.payload._id);
              }
              if (res.data && res.data._id) {
                await db.events.put(res.data);
              }
              await db.outbox.delete(item.id);
              successCount++;
              toast.success('Local changes saved to server.');
              continue;
            } catch (err) {
              console.error('Bypass conflict update failed', err);
            }
          } else {
            await db.events.put(serverEvent);
            await db.outbox.delete(item.id);
            toast('Discarded local changes; server version applied.', { icon: 'ℹ️' });
            continue;
          }
        }
      }
      console.error('Sync failed for item', item, e);
    }
  }

  if (successCount > 0) {
    toast.success(`Synced ${successCount} offline changes`);
  }
};

// Listen for back online
window.addEventListener('online', () => {
  processOutbox();
});

export default api;
