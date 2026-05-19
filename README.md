# PromptReady — Chrome Extension

AI prompt enhancement layer for ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek.

## Folder Structure

```
PromptReady/
├── manifest.json                  # Manifest V3 config
├── background/
│   └── service_worker.js          # Handles storage, messaging, install defaults
├── content/
│   ├── prompt_analyzer.js         # Detects task type, intent, complexity
│   ├── framework_selector.js      # Picks the best prompting framework
│   ├── prompt_rewriter.js         # Rewrites prompts using selected framework
│   ├── ui_overlay.js              # Floating button + enhancement panel UI
│   └── content.js                 # Main orchestrator injected into AI sites
├── popup/
│   ├── popup.html/css/js          # Extension popup (quick settings)
├── options/
│   ├── options.html/css/js        # Full settings page
├── styles/
│   └── overlay.css                # Injected styles for the overlay UI
└── icons/
    ├── generate_icons.html        # Open in browser to generate PNG icons
    ├── icon16.png                 # (generate with generate_icons.html)
    ├── icon48.png
    └── icon128.png
```

## Installation

### Step 1 — Generate Icons
1. Open `icons/generate_icons.html` in Chrome
2. Right-click each canvas → **Save image as**
3. Save as `icon16.png`, `icon48.png`, `icon128.png` inside the `icons/` folder

### Step 2 — Load in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `PromptReady/` folder

### Step 3 — Use it
- Navigate to ChatGPT, Claude, Gemini, Perplexity, Grok, or DeepSeek
- Click into any prompt input field
- Click the **✦ Enhance** button that appears below the input
- Review the enhanced prompt in the panel, then click **Replace & Use**
- Or press **Alt + E** as a keyboard shortcut

## Supported Frameworks

| Framework | Best for |
|---|---|
| Role + Context + Task | Business, creative, general tasks |
| Chain of Thought | Complex reasoning, debugging |
| Step-by-Step | Coding, math, how-to tasks |
| Few-Shot | Formatting-sensitive tasks |
| Instruction Hierarchy | Simple, vague prompts |
| Output Formatting | Writing with structure |
| JSON Structured Output | Data, API, schema tasks |
| Socratic Questioning | Analysis, exploration |
| Planning-First | Complex multi-part tasks |

## Modes

- **Manual** — click the Enhance button when you want it
- **Auto** — automatically enhances as you type (with debounce)

## Intensity Levels

- **Light** — minimal additions, keeps original mostly intact
- **Balanced** — adds role, context, structure (recommended)
- **Aggressive** — full rewrite with constraints, phases, output specs

## Chrome Web Store Submission Checklist

- [ ] Icons generated (16, 48, 128px PNG)
- [ ] Tested on all 6 supported sites
- [ ] `manifest.json` version bumped
- [ ] Screenshots taken (1280×800 or 640×400)
- [ ] Store description written
- [ ] Privacy policy URL ready (required if using `storage` permission)
