document.getElementById("start-btn").addEventListener("click", async () => {
  try {
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
    
    window.close(); // 팝업 닫기
  } catch (error) {
    console.error("스크립트 주입 실패:", error);
    alert("스크립트 주입에 실패했습니다.");
  }
});
