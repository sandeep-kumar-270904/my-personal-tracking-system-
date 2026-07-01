// content.js - Injected into LinkedIn
// Listens for post-apply confirmation screens and prompts user to log it.

function extractLinkedInJobInfo() {
  // LinkedIn DOM is highly volatile. This is a generic heuristic.
  const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title');
  const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name');
  
  if (titleEl && companyEl) {
    return {
      role: titleEl.innerText.trim(),
      company: companyEl.innerText.trim(),
      url: window.location.href
    };
  }
  return null;
}

function checkForApplicationSuccess() {
  // Wait for the specific success modal or toast on LinkedIn
  const successModal = document.querySelector('.artdeco-modal__header');
  if (successModal && successModal.innerText.toLowerCase().includes('application sent')) {
    const jobInfo = extractLinkedInJobInfo();
    if (jobInfo) {
      promptToLog(jobInfo);
    }
  }
}

function promptToLog(jobInfo) {
  // Prevent duplicate prompts
  if (document.getElementById('studenttracker-logger-prompt')) return;

  const overlay = document.createElement('div');
  overlay.id = 'studenttracker-logger-prompt';
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: #13141f;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 999999;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  overlay.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #60a5fa;">Log this application?</h3>
    <div style="margin-bottom: 12px; font-size: 14px;">
      <strong>Company:</strong> ${jobInfo.company} <br/>
      <strong>Role:</strong> ${jobInfo.role}
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="st-log-btn" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Log to Tracker</button>
      <button id="st-dismiss-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer;">Skip</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('st-dismiss-btn').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('st-log-btn').addEventListener('click', () => {
    document.getElementById('st-log-btn').innerText = 'Logging...';
    
    // Send message to background script to make the API call
    chrome.runtime.sendMessage({
      type: 'LOG_APPLICATION',
      payload: {
        company: jobInfo.company,
        role: jobInfo.role,
        link: jobInfo.url,
        source: 'LINKEDIN',
        status: 'APPLIED',
        dateApplied: new Date().toISOString()
      }
    }, (response) => {
      if (response && response.success) {
        overlay.innerHTML = `<div style="text-align: center; color: #34d399; font-weight: bold; padding: 10px 0;">✅ Logged Successfully!</div>`;
        setTimeout(() => overlay.remove(), 2000);
      } else {
        document.getElementById('st-log-btn').innerText = 'Failed. Try Again';
        document.getElementById('st-log-btn').style.background = '#ef4444';
      }
    });
  });
}

// Simple mutation observer to watch for the success modal
const observer = new MutationObserver(() => {
  checkForApplicationSuccess();
});
observer.observe(document.body, { childList: true, subtree: true });
