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
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      preformattedCode: true
    });

    // GFM 플러그인 적용
    const gfm = turndownPluginGfm.gfm;
    turndownService.use(gfm);

    // 코드 블럭 줄바꿈 보존을 위한 강력한 커스텀 룰
    turndownService.addRule('pre-code', {
      filter: ['pre'],
      replacement: function (content, node) {
        const className = (node.firstChild && node.firstChild.className) || node.className || '';
        const language = (className.match(/language-(\S+)/) || [null, ''])[1];
        // DOMParser 내부 노드 대신 원래 선택한 요소의 textContent/innerText를 반영하기 위해 
        // node.textContent 사용 (preformattedCode: true 옵션으로 줄바꿈 보존됨)
        return '\n\n```' + language + '\n' + node.textContent.trim() + '\n```\n\n';
      }
    });

    // 상대 경로 링크를 절대 경로로 변환하는 룰
    turndownService.addRule('absolute-links', {
      filter: 'a',
      replacement: function (content, node) {
        let href = node.getAttribute('href');
        if (!href) return content;
        try {
          href = new URL(href, window.location.href).href; // 현재 페이지 URL 기준으로 절대 경로 생성
        } catch (e) { }
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `[${content}](${href}${titlePart})`;
      }
    });

    // 상대 경로 이미지를 절대 경로로 변환하는 룰
    turndownService.addRule('absolute-images', {
      filter: 'img',
      replacement: function (content, node) {
        let src = node.getAttribute('src');
        if (!src) return '';
        try {
          src = new URL(src, window.location.href).href; // 현재 페이지 URL 기준으로 절대 경로 생성
        } catch (e) { }
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `![${alt}](${src}${titlePart})`;
      }
    });

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
