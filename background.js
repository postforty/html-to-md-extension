async function translateMarkdown(text, apiKey, mode) {
  let promptText = `Translate the following Markdown content to Korean. 
Maintain the exact Markdown formatting, structure, code blocks, and links. 
Only output the translated Markdown without any additional conversational text.

Markdown to translate:
${text}`;

  if (mode === 'both') {
    promptText = `Translate the following Markdown content to Korean.
Crucially, you must interleave the translation and the original text paragraph by paragraph (or section by section).
For every paragraph, heading, or block element, output the Korean translation first, and immediately below it, output the ORIGINAL English text formatted as a blockquote (starting with '> ').
Do not wrap the entire document in one blockquote, do it individually for each part.
Maintain all original formatting. Only output the final Markdown without any additional conversational text.

Markdown to translate:
${text}`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
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
    handleTranslation(request.markdown)
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

async function handleTranslation(originalMarkdown) {
  const localConfig = await chrome.storage.local.get(["translateEnabled", "translateMode"]);
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey"]);
  
  let finalMarkdown = originalMarkdown;
  
  if (localConfig.translateEnabled) {
    if (!syncConfig.geminiApiKey) {
      finalMarkdown = `> **번역 알림:** 확장 프로그램 설정에서 Gemini API Key를 입력하셔야 번역 기능이 작동합니다.\n\n${originalMarkdown}`;
    } else {
      finalMarkdown = await translateMarkdown(originalMarkdown, syncConfig.geminiApiKey, localConfig.translateMode);
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
