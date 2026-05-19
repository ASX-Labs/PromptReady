// service_worker.js — Background service worker for PromptReady
// Handles installation, default settings, and cross-tab messaging

const DEFAULT_SETTINGS = {
  mode: 'manual',          // 'auto' | 'manual'
  framework: 'auto',       // 'auto' | specific framework id
  intensity: 'balanced',   // 'light' | 'balanced' | 'aggressive'
  enabledSites: {
    'chat.openai.com': true,
    'chatgpt.com': true,
    'claude.ai': true,
    'gemini.google.com': true,
    'www.perplexity.ai': true,
    'grok.x.com': true,
    'x.com': false,
    'chat.deepseek.com': true
  },
  promptHistory: [],
  maxHistoryItems: 50
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    chrome.tabs.create({ url: 'options/options.html' });
  } else if (details.reason === 'update') {
    // Merge new defaults with existing settings on update
    const { settings } = await chrome.storage.sync.get('settings');
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    merged.enabledSites = { ...DEFAULT_SETTINGS.enabledSites, ...settings?.enabledSites };
    await chrome.storage.sync.set({ settings: merged });
  }
});

// Relay messages between content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get('settings').then(({ settings }) => {
      sendResponse({ settings: settings || DEFAULT_SETTINGS });
    });
    return true; // keep channel open for async
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set({ settings: message.settings }).then(() => {
      sendResponse({ success: true });
      // Notify all content scripts of settings change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings: message.settings })
            .catch(() => {}); // ignore tabs without content script
        });
      });
    });
    return true;
  }

  if (message.type === 'SAVE_HISTORY') {
    chrome.storage.local.get('promptHistory').then(({ promptHistory = [] }) => {
      const updated = [message.entry, ...promptHistory].slice(0, DEFAULT_SETTINGS.maxHistoryItems);
      chrome.storage.local.set({ promptHistory: updated });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get('promptHistory').then(({ promptHistory = [] }) => {
      sendResponse({ history: promptHistory });
    });
    return true;
  }

  if (message.type === 'CLEAR_HISTORY') {
    chrome.storage.local.set({ promptHistory: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
