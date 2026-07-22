document.getElementById("start-btn").addEventListener("click", async () => {
  try {
    const translateMode = document.getElementById("translate-mode").value;

    // 현재 활성화된 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 크롬 내부 페이지 등 보호된 페이지 예외 처리
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      alert("이 페이지에서는 확장 프로그램을 사용할 수 없습니다.");
      return;
    }

    // turndown 변환 라이브러리와 선택 로직 스크립트를 현재 탭에 실행
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["turndown.js", "turndown-plugin-gfm.js", "content.js"]
    });
    
    // 명시적으로 호버 선택 모드 시작 요청 및 일회용 모드 전달
    chrome.tabs.sendMessage(tab.id, { action: "start_hover_selection", mode: translateMode });
    
    window.close(); // 팝업 닫기
  } catch (error) {
    console.error("스크립트 주입 실패:", error);
    alert("스크립트 주입에 실패했습니다.");
  }
});

// 옵션 페이지 열기 버튼
document.getElementById("options-btn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// 설명서 페이지 열기 버튼
document.getElementById("guide-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("guide.html") });
});

// 팝업 열릴 때 이전 설정값 불러오기
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get(["translateMode"]);
  if (result.translateMode !== undefined) {
    document.getElementById("translate-mode").value = result.translateMode;
  }
});
