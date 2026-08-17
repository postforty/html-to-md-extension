// 설정 불러오기 및 다국어 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 다국어 DOM 적용
  await I18N.initDOM();

  // 2. API 키, 모델 및 UI 언어 설정 불러오기 (sync 스토리지)
  chrome.storage.sync.get(['geminiApiKey', 'geminiModel', 'uiLanguage'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
    
    // 모델 설정 복원 (기본값: gemini-3.1-flash-lite)
    const modelInput = document.getElementById('geminiModel');
    modelInput.value = result.geminiModel || 'gemini-3.1-flash-lite';

    // UI 언어 복원
    const uiLang = result.uiLanguage || 'auto';
    document.getElementById('uiLanguage').value = uiLang;
  });
  
  // 3. 기본 저장 방식 불러오기 (local 스토리지)
  chrome.storage.local.get(['translateMode'], (result) => {
    if (result.translateMode) {
      document.getElementById('translateMode').value = result.translateMode;
    }
  });

  // 4. 언어 선택 변경 시 실시간 UI 미리보기 반영
  document.getElementById('uiLanguage').addEventListener('change', async (e) => {
    const selected = e.target.value;
    let targetLang = selected;
    if (selected === 'auto') {
      const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      targetLang = navLang.startsWith('ko') ? 'ko' : 'en';
    }
    I18N.applyI18nToDOM(document, targetLang);
  });

  // 5. 비밀번호 표시/숨기기 토글
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const apiKeyInput = document.getElementById('apiKey');
  const eyeIconOpen = document.getElementById('eyeIconOpen');
  const eyeIconClosed = document.getElementById('eyeIconClosed');
  
  if (toggleApiKeyBtn && apiKeyInput) {
    toggleApiKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        if (eyeIconOpen) eyeIconOpen.style.display = 'none';
        if (eyeIconClosed) eyeIconClosed.style.display = 'block';
      } else {
        apiKeyInput.type = 'password';
        if (eyeIconOpen) eyeIconOpen.style.display = 'block';
        if (eyeIconClosed) eyeIconClosed.style.display = 'none';
      }
    });
  }
});

// 설정 저장하기
document.getElementById('saveBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const rawModel = document.getElementById('geminiModel').value.trim();
  const selectedModel = rawModel || 'gemini-3.1-flash-lite';
  const translateMode = document.getElementById('translateMode').value;
  const uiLanguage = document.getElementById('uiLanguage').value;

  // sync 스토리지: API Key, Gemini Model, UI 언어 저장
  // local 스토리지: 기본 저장 방식 저장
  chrome.storage.sync.set({ 
    geminiApiKey: apiKey, 
    geminiModel: selectedModel,
    uiLanguage: uiLanguage 
  }, async () => {
    chrome.storage.local.set({ translateMode: translateMode }, async () => {
      // 우클릭 컨텍스트 메뉴 갱신 요청
      try {
        chrome.runtime.sendMessage({ action: "update_context_menus" });
      } catch (e) {
        // 백그라운드 워커가 비활성 상태일 경우 무시
      }

      const activeLang = await I18N.getEffectiveLanguage();
      I18N.applyI18nToDOM(document, activeLang);

      const status = document.getElementById('status');
      status.textContent = I18N.t('saveSuccess', [], activeLang);
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
