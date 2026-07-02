chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_md") {
    // 마크다운 텍스트를 Base64 Data URI 형식으로 인코딩 (한글 깨짐 방지)
    const base64Content = btoa(unescape(encodeURIComponent(request.markdown)));
    const url = 'data:text/markdown;base64,' + base64Content;
    
    // 파일 다운로드 실행
    chrome.downloads.download({
      url: url,
      filename: "extracted-element.md",
      saveAs: true // 저장 위치 묻기 창 띄움
    });
  }
});
