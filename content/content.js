// content.js — Main orchestrator: detects inputs, coordinates enhancement pipeline

(async () => {
  // ── Site-specific input selectors ─────────────────────────────────────────
  const SITE_SELECTORS = {
    'chat.openai.com':      '#prompt-textarea, div[contenteditable="true"][data-id]',
    'chatgpt.com':          '#prompt-textarea, div[contenteditable="true"][data-id]',
    'claude.ai':            'div[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
    'gemini.google.com':    'div[contenteditable="true"].ql-editor, rich-textarea div[contenteditable]',
    'www.perplexity.ai':    'textarea[placeholder], div[contenteditable="true"]',
    'grok.x.com':           'div[contenteditable="true"], textarea',
    'x.com':                'div[contenteditable="true"][data-testid="tweetTextarea_0"]',
    'chat.deepseek.com':    'textarea#chat-input, div[contenteditable="true"]'
  };

  const hostname = window.location.hostname;
  const siteSelector = SITE_SELECTORS[hostname] || 'textarea, div[contenteditable="true"]';

  // ── State ──────────────────────────────────────────────────────────────────
  let settings = {
    mode: 'manual',
    framework: 'auto',
    intensity: 'balanced',
    enabledSites: {}
  };
  let activeInputEl   = null;
  let lastRawPrompt   = '';
  let debounceTimer   = null;
  let observerActive  = false;

  // ── Load settings ──────────────────────────────────────────────────────────
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
        if (res?.settings) settings = res.settings;
        resolve();
      });
    });
  }

  await loadSettings();

  // Check if this site is disabled
  if (settings.enabledSites[hostname] === false) return;

  // ── Listen for settings updates from background ────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SETTINGS_UPDATED') {
      settings = msg.settings;
      if (settings.enabledSites[hostname] === false) {
        UIOverlay.hideButton();
        UIOverlay.hidePanel();
      }
    }
  });

  // ── Init UI overlay ────────────────────────────────────────────────────────
  UIOverlay.init(handleEnhance, handleReplace);

  // ── Keyboard shortcut: Alt+E ───────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'e' && activeInputEl) {
      e.preventDefault();
      if (UIOverlay.isVisible()) {
        UIOverlay.hidePanel();
      } else {
        handleEnhance(activeInputEl);
      }
    }
    // Escape closes the panel
    if (e.key === 'Escape' && UIOverlay.isVisible()) {
      UIOverlay.hidePanel();
    }
  });

  // ── Input detection ────────────────────────────────────────────────────────
  function getInputText(el) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value;
    }
    return el.innerText || el.textContent || '';
  }

  function setInputText(el, text) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // contenteditable — use execCommand to preserve undo stack where possible
      el.focus();
      if (document.execCommand) {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      } else {
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      }
    }
  }

  function isValidInput(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    const isEditable = tag === 'textarea' ||
      (tag !== 'input' && el.getAttribute('contenteditable') === 'true') ||
      (tag === 'input' && !['submit', 'button', 'checkbox', 'radio', 'hidden'].includes(el.type));

    if (!isEditable) return false;

    // Ignore very small inputs (search bars, etc.)
    const rect = el.getBoundingClientRect();
    return rect.width > 100 && rect.height > 30;
  }

  // ── Focus/blur tracking ───────────────────────────────────────────────────
  function onFocusIn(e) {
    const el = e.target;
    if (!isValidInput(el)) return;

    activeInputEl = el;
    UIOverlay.showButton(el);

    // Auto mode: watch for input changes
    if (settings.mode === 'auto') {
      el.addEventListener('input', onAutoInput);
    }
  }

  function onFocusOut(e) {
    const el = e.target;
    if (el === activeInputEl) {
      setTimeout(() => {
        // Don't hide if user clicked the panel or button
        const focused = document.activeElement;
        if (!document.getElementById('promptready-panel')?.contains(focused) &&
            focused?.id !== 'promptready-btn') {
          UIOverlay.hideButton();
          el.removeEventListener('input', onAutoInput);
        }
      }, 150);
    }
  }

  function onAutoInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (activeInputEl) {
        const text = getInputText(activeInputEl).trim();
        if (text.length > 10 && text !== lastRawPrompt) {
          lastRawPrompt = text;
          // Show subtle indicator for auto mode
          UIOverlay.showButton(activeInputEl);
        }
      }
    }, 600);
  }

  document.addEventListener('focusin',  onFocusIn,  true);
  document.addEventListener('focusout', onFocusOut, true);

  // ── Core enhancement pipeline ─────────────────────────────────────────────
  async function handleEnhance(inputEl) {
    if (!inputEl) return;

    const rawPrompt = getInputText(inputEl).trim();
    if (!rawPrompt || rawPrompt.length < 3) {
      UIOverlay.showToast('Please type a prompt first.');
      return;
    }

    UIOverlay.showLoading();

    // Small async yield so the loading UI renders before heavy work
    await new Promise(r => setTimeout(r, 30));

    try {
      const analysis  = PromptAnalyzer.analyze(rawPrompt);
      const framework = FrameworkSelector.select(analysis, settings.framework);
      const enhanced  = PromptRewriter.rewrite(rawPrompt, analysis, framework, settings.intensity);
      const score     = PromptRewriter.calculateQualityScore(rawPrompt, enhanced);

      UIOverlay.showPanel(rawPrompt, enhanced, framework.name, score);

      // Persist to history
      saveToHistory(rawPrompt, enhanced, framework.name, score);

    } catch (err) {
      console.error('[PromptReady] Enhancement error:', err);
      UIOverlay.showToast('Enhancement failed — please try again.');
      UIOverlay.hidePanel();
    }
  }

  function handleReplace(inputEl, enhancedText) {
    if (!inputEl || !enhancedText) return;
    setInputText(inputEl, enhancedText);
    UIOverlay.showToast('✓ Prompt replaced!');
  }

  // ── History ────────────────────────────────────────────────────────────────
  function saveToHistory(raw, enhanced, framework, score) {
    const entry = {
      id:        Date.now(),
      timestamp: new Date().toISOString(),
      site:      hostname,
      raw,
      enhanced,
      framework,
      score
    };
    chrome.runtime.sendMessage({ type: 'SAVE_HISTORY', entry }).catch(() => {});
  }

  // ── MutationObserver — handle SPA DOM changes ─────────────────────────────
  function startObserver() {
    if (observerActive) return;
    observerActive = true;

    const observer = new MutationObserver(() => {
      // Re-validate current active input still exists
      if (activeInputEl && !document.body.contains(activeInputEl)) {
        activeInputEl = null;
        UIOverlay.hideButton();
        UIOverlay.hidePanel();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  startObserver();

})();
