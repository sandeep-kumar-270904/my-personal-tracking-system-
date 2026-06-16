// Analytics tracking layer
// Can be replaced with Posthog, Google Analytics, or Mixpanel

export const initAnalytics = () => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    console.log('[Analytics] Initialized');
  }
};

export const trackEvent = (eventName, properties = {}) => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    console.log(`[Analytics] Track Event: ${eventName}`, properties);
    // e.g., posthog.capture(eventName, properties);
  }
};

export const identifyUser = (userId, traits = {}) => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    console.log(`[Analytics] Identify User: ${userId}`, traits);
    // e.g., posthog.identify(userId, traits);
  }
};
