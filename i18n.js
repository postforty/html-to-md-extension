// HTML to MD Saver - 다국어 (i18n) 모듈
(function (global) {
  // 중복 선언 방지 가드
  if (global.I18N) return;

  const I18N = {
    dictionaries: {
      ko: {
        extName: "HTML to MD Saver",
        extDescription: "웹 페이지의 요소를 선택해 마크다운 파일로 저장합니다.",
        
        // Popup UI
        startSelection: "요소 선택 시작",
        guideBtn: "설명서",
        optionsBtn: "설정",
        modeOriginal: "원본만 저장",
        modeTranslated: "번역본만 저장",
        modeBoth: "원본 + 번역본 저장",
        alertProtectedPage: "이 페이지에서는 확장 프로그램을 사용할 수 없습니다.",
        alertScriptFailed: "스크립트 주입에 실패했습니다.",

        // Options UI
        optionsTitle: "HTML to MD Saver 설정",
        geminiSettings: "Gemini API 설정",
        geminiDesc: "마크다운 번역 기능을 사용하려면 Gemini API Key가 필요합니다.",
        apiKeyLabel: "Gemini API Key:",
        toggleApiKeyTitle: "비밀번호 표시/숨기기",
        geminiModelLabel: "Gemini 모델 (Model):",
        geminiModelPlaceholder: "gemini-3.1-flash-lite",
        defaultSaveModeLabel: "기본 저장 방식:",
        uiLanguageLabel: "UI 언어 (Language):",
        langAuto: "시스템 기본값 (자동 감지)",
        langKo: "한국어 (Korean)",
        langEn: "English",
        saveBtn: "저장하기",
        saveSuccess: "설정이 저장되었습니다.",

        // Content Script UI
        toastProcessing: "마크다운 추출 및 번역 중...",
        toastCancelTitle: "취소",
        toastSuccess: "변환 완료! 파일이 다운로드됩니다.",
        toastError: "처리 중 오류가 발생했습니다.",
        previewHeader: "마크다운 미리보기 (Preview)",
        btnCancel: "취소",
        btnCopy: "클립보드 복사",
        btnCopied: "복사 완료!",
        btnDownload: "다운로드 (Save as .md)",
        modalTranslating: "Gemini AI가 마크다운을 번역 중입니다...",
        modalTranslatingSub: "잠시만 기다려주세요.",
        floatingBtn: "선택된 $1개 요소 변환하기",

        // Context Menu & Background
        contextMenuParent: "선택 영역 마크다운 변환",
        contextMenuOriginal: "원본만 저장",
        contextMenuTranslated: "번역본만 저장",
        contextMenuBoth: "원본 + 번역본 저장",
        bgApiKeyNotice: "> **번역 알림:** 확장 프로그램 설정에서 Gemini API Key를 입력하셔야 번역 기능이 작동합니다.\n\n",
        bgErrorNotice: "> **오류 발생:** 처리 중 문제가 발생했습니다. ($1)\n\n"
      },
      en: {
        extName: "HTML to MD Saver",
        extDescription: "Select and save web page elements as Markdown files.",
        
        // Popup UI
        startSelection: "Start Selecting",
        guideBtn: "Guide",
        optionsBtn: "Settings",
        modeOriginal: "Original Only",
        modeTranslated: "Translated Only",
        modeBoth: "Original + Translated",
        alertProtectedPage: "The extension cannot be used on this page.",
        alertScriptFailed: "Failed to inject script.",

        // Options UI
        optionsTitle: "HTML to MD Saver Settings",
        geminiSettings: "Gemini API Settings",
        geminiDesc: "A Gemini API Key is required to use Markdown translation features.",
        apiKeyLabel: "Gemini API Key:",
        toggleApiKeyTitle: "Show/Hide API Key",
        geminiModelLabel: "Gemini Model:",
        geminiModelPlaceholder: "gemini-3.1-flash-lite",
        defaultSaveModeLabel: "Default Save Mode:",
        uiLanguageLabel: "UI Language:",
        langAuto: "System Default (Auto Detect)",
        langKo: "한국어 (Korean)",
        langEn: "English",
        saveBtn: "Save Settings",
        saveSuccess: "Settings saved successfully.",

        // Content Script UI
        toastProcessing: "Extracting and translating markdown...",
        toastCancelTitle: "Cancel",
        toastSuccess: "Conversion completed! Downloading file.",
        toastError: "An error occurred during processing.",
        previewHeader: "Markdown Preview",
        btnCancel: "Cancel",
        btnCopy: "Copy to Clipboard",
        btnCopied: "Copied!",
        btnDownload: "Download (Save as .md)",
        modalTranslating: "Gemini AI is translating markdown...",
        modalTranslatingSub: "Please wait a moment.",
        floatingBtn: "Convert $1 Selected Elements",

        // Context Menu & Background
        contextMenuParent: "Convert Selection to Markdown",
        contextMenuOriginal: "Original Only",
        contextMenuTranslated: "Translated Only",
        contextMenuBoth: "Original + Translated",
        bgApiKeyNotice: "> **Translation Notice:** Please enter your Gemini API Key in the extension settings to enable translation.\n\n",
        bgErrorNotice: "> **Error:** A problem occurred during processing. ($1)\n\n"
      }
    },

    // 현재 적용할 언어 코드 ('ko' 또는 'en') 비동기 조회
    async getEffectiveLanguage() {
      try {
        const result = await chrome.storage.sync.get(["uiLanguage"]);
        const stored = result.uiLanguage;
        if (stored === "ko" || stored === "en") {
          return stored;
        }
      } catch (e) {
        console.warn("i18n storage access failed, falling back to navigator:", e);
      }
      const navLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
      return navLang.startsWith("ko") ? "ko" : "en";
    },

    // 문자열 번역 반환 (플레이스홀더 치환 포함)
    t(key, params = [], lang = "ko") {
      const dict = this.dictionaries[lang] || this.dictionaries.ko;
      let text = dict[key] || this.dictionaries.ko[key] || key;
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          text = text.replace(new RegExp(`\\$${index + 1}`, "g"), param);
        });
      }
      return text;
    },

    // DOM 요소의 data-i18n, data-i18n-title, data-i18n-placeholder 속성을 기반으로 다국어 적용
    applyI18nToDOM(root = document, lang = "ko") {
      // 텍스트 내용 적용
      root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const text = this.t(key, [], lang);
        if (text) el.textContent = text;
      });

      // title 속성 적용
      root.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        const text = this.t(key, [], lang);
        if (text) el.setAttribute("title", text);
      });

      // placeholder 속성 적용
      root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const text = this.t(key, [], lang);
        if (text) el.setAttribute("placeholder", text);
      });

      // html lang 속성 업데이트
      document.documentElement.lang = lang;
    },

    // 비동기로 현재 언어를 가져와 DOM에 즉시 적용
    async initDOM(root = document) {
      const lang = await this.getEffectiveLanguage();
      this.applyI18nToDOM(root, lang);
      return lang;
    }
  };

  // 전역 객체에 안전하게 할당
  global.I18N = I18N;
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this));
