// 중복 실행 방지
if (!window.hasInjectedElementSelector) {
  window.hasInjectedElementSelector = true;

  let highlightedElement = null;
  let originalOutline = "";
  let originalBackgroundColor = "";
  
  // 다중 선택 상태 관리
  let selectedElements = []; 
  let floatingBtn = null;

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
    cancelBtn.onclick = () => {
      modalOverlay.remove();
      startSelection(); // 다시 요소 선택 모드로 진입
    };

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "다운로드 (Save as .md)";
    downloadBtn.style.cssText = "padding: 8px 16px; border: none; background: #0078D7; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;";
    downloadBtn.onclick = () => {
      chrome.runtime.sendMessage({
        action: "execute_download",
        markdown: textarea.value
      });
      modalOverlay.remove();
      window.hasInjectedElementSelector = false; // 완전히 종료
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(downloadBtn);

    modalBox.appendChild(header);
    modalBox.appendChild(body);
    modalBox.appendChild(footer);
    modalOverlay.appendChild(modalBox);

    document.body.appendChild(modalOverlay);
  }

  // 플로팅 버튼 제어 로직
  function updateFloatingButton() {
    if (selectedElements.length > 0) {
      if (!floatingBtn) {
        floatingBtn = document.createElement("div");
        floatingBtn.style.cssText = `
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #0078D7;
          color: white;
          padding: 12px 24px;
          border-radius: 30px;
          font-family: sans-serif;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 9999999;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
        `;
        floatingBtn.onclick = () => {
          // 배열에 있는 요소들 변환 시작
          const elementsToProcess = selectedElements.map(item => item.element);
          processElements(elementsToProcess);
        };
        document.body.appendChild(floatingBtn);
      }
      floatingBtn.innerHTML = `<span>🚀</span><span>선택된 ${selectedElements.length}개 요소 변환하기</span>`;
    } else {
      if (floatingBtn) {
        floatingBtn.remove();
        floatingBtn = null;
      }
    }
  }

  function mouseDownHandler(e) {
    // 요소 선택 모드 중에는 텍스트 블록 지정(드래그)을 방지합니다.
    e.preventDefault();
  }

  function stopSelection(fullyCancel) {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("click", clickHandler, true);
    document.removeEventListener("mousedown", mouseDownHandler, true);
    document.removeEventListener("keydown", escapeHandler);
    
    // 호버링 중이던 요소 복구
    if (highlightedElement && !isElementSelected(highlightedElement)) {
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.backgroundColor = originalBackgroundColor;
      highlightedElement = null;
    }
    
    // 다중 선택된 요소들 복구
    if (fullyCancel) {
      selectedElements.forEach(item => {
        item.element.style.outline = item.originalOutline;
        item.element.style.backgroundColor = item.originalBackgroundColor;
      });
      selectedElements = [];
      updateFloatingButton();
      window.hasInjectedElementSelector = false;
    }
  }

  function startSelection() {
    window.hasInjectedElementSelector = true;
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("mousedown", mouseDownHandler, true);
    document.addEventListener("keydown", escapeHandler);
  }

  function escapeHandler(e) {
    if (e.key === "Escape") {
      stopSelection(true);
    }
  }

  function isElementSelected(el) {
    return selectedElements.some(item => item.element === el);
  }

  // 마우스 이동 시 하이라이트 효과 적용
  function mouseMoveHandler(e) {
    if (highlightedElement && !isElementSelected(highlightedElement)) {
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.backgroundColor = originalBackgroundColor;
    }
    
    highlightedElement = e.target;
    
    if (isElementSelected(highlightedElement)) {
      return; // 이미 다중 선택된 요소 위를 지날 때는 스타일 유지
    }
    
    originalOutline = highlightedElement.style.outline;
    originalBackgroundColor = highlightedElement.style.backgroundColor;

    highlightedElement.style.outline = "2px solid #e74c3c";
    highlightedElement.style.backgroundColor = "rgba(231, 76, 60, 0.1)";
  }

  // 클릭 시 요소 추출 및 변환
  function clickHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    const clickedEl = e.target;

    // 다중 선택 토글 (Shift 키)
    if (e.shiftKey) {
      const existingIndex = selectedElements.findIndex(item => item.element === clickedEl);
      if (existingIndex > -1) {
        // 이미 선택된 요소를 다시 클릭하면 선택 해제
        clickedEl.style.outline = selectedElements[existingIndex].originalOutline;
        clickedEl.style.backgroundColor = selectedElements[existingIndex].originalBackgroundColor;
        selectedElements.splice(existingIndex, 1);
      } else {
        // 새로 선택
        selectedElements.push({
          element: clickedEl,
          originalOutline: originalOutline,
          originalBackgroundColor: originalBackgroundColor
        });
        // 선택 완료 스타일 적용 (파란색 테두리)
        clickedEl.style.outline = "3px solid #0078D7";
        clickedEl.style.backgroundColor = "rgba(0, 120, 215, 0.15)";
      }
      updateFloatingButton();
      return; // 다중 선택 시에는 여기서 이벤트를 끝냄
    }

    // Shift 키를 누르지 않았을 때
    if (selectedElements.length > 0) {
      // 다중 선택 중이었는데 Shift 없이 마지막 요소를 클릭한 경우
      if (!isElementSelected(clickedEl)) {
        selectedElements.push({
          element: clickedEl,
          originalOutline: originalOutline,
          originalBackgroundColor: originalBackgroundColor
        });
        clickedEl.style.outline = "3px solid #0078D7";
        clickedEl.style.backgroundColor = "rgba(0, 120, 215, 0.15)";
        updateFloatingButton();
      }
      const elementsToProcess = selectedElements.map(item => item.element);
      processElements(elementsToProcess);
    } else {
      // 단일 선택 모드
      processElements([clickedEl]);
    }
  }
  
  function processElements(elementsArray) {
    stopSelection(false); // 요소 선택 로직 일시 중단
    
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
    
    // 다중 선택 요소들 스타일 복구
    selectedElements.forEach(item => {
      item.element.style.outline = item.originalOutline;
      item.element.style.backgroundColor = item.originalBackgroundColor;
    });
    selectedElements = []; // 초기화
    
    // 선택된 모든 요소의 HTML을 연결
    const htmlContent = elementsArray.map(el => el.outerHTML).join('\n\n<hr>\n\n');

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      preformattedCode: true
    });

    turndownService.remove(['style', 'script', 'noscript']);

    const gfm = turndownPluginGfm.gfm;
    turndownService.use(gfm);

    turndownService.addRule('pre-code', {
      filter: ['pre'],
      replacement: function (content, node) {
        const className = (node.firstChild && node.firstChild.className) || node.className || '';
        const language = (className.match(/language-(\S+)/) || [null, ''])[1];
        return '\n\n```' + language + '\n' + node.textContent.trim() + '\n```\n\n';
      }
    });

    turndownService.addRule('absolute-links', {
      filter: 'a',
      replacement: function (content, node) {
        let href = node.getAttribute('href');
        if (!href) return content;
        try { href = new URL(href, window.location.href).href; } catch (e) { }
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `[${content}](${href}${titlePart})`;
      }
    });

    turndownService.addRule('absolute-images', {
      filter: 'img',
      replacement: function (content, node) {
        let src = node.getAttribute('src');
        if (!src) return '';
        try { src = new URL(src, window.location.href).href; } catch (e) { }
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `![${alt}](${src}${titlePart})`;
      }
    });

    const markdownContent = turndownService.turndown(htmlContent);

    const toast = showLoadingToast();

    chrome.runtime.sendMessage({
      action: "download_md",
      markdown: markdownContent
    }, (response) => {
      if (response && response.markdown) {
        showPreviewModal(response.markdown, toast);
      } else {
        updateToast(toast, false);
        window.hasInjectedElementSelector = false; // 오류 시 종료
      }
    });
  }

  // 처음 스크립트가 주입될 때 요소 선택 시작
  startSelection();
}
