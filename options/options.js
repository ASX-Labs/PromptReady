// options.js — Full settings page controller

(async () => {

  const SITES = [
    { key: 'chatgpt.com',          name: 'ChatGPT',     url: 'chatgpt.com',          icon: '🤖' },
    { key: 'chat.openai.com',      name: 'ChatGPT (old)',url: 'chat.openai.com',     icon: '🤖' },
    { key: 'claude.ai',            name: 'Claude',      url: 'claude.ai',            icon: '🧠' },
    { key: 'gemini.google.com',    name: 'Gemini',      url: 'gemini.google.com',    icon: '♊' },
    { key: 'www.perplexity.ai',    name: 'Perplexity',  url: 'perplexity.ai',        icon: '🔍' },
    { key: 'grok.x.com',           name: 'Grok',        url: 'grok.x.com',           icon: '𝕏' },
    { key: 'chat.deepseek.com',    name: 'DeepSeek',    url: 'chat.deepseek.com',    icon: '🌊' },
  ];

  const FRAMEWORKS = [
    { id: 'auto',                 name: '✦ Auto-Select (Recommended)', desc: 'PromptReady picks the best framework automatically based on your prompt.', isAuto: true },
    { id: 'role_context_task',    name: 'Role + Context + Task',       desc: 'Assigns an expert role, provides context, and defines the task with constraints.' },
    { id: 'chain_of_thought',     name: 'Chain of Thought',            desc: 'Guides the model through step-by-step reasoning before answering.' },
    { id: 'step_by_step',         name: 'Step-by-Step Reasoning',      desc: 'Breaks the task into clear sequential numbered steps.' },
    { id: 'few_shot',             name: 'Few-Shot Prompting',           desc: 'Provides pattern examples to guide the response format and style.' },
    { id: 'instruction_hierarchy',name: 'Instruction Hierarchy',        desc: 'Organizes the prompt into layered primary and secondary instructions.' },
    { id: 'output_formatting',    name: 'Output Formatting',            desc: 'Specifies exact output structure, sections, and formatting requirements.' },
    { id: 'json_structured',      name: 'JSON Structured Output',       desc: 'Requests a response conforming to a defined JSON schema.' },
    { id: 'socratic',             name: 'Socratic Questioning',         desc: 'Uses guided questions and answers to explore the topic with depth.' },
    { id: 'planning_first',       name: 'Planning-First',               desc: 'Instructs the model to plan and outline before executing the full response.' },
  ];

  let settings = {};

  // ── Load settings ──────────────────────────────────────────────────────────
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
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, () => {
        showToast('Settings saved!');
        resolve();
      });
    });
  }

  // ── Tab navigation ─────────────────────────────────────────────────────────
  function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const panels   = document.querySelectorAll('.tab-panel');

    // Support direct hash navigation (e.g. options.html#history)
    const hash = location.hash.replace('#', '');
    if (hash) activateTab(hash);

    navItems.forEach(item => {
      item.addEventListener('click', () => activateTab(item.dataset.tab));
    });

    function activateTab(tabId) {
      navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
      panels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
      if (tabId === 'history') loadHistory();
    }
  }

  // ── General tab ───────────────────────────────────────────────────────────
  function initGeneral() {
    // Reflect saved settings
    const modeInput = document.querySelector(`input[name="mode"][value="${settings.mode || 'manual'}"]`);
    if (modeInput) modeInput.checked = true;

    const intensityInput = document.querySelector(`input[name="intensity"][value="${settings.intensity || 'balanced'}"]`);
    if (intensityInput) intensityInput.checked = true;

    document.getElementById('save-general').addEventListener('click', () => {
      const modeVal = document.querySelector('input[name="mode"]:checked')?.value;
      const intVal  = document.querySelector('input[name="intensity"]:checked')?.value;
      if (modeVal) settings.mode = modeVal;
      if (intVal)  settings.intensity = intVal;
      saveSettings();
    });
  }

  // ── Frameworks tab ────────────────────────────────────────────────────────
  function initFrameworks() {
    const grid = document.getElementById('framework-grid');
    const currentFramework = settings.framework || 'auto';

    FRAMEWORKS.forEach(fw => {
      const card = document.createElement('div');
      card.className = 'framework-card' + (fw.isAuto ? ' auto-card' : '') + (fw.id === currentFramework ? ' active' : '');
      card.dataset.id = fw.id;
      card.innerHTML = fw.isAuto
        ? `<div class="framework-auto-badge">RECOMMENDED</div><div class="framework-name">${fw.name}</div><div class="framework-desc">${fw.desc}</div>`
        : `<div class="framework-name">${fw.name}</div><div class="framework-desc">${fw.desc}</div>`;

      card.addEventListener('click', () => {
        grid.querySelectorAll('.framework-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });

      grid.appendChild(card);
    });

    document.getElementById('save-frameworks').addEventListener('click', () => {
      const active = grid.querySelector('.framework-card.active');
      if (active) settings.framework = active.dataset.id;
      saveSettings();
    });
  }

  // ── Sites tab ─────────────────────────────────────────────────────────────
  function initSites() {
    const list = document.getElementById('sites-list');

    SITES.forEach(site => {
      const enabled = settings.enabledSites?.[site.key] !== false;

      const row = document.createElement('div');
      row.className = 'site-row';
      row.innerHTML = `
        <span class="site-icon">${site.icon}</span>
        <div class="site-info">
          <div class="site-name">${site.name}</div>
          <div class="site-url">${site.url}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${enabled ? 'checked' : ''} data-site="${site.key}">
          <span class="toggle-slider"></span>
        </label>`;

      row.querySelector('input').addEventListener('change', (e) => {
        if (!settings.enabledSites) settings.enabledSites = {};
        settings.enabledSites[site.key] = e.target.checked;
        saveSettings();
      });

      list.appendChild(row);
    });
  }

  // ── History tab ───────────────────────────────────────────────────────────
  function loadHistory() {
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (res) => {
      const history = res?.history || [];
      const list    = document.getElementById('history-list');
      const count   = document.getElementById('history-count');

      count.textContent = `${history.length} prompt${history.length !== 1 ? 's' : ''}`;
      list.innerHTML = '';

      if (!history.length) {
        list.innerHTML = '<div class="empty-state">No prompt history yet. Start enhancing prompts to see them here.</div>';
        return;
      }

      history.forEach(entry => {
        const scoreClass = entry.score >= 80 ? 'score-high' : entry.score >= 60 ? 'score-mid' : 'score-low';
        const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div class="history-item-meta">
            <span class="history-framework">${entry.framework || '—'}</span>
            <span class="history-score ${scoreClass}">Score: ${entry.score ?? '—'}</span>
            <span class="history-date">${date}</span>
          </div>
          <div class="history-raw">Original: ${entry.raw}</div>
          <div class="history-enhanced">${entry.enhanced}</div>`;

        // Click to copy enhanced prompt
        item.addEventListener('click', () => {
          navigator.clipboard.writeText(entry.enhanced).then(() => showToast('Enhanced prompt copied!'));
        });

        list.appendChild(item);
      });
    });
  }

  document.getElementById('clear-history').addEventListener('click', () => {
    if (!confirm('Clear all prompt history? This cannot be undone.')) return;
    chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, () => {
      loadHistory();
      showToast('History cleared.');
    });
  });

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(message) {
    const existing = document.querySelector('.options-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'options-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  await loadSettings();
  initTabs();
  initGeneral();
  initFrameworks();
  initSites();

})();
