# HTML to MD Saver (Chrome Extension)

**English** | [한국어](README.ko.md)

A Chrome extension that allows you to extract web page elements by clicking or dragging, instantly converting them into clean **Markdown (`.md`)** files with instant preview, clipboard copy, and AI-powered translation.

---

## ✨ Features

- **🎯 Intuitive Element Selection:** Hover over any web page element to see real-time visual highlighting.
- **🖱️ Drag-to-Extract Area:** Left-click and drag across any area to capture multiple elements at once, with an **instant Markdown preview modal**.
- **🧩 Multi-Element Selection (`Ctrl` + Click):** Hold `Ctrl` (or `Cmd` on macOS) while clicking individual elements to scrape and combine scattered elements into a single file.
- **📑 Right-Click Context Menu Extraction:** Highlight text and right-click to extract selected content directly to Markdown — works seamlessly even on copy-protected pages.
- **⚡ Instant Preview & Clipboard Copy:** Opens a responsive preview modal in milliseconds with one-click **[Copy to Clipboard]** and **[Download]** actions.
- **🤖 AI-Powered Auto Translation (Gemini):** Integrated with Google Gemini API for automatic Markdown translation, featuring a live loading spinner.
- **⚙️ Custom Gemini Model ID:** Specify custom Gemini models (e.g., `gemini-3.5-flash`, `gemini-3.1-pro-preview`) in settings alongside the default `gemini-3.1-flash-lite`.
- **🔄 Automatic Retry on Server Load (503/429):** Resilient API handling with automatic exponential backoff retries (up to 3 times) for transient server errors.
- **🔀 Flexible Translation Modes:** Supports Original Only, Translated Only, and Interleaved (Original + Translation) modes.
- **🌐 Full i18n & Localization:** Built-in support for Korean and English with automatic browser language detection and manual override in settings.
- **🔄 Reset to Defaults:** Safely reset model, language, and save mode options with one click while preserving your API key.
- **🛡️ Full Shadow DOM & Modern Web App Support:** Accurately inspects and extracts nested text and code blocks inside Shadow Roots (`shadowRoot`) found in Web Components and modern web apps (Lit, Angular, Polymer, etc.).
- **🛡️ Safe Cancellation (`ESC`):** Press `ESC` at any time during selection mode to cleanly exit.
- **📝 Full GFM (GitHub Flavored Markdown) Support:** Preserves tables, strikethrough, and code blocks (`<pre>`, `<code>`) cleanly as fenced code blocks (` ``` `).
- **🔗 Automatic Absolute URL Resolution:** Automatically resolves relative hyperlinks (`.`, `/`) and image paths to absolute, clickable URLs to prevent broken links.

---

## 🚀 Installation & Usage (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/postforty/html-to-md-extension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the `html-to-md-extension` directory.
6. Navigate to any web page you want to scrape (Note: Chrome extensions cannot run on internal `chrome://` pages or the Chrome Web Store).
7. **[Method 1: Element Selection Mode]** Click the extension icon, click **[Start Element Selection]**, and click or drag desired elements on the page.
8. **[Method 2: Right-Click Drag Mode]** Highlight text on the web page, right-click, and select your preferred conversion mode from the context menu.
9. Check the result in the **Preview** modal and click **[Copy to Clipboard]** or **[Download]**!

---

## 📂 Project Structure

- `manifest.json`: Chrome extension manifest (Manifest V3, i18n enabled)
- `_locales/`: Chrome Web Store and standard browser locale definitions (`en`, `ko`)
- `i18n.js`: Shared runtime internationalization dictionary and storage sync module
- `popup.html` / `popup.js`: Extension popup UI and script injection logic
- `options.html` / `options.js`: Settings page (API key, Gemini model, default save mode, UI language, reset)
- `guide.html` / `guide_en.html`: Korean and English user guides
- `content.js`: DOM extraction, visual highlighter, interactive modal UI, and Markdown conversion logic
- `background.js`: Context menu handler, download manager, Gemini API worker with auto-retry
- `turndown.js`: HTML to Markdown conversion library
- `turndown-plugin-gfm.js`: Turndown plugin for GitHub Flavored Markdown (tables, etc.)

---

## ⚠️ Limitations & Notes

- Due to browser security restrictions, elements inside cross-origin `<iframe>` tags (e.g., YouTube embeds, external payment widgets, social widgets) cannot be inspected or converted.
- After modifying source code, remember to reload the extension at `chrome://extensions/` (↻) and **refresh the test webpage (F5)** for changes to take effect.

---

## 📜 Changelog

### v1.3
- **🛡️ Full Shadow DOM & Web Component Support:** Uses `e.composedPath()` and recursive Shadow Root traversal to precisely target and extract elements inside Web Components (e.g., Google Stitch, Google Cloud Console).
- **⚡ Capturing Mode Event Listeners:** Event listeners now use the capturing phase to bypass page-level `stopPropagation` interference during hover and click selection.
- **🔒 Global Host Permissions (`host_permissions`):** Added `<all_urls>` host permissions to ensure reliable script injection across all domains and subframes.
- **🔄 Selection Lifecycle Stabilization:** Safely cleans up previous selection state and guarantees seamless re-entry when clicking [Start Element Selection].

### v1.2
- **🌐 Full i18n & Localization:** Full support for Korean and English UI with automatic browser language detection and manual setting override.
- **⚙️ Custom Gemini Model ID:** Support for specifying custom Gemini model IDs (e.g., `gemini-3.5-flash`, `gemini-3.1-pro-preview`) alongside the default model.
- **🔄 Settings Reset:** One-click reset for model, language, and save options while safely preserving the API Key.
- **⚡ Instant Modal Responsiveness:** Optimized UX to display the preview modal in 0.01s upon element selection.
- **📚 Multilingual Documentation:** Separated English and Korean READMEs and updated store listing documentation.

### v1.1
- **🖱️ Drag-to-Extract Area:** Smart algorithm to capture multiple elements at once by dragging a rectangular area across the screen.
- **🧩 Intuitive Multi-Selection:** Select and merge scattered elements using `Ctrl` (or `Cmd` on macOS) + Click.
- **📑 Right-Click Context Menu Extraction:** Extract highlighted text directly to Markdown via right-click context menu in multiple modes.
- **🔧 Compatibility & Rendering Fixes:** Improved compatibility with frameset sites and enhanced preview sharpness on macOS.

### v1.0
- **🎉 Initial Release:** Core HTML to Markdown conversion Chrome extension.
- **📝 Full GFM Support:** Clean conversion with support for tables, fenced code blocks, and inline formatting.
- **🔗 Automatic Absolute URL Resolution:** Resolves relative paths for links and images to absolute, clickable URLs.
- **🤖 Gemini AI Translation:** Automated Markdown translation with real-time preview, copy-to-clipboard, and download.

---

## 📄 License

MIT License
