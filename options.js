// 설정 불러오기
document.addEventListener('DOMContentLoaded', () => {
  // API 키는 sync 스토리지에서
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });
  
  // 저장 방식은 local 스토리지에서 (팝업과 연동)
  chrome.storage.local.get(['translateMode'], (result) => {
    if (result.translateMode) {
      document.getElementById('translateMode').value = result.translateMode;
    }
  });
});

// 설정 저장하기
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const translateMode = document.getElementById('translateMode').value;
  
  // 두 스토리지에 각각 저장
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    chrome.storage.local.set({ translateMode: translateMode }, () => {
      const status = document.getElementById('status');
      status.textContent = '설정이 저장되었습니다.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
