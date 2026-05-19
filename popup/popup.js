// popup.js — Popup controller: loads/saves settings and displays stats

(async () => {
  let settings = {};

  // ── Load settings from background ─────────────────────────────────────────
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
        settings = res?.settings || {};
        resolve();
      });
    });
  }

  async function saveSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, resolve);
    });
  }

  // ── Apply loaded settings to UI ────────────────────────────────────────────
  function applyToUI() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === settings.mode);
    });

    // Intensity buttons
    document.querySelectorAll('.intensity-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.intensity === settings.intensity);
    });

    // Site toggle
    const hostname = location.hostname || getCurrentTabHostname();
    const siteToggle = document.getElementById('site-toggle');
    const siteHostname = document.getElementById('site-hostname');

    getCurrentTabHostname().then((host) => {
      siteHostname.textContent = host || '—';
      const enabled = settings.enabledSites?.[host] !== false;
      siteToggle.checked = enabled;
    });
  }

  async function getCurrentTabHostname() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        try {
          const url = new URL(tabs[0]?.url || '');
          resolve(url.hostname);
        } catch {
          resolve('');
        }
      });
    });
  }

  // ── Load history stats ─────────────────────────────────────────────────────
  async function loadStats() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (res) => {
        const history = res?.history || [];
        const total   = history.length;
        const scores  = history.map(h => h.score).filter(Boolean);
        const avgScore = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

        document.getElementById('stat-enhanced').textContent = total;
        document.getElementById('stat-score').textContent    = avgScore != null ? avgScore : '—';
        document.getElementById('stat-saved').textContent    = total;
        resolve();
      });
    });
  }

  // ── Wire up events ─────────────────────────────────────────────────────────
  function bindEvents() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveSettings();
      });
    });

    // Intensity buttons
    document.querySelectorAll('.intensity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.intensity = btn.dataset.intensity;
        document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveSettings();
      });
    });

    // Site toggle
    document.getElementById('site-toggle').addEventListener('change', async (e) => {
      const host = await getCurrentTabHostname();
      if (!settings.enabledSites) settings.enabledSites = {};
      settings.enabledSites[host] = e.target.checked;
      saveSettings();
    });

    // Footer links
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('open-history').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') + '#history' });
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  await loadSettings();
  applyToUI();
  bindEvents();
  loadStats();

})();
