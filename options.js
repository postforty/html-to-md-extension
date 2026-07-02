// 설정 불러오기
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });
});

// 설정 저장하기
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = '저장되었습니다.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});
