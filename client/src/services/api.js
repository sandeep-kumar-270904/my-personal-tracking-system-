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
      await db.outbox.add({
        method: config.method,
        url: config.url,
        payload: config.data,
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
          await db.applications.bulkAdd(response.data);
        } else if (response.config.url === '/interviews') {
          await db.interviews.clear();
          await db.interviews.bulkAdd(response.data);
        }
        // Could add more endpoints to cache
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
        }
      } catch (e) {
        console.error('Dexie fallback failed', e);
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
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
      await api({
        method: item.method,
        url: item.url,
        data: item.payload
      });
      await db.outbox.delete(item.id);
      successCount++;
    } catch (e) {
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
