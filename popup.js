document.getElementById("start-btn").addEventListener("click", async () => {
  try {
    const translateMode = document.getElementById("translate-mode").value;
    const currentLang = await I18N.getEffectiveLanguage();

    // 현재 활성화된 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 크롬 내부 페이지 등 보호된 페이지 예외 처리
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      alert(I18N.t("alertProtectedPage", [], currentLang));
      return;
    }

    // i18n 모듈, turndown 변환 라이브러리와 선택 로직 스크립트를 현재 탭에 실행 (모든 프레임 포함)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["i18n.js", "turndown.js", "turndown-plugin-gfm.js", "content.js"]
    });
    
    // 명시적으로 호버 선택 모드 시작 요청 및 일회용 모드 전달
    chrome.tabs.sendMessage(tab.id, { action: "start_hover_selection", mode: translateMode });
    
    window.close(); // 팝업 닫기
  } catch (error) {
    console.error("스크립트 주입 실패:", error);
    const currentLang = await I18N.getEffectiveLanguage();
    alert(I18N.t("alertScriptFailed", [], currentLang));
  }
});

// 옵션 페이지 열기 버튼
document.getElementById("options-btn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// 설명서 페이지 열기 버튼 (현재 언어 설정에 맞는 설명서 열기)
document.getElementById("guide-btn").addEventListener("click", async () => {
  const currentLang = await I18N.getEffectiveLanguage();
  const guidePage = currentLang === "en" ? "guide_en.html" : "guide.html";
  chrome.tabs.create({ url: chrome.runtime.getURL(guidePage) });
});

// 팝업 열릴 때 다국어 초기화 및 이전 설정값 불러오기
document.addEventListener("DOMContentLoaded", async () => {
  // 1. 다국어 DOM 적용
  await I18N.initDOM();

  // 2. 이전 저장 모드 설정 불러오기
  const result = await chrome.storage.local.get(["translateMode"]);
  if (result.translateMode !== undefined) {
    document.getElementById("translate-mode").value = result.translateMode;
  }
});
