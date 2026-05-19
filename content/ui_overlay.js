// ui_overlay.js — Creates and manages the floating enhance button and panel

const UIOverlay = (() => {

  let enhanceBtn   = null;
  let panel        = null;
  let currentInput = null;
  let onEnhanceCb  = null;
  let onReplaceCb  = null;

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  function init(onEnhance, onReplace) {
    onEnhanceCb = onEnhance;
    onReplaceCb = onReplace;
    _createButton();
    _createPanel();
  }

  // ── Enhance button ─────────────────────────────────────────────────────────
  function _createButton() {
    enhanceBtn = document.createElement('button');
    enhanceBtn.id = 'promptready-btn';
    enhanceBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
      <span>Enhance</span>`;
    enhanceBtn.title = 'Enhance this prompt with PromptReady (Alt+E)';
    enhanceBtn.style.display = 'none';
    enhanceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentInput && onEnhanceCb) onEnhanceCb(currentInput);
    });
    document.body.appendChild(enhanceBtn);
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  function _createPanel() {
    panel = document.createElement('div');
    panel.id = 'promptready-panel';
    panel.innerHTML = `
      <div class="pr-panel-header">
        <div class="pr-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          PromptReady
        </div>
        <button class="pr-close-btn" id="pr-close">×</button>
      </div>

      <div class="pr-meta-row">
        <span class="pr-badge" id="pr-framework-badge">Analyzing…</span>
        <span class="pr-score" id="pr-score-badge">Score: --</span>
      </div>

      <div class="pr-section">
        <div class="pr-section-label">Original Prompt</div>
        <div class="pr-original" id="pr-original-text"></div>
      </div>

      <div class="pr-divider"><span>↓ Enhanced with AI</span></div>

      <div class="pr-section">
        <div class="pr-section-label pr-enhanced-label">
          Enhanced Prompt
          <button class="pr-copy-btn" id="pr-copy-btn" title="Copy enhanced prompt">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <div class="pr-enhanced" id="pr-enhanced-text"></div>
      </div>

      <div class="pr-actions">
        <button class="pr-btn pr-btn-secondary" id="pr-regenerate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Regenerate
        </button>
        <button class="pr-btn pr-btn-primary" id="pr-replace">Replace &amp; Use</button>
      </div>`;

    panel.style.display = 'none';

    // Wire events
    panel.querySelector('#pr-close').addEventListener('click', hidePanel);

    panel.querySelector('#pr-replace').addEventListener('click', () => {
      const enhanced = panel.querySelector('#pr-enhanced-text').textContent;
      if (onReplaceCb && currentInput && enhanced) {
        onReplaceCb(currentInput, enhanced);
      }
      hidePanel();
    });

    panel.querySelector('#pr-copy-btn').addEventListener('click', () => {
      const text = panel.querySelector('#pr-enhanced-text').textContent;
      navigator.clipboard.writeText(text).then(() => {
        panel.querySelector('#pr-copy-btn').classList.add('copied');
        showToast('Copied to clipboard!');
        setTimeout(() => panel.querySelector('#pr-copy-btn').classList.remove('copied'), 1800);
      });
    });

    panel.querySelector('#pr-regenerate').addEventListener('click', () => {
      if (currentInput && onEnhanceCb) onEnhanceCb(currentInput);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (panel.style.display !== 'none' &&
          !panel.contains(e.target) &&
          e.target !== enhanceBtn) {
        hidePanel();
      }
    });

    document.body.appendChild(panel);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function attachToInput(inputEl) {
    currentInput = inputEl;
  }

  function showButton(inputEl) {
    if (!enhanceBtn || !inputEl) return;
    currentInput = inputEl;
    _positionButton(inputEl);
    enhanceBtn.style.display = 'flex';
  }

  function _positionButton(inputEl) {
    const rect  = inputEl.getBoundingClientRect();
    const sTop  = window.scrollY || document.documentElement.scrollTop;
    const sLeft = window.scrollX || document.documentElement.scrollLeft;

    let top  = rect.bottom + sTop + 8;
    let left = rect.right  + sLeft - 120;

    // Clamp to viewport
    const btnW = 120;
    if (left < 8) left = 8;
    if (left + btnW > window.innerWidth) left = window.innerWidth - btnW - 8;

    enhanceBtn.style.top  = `${top}px`;
    enhanceBtn.style.left = `${left}px`;
  }

  function hideButton() {
    if (enhanceBtn) enhanceBtn.style.display = 'none';
  }

  function showLoading() {
    panel.style.display = 'flex';
    panel.querySelector('#pr-enhanced-text').innerHTML =
      '<div class="pr-loading"><span></span><span></span><span></span></div>';
    panel.querySelector('#pr-framework-badge').textContent = 'Analyzing…';
    panel.querySelector('#pr-score-badge').textContent = 'Score: --';
    panel.querySelector('#pr-score-badge').className = 'pr-score';
    _positionPanel();
  }

  function showPanel(originalText, enhancedText, frameworkName, score) {
    panel.querySelector('#pr-original-text').textContent = originalText;
    panel.querySelector('#pr-enhanced-text').textContent = enhancedText;
    panel.querySelector('#pr-framework-badge').textContent = frameworkName;

    const scoreBadge = panel.querySelector('#pr-score-badge');
    scoreBadge.textContent = `Score: ${score}`;
    scoreBadge.className   = 'pr-score ' + (score >= 80 ? 'pr-score-high' : score >= 60 ? 'pr-score-mid' : 'pr-score-low');

    panel.style.display = 'flex';
    _positionPanel();
  }

  function _positionPanel() {
    if (!currentInput) return;
    const rect   = currentInput.getBoundingClientRect();
    const sTop   = window.scrollY  || document.documentElement.scrollTop;
    const sLeft  = window.scrollX  || document.documentElement.scrollLeft;
    const panelW = 380;

    let top  = rect.top  + sTop - 20;
    let left = rect.right + sLeft + 14;

    // Flip left if panel overflows right edge
    if (left + panelW > window.innerWidth - 8) {
      left = rect.left + sLeft - panelW - 14;
    }
    if (left < 8)  left = 8;
    if (top  < 8)  top  = 8;

    panel.style.top  = `${top}px`;
    panel.style.left = `${left}px`;
  }

  function hidePanel() {
    if (panel) panel.style.display = 'none';
  }

  function isVisible() {
    return panel && panel.style.display !== 'none';
  }

  function showToast(message) {
    const existing = document.querySelector('.pr-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'pr-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function destroy() {
    enhanceBtn?.remove();
    panel?.remove();
    enhanceBtn = null;
    panel      = null;
  }

  return {
    init, attachToInput,
    showButton, hideButton,
    showLoading, showPanel, hidePanel, isVisible,
    showToast, destroy
  };
})();
