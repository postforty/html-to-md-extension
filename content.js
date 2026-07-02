// 중복 실행 방지
if (!window.hasInjectedElementSelector) {
  window.hasInjectedElementSelector = true;

  let highlightedElement = null;
  let originalOutline = "";
  let originalBackgroundColor = "";

  function showLoadingToast() {
    const toast = document.createElement("div");
    toast.id = "md-saver-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0078D7;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999999;
      transition: opacity 0.3s ease-in-out;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>⏳</span><span>마크다운 추출 및 번역 중...</span>`;
    document.body.appendChild(toast);
    return toast;
  }

  function updateToast(toast, success) {
    if (!toast) return;
    toast.style.background = success ? "#107C10" : "#D13438";
    toast.innerHTML = success 
      ? `<span>✅</span><span>변환 완료! 파일이 다운로드됩니다.</span>`
      : `<span>❌</span><span>처리 중 오류가 발생했습니다.</span>`;
    
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function showPreviewModal(markdownText, loadingToast) {
    if (loadingToast) {
      loadingToast.remove();
    }

    const modalOverlay = document.createElement("div");
    modalOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); z-index: 9999998;
      display: flex; justify-content: center; align-items: center;
    `;

    const modalBox = document.createElement("div");
    modalBox.style.cssText = `
      background: white; width: 80%; max-width: 800px; max-height: 85vh;
      border-radius: 10px; display: flex; flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: sans-serif;
      overflow: hidden;
    `;

    const header = document.createElement("div");
    header.style.cssText = "padding: 15px 20px; border-bottom: 1px solid #ddd; background: #f8f9fa; font-weight: bold; font-size: 16px; color: #333;";
    header.textContent = "마크다운 미리보기 (Preview)";

    const body = document.createElement("div");
    body.style.cssText = "padding: 20px; flex: 1; overflow-y: auto;";
    
    const textarea = document.createElement("textarea");
    textarea.style.cssText = "width: 100%; height: 400px; padding: 15px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 5px; font-family: monospace; font-size: 14px; line-height: 1.5; resize: vertical;";
    textarea.value = markdownText;
    body.appendChild(textarea);

    const footer = document.createElement("div");
    footer.style.cssText = "padding: 15px 20px; border-top: 1px solid #ddd; background: #f8f9fa; display: flex; justify-content: flex-end; gap: 10px;";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "취소";
    cancelBtn.style.cssText = "padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; color: #333;";
    cancelBtn.onclick = () => modalOverlay.remove();

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "다운로드 (Save as .md)";
    downloadBtn.style.cssText = "padding: 8px 16px; border: none; background: #0078D7; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;";
    downloadBtn.onclick = () => {
      chrome.runtime.sendMessage({
        action: "execute_download",
        markdown: textarea.value
      });
      modalOverlay.remove();
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(downloadBtn);

    modalBox.appendChild(header);
    modalBox.appendChild(body);
    modalBox.appendChild(footer);
    modalOverlay.appendChild(modalBox);

    document.body.appendChild(modalOverlay);
  }

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

    // 불필요한 태그 제거 (style, script 등)
    turndownService.remove(['style', 'script', 'noscript']);

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

    // 로딩 토스트 표시
    const toast = showLoadingToast();

    // 3. 백그라운드 스크립트로 다운로드 요청 보내기 (콜백 연동)
    chrome.runtime.sendMessage({
      action: "download_md",
      markdown: markdownContent
    }, (response) => {
      if (response && response.markdown) {
        showPreviewModal(response.markdown, toast);
      } else {
        updateToast(toast, false);
      }
    });

    window.hasInjectedElementSelector = false;
  }

  // 이벤트 리스너 등록 (캡처링 단계에서 클릭 가로채기)
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("click", clickHandler, true);
}
