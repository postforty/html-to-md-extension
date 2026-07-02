웹 페이지의 특정 요소를 선택해 마크다운(Markdown)으로 저장하는 크롬 확장 프로그램은 굉장히 유용하고 멋진 아이디어입니다!

이 기능을 구현하려면 **화면의 요소를 선택하는 스크립트**, **HTML을 마크다운으로 변환하는 라이브러리**, 그리고 **파일을 다운로드하는 기능**이 필요합니다. 크롬 확장의 최신 규격인 **Manifest V3**를 기준으로 처음부터 끝까지 만드는 방법을 단계별로 안내해 드리겠습니다.

---

### 📁 1. 작업 폴더 생성 및 라이브러리 준비

먼저 컴퓨터에 새로운 폴더(예: `html-to-md-extension`)를 만들고, HTML을 마크다운으로 쉽게 변환해 주는 **Turndown** 라이브러리를 다운로드해야 합니다.

1. [turndown.js 다운로드 링크](https://www.google.com/search?q=https://unpkg.com/turndown/lib/turndown.js)를 클릭하여 열린 페이지의 코드를 복사합니다.
2. 작업 폴더 안에 `turndown.js`라는 파일을 만들고 복사한 코드를 붙여넣어 저장합니다.

---

### ⚙️ 2. 확장 프로그램 설정 파일 (`manifest.json`)

확장 프로그램의 이름, 권한, 백그라운드 작동 방식 등을 정의하는 필수 파일입니다. 폴더에 `manifest.json` 파일을 만들고 아래 코드를 넣으세요.

```json
{
  "manifest_version": 3,
  "name": "HTML to MD Saver",
  "version": "1.0",
  "description": "웹 페이지의 요소를 선택해 마크다운 파일로 저장합니다.",
  "permissions": ["activeTab", "scripting", "downloads"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}

```

---

### 🖼️ 3. 팝업 UI (`popup.html` & `popup.js`)

브라우저 우측 상단에서 확장 프로그램 아이콘을 클릭했을 때 나타나는 메뉴입니다.

**`popup.html`**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <style>
    body { width: 180px; padding: 15px; font-family: sans-serif; text-align: center; }
    button { padding: 10px; font-size: 14px; cursor: pointer; background: #0078D7; color: white; border: none; border-radius: 5px; width: 100%; }
    button:hover { background: #005A9E; }
  </style>
</head>
<body>
  <button id="start-btn">요소 선택 시작</button>
  <script src="popup.js"></script>
</body>
</html>

```

**`popup.js`**
버튼을 누르면 현재 탭에 요소 선택 스크립트(`content.js`)를 주입합니다.

```javascript
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
      files: ["turndown.js", "content.js"]
    });
    
    window.close(); // 팝업 닫기
  } catch (error) {
    console.error("스크립트 주입 실패:", error);
    alert("스크립트 주입에 실패했습니다.");
  }
});

```

---

### 🎯 4. 화면 요소 선택 로직 (`content.js`)

마우스가 움직일 때마다 요소를 하이라이트하고, 클릭하면 해당 요소의 HTML을 가져와 마크다운으로 변환합니다.

**`content.js`**

```javascript
// 중복 실행 방지
if (!window.hasInjectedElementSelector) {
  window.hasInjectedElementSelector = true;

  let highlightedElement = null;
  let originalOutline = "";
  let originalBackgroundColor = "";

  // 마우스 이동 시 하이라이트 효과 적용
  function mouseMoveHandler(e) {
    if (highlightedElement) {
      // 원래 스타일로 복원
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.backgroundColor = originalBackgroundColor;
    }
    highlightedElement = e.target;
    // 요소의 원래 스타일 저장
    originalOutline = highlightedElement.style.outline;
    originalBackgroundColor = highlightedElement.style.backgroundColor;

    // 하이라이트 적용
    highlightedElement.style.outline = "2px solid #e74c3c";
    highlightedElement.style.backgroundColor = "rgba(231, 76, 60, 0.1)";
  }

  // 클릭 시 요소 추출 및 변환
  function clickHandler(e) {
    // 기존 페이지의 클릭 이벤트 무시
    e.preventDefault();
    e.stopPropagation();

    // 이벤트 리스너 제거 및 하이라이트 초기화
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("click", clickHandler, true);
    if (highlightedElement) {
      // 원래 스타일로 복원
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.backgroundColor = originalBackgroundColor;
    }

    // 1. 선택한 요소의 HTML 가져오기
    const htmlContent = e.target.outerHTML;
    
    // 2. Turndown을 사용해 HTML을 마크다운으로 변환
    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(htmlContent);

    // 3. 백그라운드 스크립트로 다운로드 요청 보내기
    chrome.runtime.sendMessage({ 
      action: "download_md", 
      markdown: markdownContent 
    });
    
    window.hasInjectedElementSelector = false;
  }

  // 이벤트 리스너 등록 (캡처링 단계에서 클릭 가로채기)
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("click", clickHandler, true);
}

```

---

### 💾 5. 다운로드 처리 (`background.js`)

보안상 `content.js`에서는 직접 파일을 다운로드하기 어려우므로, 백그라운드 스크립트에서 파일 생성을 처리합니다.

**`background.js`**

```javascript
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

```

---

### 🚀 크롬 브라우저에 설치 및 테스트 방법

1. 크롬 브라우저 주소창에 `chrome://extensions/`를 입력하여 확장 프로그램 관리 페이지로 이동합니다.
2. 우측 상단의 **'개발자 모드'** 토글을 켭니다.
3. 좌측 상단의 **'압축해제된 확장 프로그램을 로드합니다'** 버튼을 클릭합니다.
4. 방금 만든 작업 폴더(`html-to-md-extension`)를 선택합니다.
5. 이제 웹 서핑을 하다가 퍼가고 싶은 페이지에서 확장 프로그램 아이콘을 누르고 '요소 선택 시작'을 클릭한 뒤, 원하는 부분을 마우스로 클릭해 보세요! `.md` 파일이 성공적으로 다운로드될 것입니다.

> **⚠️ 한계점 안내**: 크롬 확장 프로그램의 보안 특성상 페이지 내부에 삽입된 외부 `<iframe>` (예: 유튜브 영상, 결제창, 기타 외부 위젯 등) 안의 요소는 이 확장 프로그램으로 선택하거나 변환할 수 없습니다.