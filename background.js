async function translateMarkdown(text, apiKey, mode) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
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

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_md") { // 실제로는 변환 요청을 의미함
    handleTranslation(request.markdown, request.mode)
      .then((finalMarkdown) => {
        sendResponse({ success: true, markdown: finalMarkdown });
      })
      .catch(error => {
        console.error("Translation Error:", error);
        sendResponse({
          success: false,
          markdown: `> **오류 발생:** 처리 중 문제가 발생했습니다. (${error.message})\n\n${request.markdown}`
        });
      });

    return true; // 비동기 응답(sendResponse)을 위해 true 반환
  }

  if (request.action === "execute_download") {
    executeDownload(request.markdown);
  }
});

async function handleTranslation(originalMarkdown, requestedMode) {
  const localConfig = await chrome.storage.local.get(["translateMode"]);
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey"]);

  let finalMarkdown = originalMarkdown;
  const activeMode = requestedMode || localConfig.translateMode || 'original';

  if (activeMode !== 'original') {
    if (!syncConfig.geminiApiKey) {
      finalMarkdown = `> **번역 알림:** 확장 프로그램 설정에서 Gemini API Key를 입력하셔야 번역 기능이 작동합니다.\n\n${originalMarkdown}`;
    } else {
      finalMarkdown = await translateMarkdown(originalMarkdown, syncConfig.geminiApiKey, activeMode);
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

// 컨텍스트 메뉴(우클릭 메뉴) 생성
chrome.runtime.onInstalled.addListener(() => {
  // 부모 메뉴
  chrome.contextMenus.create({
    id: "convertSelectionParent",
    title: "선택 영역 마크다운 변환",
    contexts: ["selection"]
  });

  // 자식 메뉴: 원본만 저장
  chrome.contextMenus.create({
    id: "convert_original",
    parentId: "convertSelectionParent",
    title: "원본만 저장",
    contexts: ["selection"]
  });

  // 자식 메뉴: 번역본만 저장
  chrome.contextMenus.create({
    id: "convert_translated",
    parentId: "convertSelectionParent",
    title: "번역본만 저장",
    contexts: ["selection"]
  });

  // 자식 메뉴: 원본 + 번역본 저장
  chrome.contextMenus.create({
    id: "convert_both",
    parentId: "convertSelectionParent",
    title: "원본 + 번역본 저장",
    contexts: ["selection"]
  });
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
        files: ["turndown.js", "turndown-plugin-gfm.js", "content.js"]
      });

      // 2. 현재 탭의 content.js에 선택 영역 변환 명령(모드 포함) 전송
      chrome.tabs.sendMessage(tab.id, { action: "process_context_selection", mode: mode }, { frameId: info.frameId });
    } catch (e) {
      console.error("컨텍스트 메뉴 실행 실패:", e);
    }
  }
});
