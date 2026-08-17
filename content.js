// 중복 실행 방지
if (!window.hasInjectedElementSelector) {
  window.hasInjectedElementSelector = true;

  let highlightedElement = null;
  let originalOutline = "";
  let originalBackgroundColor = "";
  
  // 다중 선택 상태 관리
  let selectedElements = []; 
  let floatingBtn = null;

  // 다국어 상태 관리
  let currentLang = "ko";
  if (typeof I18N !== "undefined") {
    I18N.getEffectiveLanguage().then(lang => { currentLang = lang; });
  }

  // 드래그 영역 선택 상태 관리
  let isMouseDown = false;
  let isDragging = false;
  let justFinishedDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragBoxEl = null;
  const DRAG_THRESHOLD = 5;



  function showPreviewModal(markdownText, isTranslating = false, onCancel = null) {
    const modalOverlay = document.createElement("div");
    modalOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); z-index: 9999998;
      display: flex; justify-content: center; align-items: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    const modalBox = document.createElement("div");
    modalBox.style.cssText = `
      background: white; width: 85%; max-width: 800px; max-height: 85vh;
      border-radius: 12px; display: flex; flex-direction: column;
      box-shadow: 0 12px 35px rgba(0,0,0,0.3); font-family: inherit;
      overflow: hidden; animation: md-saver-fadein 0.2s ease-out;
    `;

    const header = document.createElement("div");
    header.style.cssText = "padding: 16px 22px; border-bottom: 1px solid #eee; background: #fafafa; font-weight: bold; font-size: 16px; color: #222; display: flex; align-items: center; justify-content: space-between;";
    header.innerHTML = `
      <span style="display:flex;align-items:center;gap:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        ${typeof I18N !== "undefined" ? I18N.t("previewHeader", [], currentLang) : "마크다운 미리보기 (Preview)"}
      </span>
    `;

    const body = document.createElement("div");
    body.style.cssText = "padding: 20px; flex: 1; overflow-y: auto; position: relative;";
    
    const textarea = document.createElement("textarea");
    textarea.style.cssText = "width: 100%; height: 420px; padding: 15px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; font-size: 14px; line-height: 1.5; resize: vertical; color: #333; background-color: #fdfdfd; -webkit-font-smoothing: antialiased;";
    textarea.value = markdownText;
    body.appendChild(textarea);

    // 번역 중일 때 표시할 실시간 로딩 오버레이
    const loadingOverlay = document.createElement("div");
    loadingOverlay.style.cssText = `
      position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(4px);
      border-radius: 6px;
      display: ${isTranslating ? "flex" : "none"};
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 10;
      transition: opacity 0.3s ease;
    `;
    loadingOverlay.innerHTML = `
      <style>
        @keyframes md-modal-spin { 100% { transform: rotate(360deg); } }
      </style>
      <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,90,0,0.15), rgba(230,81,0,0.05)); display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF5A00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: md-modal-spin 1.2s linear infinite;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      </div>
      <div style="font-weight: 600; font-size: 15px; color: #222;">
        ${typeof I18N !== "undefined" ? I18N.t("modalTranslating", [], currentLang) : "Gemini AI가 마크다운을 번역 중입니다..."}
      </div>
      <div style="font-size: 13px; color: #777;">
        ${typeof I18N !== "undefined" ? I18N.t("modalTranslatingSub", [], currentLang) : "잠시만 기다려주세요."}
      </div>
    `;
    body.appendChild(loadingOverlay);

    const footer = document.createElement("div");
    footer.style.cssText = "padding: 15px 22px; border-top: 1px solid #eee; background: #fafafa; display: flex; justify-content: flex-end; gap: 10px;";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = typeof I18N !== "undefined" ? I18N.t("btnCancel", [], currentLang) : "취소";
    cancelBtn.style.cssText = "display: inline-flex; align-items: center; justify-content: center; height: 38px; box-sizing: border-box; padding: 0 18px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer; color: #444; font-size: 14px; font-weight: 500; transition: background 0.2s;";
    cancelBtn.onmouseover = () => { cancelBtn.style.background = "#f0f0f0"; };
    cancelBtn.onmouseout = () => { cancelBtn.style.background = "white"; };
    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      modalOverlay.remove();
      if (!window.isContextMenuTriggered) {
        startSelection(); // 팝업으로 시작한 경우에만 다시 요소 선택 모드로 진입
      }
    };

    // 클립보드 복사 버튼
    const copyBtn = document.createElement("button");
    copyBtn.textContent = typeof I18N !== "undefined" ? I18N.t("btnCopy", [], currentLang) : "클립보드 복사";
    copyBtn.style.cssText = `display: inline-flex; align-items: center; justify-content: center; height: 38px; box-sizing: border-box; padding: 0 18px; border: 1px solid #ccc; background: white; border-radius: 6px; font-size: 14px; font-weight: 500; color: #333; transition: all 0.2s; ${isTranslating ? "opacity: 0.5; cursor: not-allowed;" : "cursor: pointer;"}`;
    copyBtn.disabled = isTranslating;
    copyBtn.onclick = async () => {
      if (copyBtn.disabled) return;
      try {
        await navigator.clipboard.writeText(textarea.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = typeof I18N !== "undefined" ? I18N.t("btnCopied", [], currentLang) : "복사 완료!";
        copyBtn.style.borderColor = "#107C10";
        copyBtn.style.color = "#107C10";
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.borderColor = "#ccc";
          copyBtn.style.color = "#333";
        }, 1800);
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    };

    // 다운로드 버튼
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = typeof I18N !== "undefined" ? I18N.t("btnDownload", [], currentLang) : "다운로드 (Save as .md)";
    downloadBtn.style.cssText = `display: inline-flex; align-items: center; justify-content: center; height: 38px; box-sizing: border-box; padding: 0 20px; border: none; background: linear-gradient(135deg, #FF5A00 0%, #E65100 100%); color: white; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 6px rgba(230,81,0,0.2); transition: all 0.2s; ${isTranslating ? "opacity: 0.5; cursor: not-allowed;" : "cursor: pointer;"}`;
    downloadBtn.disabled = isTranslating;
    downloadBtn.onclick = () => {
      if (downloadBtn.disabled) return;
      chrome.runtime.sendMessage({
        action: "execute_download",
        markdown: textarea.value
      });
      modalOverlay.remove();
      window.hasStartedSelection = false; // 완전히 종료
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(copyBtn);
    footer.appendChild(downloadBtn);

    modalBox.appendChild(header);
    modalBox.appendChild(body);
    modalBox.appendChild(footer);
    modalOverlay.appendChild(modalBox);

    document.body.appendChild(modalOverlay);

    // 외부에서 모달 내용 갱신 및 로딩 해제할 수 있는 컨트롤러 반환
    return {
      modalOverlay,
      updateContent(newMarkdown) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => {
          loadingOverlay.style.display = "none";
        }, 300);
        textarea.value = newMarkdown;
        copyBtn.disabled = false;
        copyBtn.style.opacity = "1";
        copyBtn.style.cursor = "pointer";
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = "1";
        downloadBtn.style.cursor = "pointer";
      }
    };
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
          background: linear-gradient(135deg, #FF5A00 0%, #E65100 100%);
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
      const floatingText = typeof I18N !== "undefined" 
        ? I18N.t("floatingBtn", [selectedElements.length.toString()], currentLang)
        : `선택된 ${selectedElements.length}개 요소 변환하기`;
      floatingBtn.innerHTML = `
        <span style="display:flex;align-items:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
        </span>
        <span>${floatingText}</span>`;
    } else {
      if (floatingBtn) {
        floatingBtn.remove();
        floatingBtn = null;
      }
    }
  }

  function createDragBox(x, y) {
    if (!dragBoxEl) {
      dragBoxEl = document.createElement("div");
      dragBoxEl.id = "md-saver-drag-box";
      dragBoxEl.style.cssText = `
        position: fixed;
        border: 2px dashed #FF5A00;
        background: rgba(255, 90, 0, 0.15);
        z-index: 9999998;
        pointer-events: none;
        box-sizing: border-box;
      `;
      document.body.appendChild(dragBoxEl);
    }
    updateDragBox(x, y);
  }

  function updateDragBox(currentX, currentY) {
    if (!dragBoxEl) return;
    const left = Math.min(dragStartX, currentX);
    const top = Math.min(dragStartY, currentY);
    const width = Math.abs(currentX - dragStartX);
    const height = Math.abs(currentY - dragStartY);
    dragBoxEl.style.left = `${left}px`;
    dragBoxEl.style.top = `${top}px`;
    dragBoxEl.style.width = `${width}px`;
    dragBoxEl.style.height = `${height}px`;
  }

  function removeDragBox() {
    if (dragBoxEl) {
      dragBoxEl.remove();
      dragBoxEl = null;
    }
  }

  function selectElementsInRect(boxRect) {
    // 5px 이하의 미세한 드래그는 무시
    const boxWidth = boxRect.right - boxRect.left;
    const boxHeight = boxRect.bottom - boxRect.top;
    if (boxWidth < DRAG_THRESHOLD && boxHeight < DRAG_THRESHOLD) {
      return;
    }

    const candidateSelectors = "article, section, div, p, pre, table, ul, ol, h1, h2, h3, h4, h5, h6, img, a, blockquote, code, li";
    const allElements = Array.from(document.body.querySelectorAll(candidateSelectors));

    const intersected = allElements.filter(el => {
      // 확장 프로그램 자체 UI 요소는 제외
      if (el.id === "md-saver-toast" || el.closest("#md-saver-toast") || 
          el.id === "md-saver-drag-box" || el === floatingBtn || 
          el.closest(".md-saver-modal")) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // 1. 기본 교차 검사 (AABB Collision)
      const isOverlap = !(rect.right < boxRect.left || 
                          rect.left > boxRect.right || 
                          rect.bottom < boxRect.top || 
                          rect.top > boxRect.bottom);
      if (!isOverlap) return false;

      // 2. 스마트 하이브리드 임계값 판정 (살짝 걸친 요소 제외)
      const overlapWidth = Math.max(0, Math.min(boxRect.right, rect.right) - Math.max(boxRect.left, rect.left));
      const overlapHeight = Math.max(0, Math.min(boxRect.bottom, rect.bottom) - Math.max(boxRect.top, rect.top));
      const overlapArea = overlapWidth * overlapHeight;
      const elArea = rect.width * rect.height;

      // 조건 A: 요소 전체 면적의 40% 이상이 덮였을 때
      const isAreaQualified = (overlapArea / elArea) >= 0.4;

      // 조건 B: 가로가 긴 블록 요소를 위해, 세로 높이의 50% 이상이 덮이면서 의미 있는 너비가 겹쳤을 때
      const isHeightQualified = (overlapHeight >= rect.height * 0.5) && 
                                (overlapWidth >= Math.min(rect.width * 0.25, 40));

      // 조건 C: 드래그 박스가 요소보다 작지만 요소 내부를 집중적으로 긁은 경우 (박스 면적의 60% 이상 차지)
      const isBoxCovered = (overlapArea / (boxWidth * boxHeight)) >= 0.6;

      return isAreaQualified || isHeightQualified || isBoxCovered;
    });

    if (intersected.length === 0) return;

    // 거대 컨테이너 필터링 (박스 크기보다 과도하게 큰 부모가 잡혀서 내부 자식들이 묻히는 현상 방지)
    const boxArea = boxWidth * boxHeight;
    const validElements = intersected.filter(el => {
      const rect = el.getBoundingClientRect();
      const elArea = rect.width * rect.height;
      if (elArea > boxArea * 3 && intersected.some(other => other !== el && el.contains(other))) {
        return false;
      }
      return true;
    });

    // 부모-자식 중복 제거: 다른 유효 요소의 자식인 요소는 제외하여 최외곽 유효 요소만 선택
    const finalSelected = validElements.filter(el => {
      return !validElements.some(other => other !== el && other.contains(el));
    });

    if (finalSelected.length === 0) return;

    finalSelected.forEach(el => {
      if (!isElementSelected(el)) {
        selectedElements.push({
          element: el,
          originalOutline: el.style.outline,
          originalBackgroundColor: el.style.backgroundColor
        });
      }
    });

    const elementsToProcess = selectedElements.map(item => item.element);
    if (elementsToProcess.length > 0) {
      processElements(elementsToProcess);
    }
  }

  function mouseDownHandler(e) {
    if (e.button !== 0) return; // 좌클릭만 처리
    // 요소 선택 모드 중에는 기본 텍스트 블록 지정(드래그)을 방지합니다.
    e.preventDefault();
    isMouseDown = true;
    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  function mouseUpHandler(e) {
    if (e.button !== 0) return;
    if (isDragging) {
      const boxRect = {
        left: Math.min(dragStartX, e.clientX),
        top: Math.min(dragStartY, e.clientY),
        right: Math.max(dragStartX, e.clientX),
        bottom: Math.max(dragStartY, e.clientY)
      };
      removeDragBox();
      selectElementsInRect(boxRect);
      isDragging = false;
      isMouseDown = false;
      justFinishedDragging = true;
      setTimeout(() => {
        justFinishedDragging = false;
      }, 50);
    } else {
      isMouseDown = false;
    }
  }

  function stopSelection(fullyCancel) {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("click", clickHandler, true);
    document.removeEventListener("mousedown", mouseDownHandler, true);
    document.removeEventListener("mouseup", mouseUpHandler, true);
    document.removeEventListener("keydown", escapeHandler);
    
    isMouseDown = false;
    isDragging = false;
    justFinishedDragging = false;
    removeDragBox();

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
      window.hasStartedSelection = false;
    }
  }

  function startSelection() {
    window.hasInjectedElementSelector = true;
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("mousedown", mouseDownHandler, true);
    document.addEventListener("mouseup", mouseUpHandler, true);
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

  // 마우스 이동 시 하이라이트 효과 적용 및 드래그 박스 갱신
  function mouseMoveHandler(e) {
    if (isMouseDown) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const dist = Math.hypot(dx, dy);

      if (dist >= DRAG_THRESHOLD) {
        if (!isDragging) {
          isDragging = true;
          // 호버링 중이던 요소 스타일 복원
          if (highlightedElement && !isElementSelected(highlightedElement)) {
            highlightedElement.style.outline = originalOutline;
            highlightedElement.style.backgroundColor = originalBackgroundColor;
            highlightedElement = null;
          }
          createDragBox(e.clientX, e.clientY);
        }
        updateDragBox(e.clientX, e.clientY);
        return; // 드래그 중에는 호버 하이라이트 로직을 수행하지 않음
      }
    }

    if (isDragging) return;

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

    highlightedElement.style.outline = "2px dashed #E65100";
    highlightedElement.style.backgroundColor = "rgba(230, 81, 0, 0.1)";
  }

  // 클릭 시 요소 추출 및 변환
  function clickHandler(e) {
    if (justFinishedDragging || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const clickedEl = e.target;

    // 다중 선택 토글 (Ctrl 또는 Mac Cmd 키)
    if (e.ctrlKey || e.metaKey) {
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
        // 선택 완료 스타일 적용 (오렌지 굵은 테두리)
        clickedEl.style.outline = "3px solid #FF5A00";
        clickedEl.style.backgroundColor = "rgba(255, 90, 0, 0.15)";
      }
      updateFloatingButton();
      return; // 다중 선택 시에는 여기서 이벤트를 끝냄
    }

    // Ctrl/Cmd 키를 누르지 않았을 때
    if (selectedElements.length > 0) {
      // 다중 선택 중이었는데 Ctrl 없이 마지막 요소를 클릭한 경우
      if (!isElementSelected(clickedEl)) {
        selectedElements.push({
          element: clickedEl,
          originalOutline: originalOutline,
          originalBackgroundColor: originalBackgroundColor
        });
        clickedEl.style.outline = "3px solid #FF5A00";
        clickedEl.style.backgroundColor = "rgba(255, 90, 0, 0.15)";
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
    
    const htmlContent = elementsArray.map(el => el.outerHTML).join('\n\n<hr>\n\n');
    processHTML(htmlContent);
  }

  async function processHTML(htmlContent) {
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

    // 저장된 설정 및 일회용 모드 확인
    const localConfig = await chrome.storage.local.get(["translateMode"]);
    const activeMode = window.currentTranslateMode || localConfig.translateMode || 'original';
    const isTranslating = activeMode !== 'original';

    let isCancelled = false;

    // 즉시 미리보기 모달 오픈 (0.01초 만에 화면에 모달 표시)
    const modalController = showPreviewModal(
      isTranslating ? "" : markdownContent, 
      isTranslating, 
      () => { isCancelled = true; }
    );

    // 번역 모드인 경우 백그라운드 번역 요청 후 완료 시 모달 갱신
    if (isTranslating) {
      chrome.runtime.sendMessage({
        action: "download_md",
        markdown: markdownContent,
        mode: activeMode
      }, (response) => {
        if (isCancelled) return;

        if (response && response.markdown) {
          modalController.updateContent(response.markdown);
        } else {
          modalController.updateContent(markdownContent); // 오류 발생 시 원본 마크다운 표시
        }
      });
    }
  }

  // 우클릭 메뉴(Context Menu) 및 팝업으로부터의 메시지 수신
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (typeof I18N !== "undefined") {
      I18N.getEffectiveLanguage().then(lang => { currentLang = lang; });
    }

    if (request.action === "process_context_selection") {
      window.isContextMenuTriggered = true; // 우클릭 메뉴를 통한 실행임을 기록
      window.currentTranslateMode = request.mode; // 일회용 변환 모드 저장
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement("div");
        div.appendChild(range.cloneContents());
        
        // 현재 호버 선택 모드 중이라면 끄기
        stopSelection(true); 
        
        processHTML(div.innerHTML);
      }
    } else if (request.action === "start_hover_selection") {
      window.isContextMenuTriggered = false; // 팝업을 통한 실행
      window.currentTranslateMode = request.mode; // 팝업에서 선택한 일회용 모드 저장
      if (!window.hasStartedSelection) {
        window.hasStartedSelection = true;
        startSelection();
      }
    }
  });

}
