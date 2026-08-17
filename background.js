importScripts("i18n.js");

async function translateMarkdown(text, apiKey, mode, model = "gemini-3.1-flash-lite") {
  let promptText = `Translate the following Markdown content.
If the content is mostly in English, translate it to Korean.
If the content is mostly in Korean, translate it to English.
Maintain the exact Markdown formatting, structure, code blocks, and links. 
Only output the translated Markdown without any additional conversational text.

Markdown to translate:
${text}`;

  if (mode === 'both') {
    promptText = `Translate the following Markdown content.
If the content is mostly in English, translate it to Korean.
If the content is mostly in Korean, translate it to English.

Crucially, you must interleave the original text and the translation paragraph by paragraph (or section by section).
For every paragraph, heading, or block element, output the ORIGINAL text first, and immediately below it, output the translated text.

STRICT FORMATTING RULE:
You MUST format the translated text as a blockquote by prefixing it with "> ". 
Do NOT use HTML tags.

Example Input:
# Hello World
This is a test.

Example Output:
# Hello World
> # 안녕 세상

This is a test.
> 이것은 테스트입니다.

Markdown to translate:
${text}`;
  }

  const selectedModel = model || "gemini-3.1-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Invalid response format from Gemini API");
      }

      // 에러 응답 본문 파싱
      const errorJson = await response.json().catch(() => null);
      const apiMessage = errorJson && errorJson.error && errorJson.error.message ? errorJson.error.message : response.statusText;
      const errorStatus = response.status;
      lastError = new Error(`Gemini API Error (${errorStatus}): ${apiMessage}`);

      // 503(과부하) 또는 429(요청 제한)일 때만 재시도 진행
      if ((errorStatus === 503 || errorStatus === 429) && attempt < MAX_RETRIES) {
        console.warn(`Gemini API ${errorStatus} 과부하 감지. ${attempt}차 재시도 대기 중 (${attempt * 1000}ms)...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }

      // 다른 상태 코드(400, 401, 403 등)는 즉시 예외 발생
      throw lastError;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }
      // 네트워크 단절 등 fetch 자체 실패 시 1초 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError || new Error("Unknown error during Gemini translation");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_md") { // 실제로는 변환 요청을 의미함
    handleTranslation(request.markdown, request.mode)
      .then((finalMarkdown) => {
        sendResponse({ success: true, markdown: finalMarkdown });
      })
      .catch(async (error) => {
        console.error("Translation Error:", error);
        const lang = await I18N.getEffectiveLanguage();
        sendResponse({
          success: false,
          markdown: `${I18N.t("bgErrorNotice", [error.message], lang)}${request.markdown}`
        });
      });

    return true; // 비동기 응답(sendResponse)을 위해 true 반환
  }

  if (request.action === "execute_download") {
    executeDownload(request.markdown);
  }

  if (request.action === "update_context_menus") {
    createContextMenus();
  }
});

async function handleTranslation(originalMarkdown, requestedMode) {
  const localConfig = await chrome.storage.local.get(["translateMode"]);
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);
  const activeLang = await I18N.getEffectiveLanguage();

  let finalMarkdown = originalMarkdown;
  const activeMode = requestedMode || localConfig.translateMode || 'original';

  if (activeMode !== 'original') {
    if (!syncConfig.geminiApiKey) {
      finalMarkdown = `${I18N.t("bgApiKeyNotice", [], activeLang)}${originalMarkdown}`;
    } else {
      finalMarkdown = await translateMarkdown(originalMarkdown, syncConfig.geminiApiKey, activeMode, syncConfig.geminiModel);
    }
  }

  return finalMarkdown;
}

function executeDownload(markdownText) {
  const base64Content = btoa(unescape(encodeURIComponent(markdownText)));
  const url = 'data:text/markdown;base64,' + base64Content;

  chrome.downloads.download({
    url: url,
    filename: "extracted-element.md",
    saveAs: true
  });
}

// 컨텍스트 메뉴(우클릭 메뉴) 생성 및 언어 동기화
async function createContextMenus() {
  const lang = await I18N.getEffectiveLanguage();

  chrome.contextMenus.removeAll(() => {
    // 부모 메뉴
    chrome.contextMenus.create({
      id: "convertSelectionParent",
      title: I18N.t("contextMenuParent", [], lang),
      contexts: ["selection"]
    });

    // 자식 메뉴: 원본만 저장
    chrome.contextMenus.create({
      id: "convert_original",
      parentId: "convertSelectionParent",
      title: I18N.t("contextMenuOriginal", [], lang),
      contexts: ["selection"]
    });

    // 자식 메뉴: 번역본만 저장
    chrome.contextMenus.create({
      id: "convert_translated",
      parentId: "convertSelectionParent",
      title: I18N.t("contextMenuTranslated", [], lang),
      contexts: ["selection"]
    });

    // 자식 메뉴: 원본 + 번역본 저장
    chrome.contextMenus.create({
      id: "convert_both",
      parentId: "convertSelectionParent",
      title: I18N.t("contextMenuBoth", [], lang),
      contexts: ["selection"]
    });
  });
}

// 설치 시 초기 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// 시작 시 메뉴 생성
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith("convert_")) {
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      return;
    }

    // 메뉴 ID에서 모드 추출 (original, translated, both)
    const mode = info.menuItemId.replace("convert_", "");

    try {
      // 1. 의존성 스크립트 및 content.js 주입
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [info.frameId] },
        files: ["i18n.js", "turndown.js", "turndown-plugin-gfm.js", "content.js"]
      });

      // 2. 현재 탭의 content.js에 선택 영역 변환 명령(모드 포함) 전송
      chrome.tabs.sendMessage(tab.id, { action: "process_context_selection", mode: mode }, { frameId: info.frameId });
    } catch (e) {
      console.error("컨텍스트 메뉴 실행 실패:", e);
    }
  }
});
