document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('token-input');
  const saveBtn = document.getElementById('save-btn');
  const setupView = document.getElementById('setup-view');
  const successView = document.getElementById('success-view');

  // Load existing
  chrome.storage.local.get(['token'], (result) => {
    if (result.token) {
      setupView.style.display = 'none';
      successView.style.display = 'block';
    }
  });

  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (token) {
      chrome.storage.local.set({ token }, () => {
        setupView.style.display = 'none';
        successView.style.display = 'block';
      });
    }
  });
});
