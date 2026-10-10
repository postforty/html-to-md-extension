document.getElementById("start-btn").addEventListener("click", async () => {
  try {
    const translateMode = document.getElementById("translate-mode").value;
    const currentLang = await I18N.getEffectiveLanguage();

    // 현재 활성화된 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 크롬 내부 페이지 등 보호된 페이지 예외 처리
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      alert(I18N.t("alertProtectedPage", [], currentLang));
      return;
    }

    // 로컬 파일(file://)인 경우 파일 URL 액세스 권한 여부 사전 검사
    if (tab.url.startsWith("file://")) {
      const isAllowed = await chrome.extension.isAllowedFileSchemeAccess();
      if (!isAllowed) {
        alert(I18N.t("alertFileAccessRequired", [], currentLang));
        return;
      }
    }

    // 1. 이미 메인 프레임에 스크립트가 주입되어 있는지 확인
    const checkResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => typeof window.hasInjectedElementSelector !== "undefined"
    }).catch(() => null);

    const isAlreadyInjected = checkResult && checkResult[0] && checkResult[0].result === true;

    // 2. 주입되지 않은 경우 메인 프레임에 스크립트 파일 주입
    if (!isAlreadyInjected) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["i18n.js", "turndown.js", "turndown-plugin-gfm.js", "content.js"]
      });
    }
    
    // 3. 메인 프레임에서 호버 선택 모드 직접 활성화 (포트 단절 및 다중 iframe 메시징 충돌 방지)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (mode) => {
          if (typeof window.startHoverSelectionFromExtension === "function") {
            window.startHoverSelectionFromExtension(mode);
          }
        },
        args: [translateMode]
      });
    } catch (directErr) {
      // 직접 실행 실패 시 fallback으로 메인 프레임(frameId: 0) 대상 메시지 전송 시도
      await chrome.tabs.sendMessage(
        tab.id,
        { action: "start_hover_selection", mode: translateMode },
        { frameId: 0 }
      ).catch(() => {});
    }
    
    window.close(); // 성공 시 팝업 닫기
  } catch (error) {
    console.error("스크립트 주입 또는 실행 실패:", error);
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
