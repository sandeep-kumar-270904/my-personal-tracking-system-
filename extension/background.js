// background.js - Service worker to handle API requests

// NOTE: In a real implementation, you would need to handle authentication.
// This might involve sharing a token from the web app or having the user log in via the extension.
// For demonstration, we assume a local token or proxy.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOG_APPLICATION') {
    
    // Attempt to get auth token from Chrome storage (set via popup login or sync)
    chrome.storage.local.get(['token'], function(result) {
      const token = result.token;
      
      if (!token) {
        console.error('No auth token found. User must log in via extension popup.');
        sendResponse({ success: false, error: 'unauthorized' });
        return;
      }

      fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request.payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
          sendResponse({ success: true, data });
        } else {
          sendResponse({ success: false, error: data.message });
        }
      })
      .catch(err => {
        console.error('Extension API Error:', err);
        sendResponse({ success: false, error: err.message });
      });
    });

    return true; // Keep the message channel open for async response
  }
});
