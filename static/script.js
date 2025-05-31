document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const progress = document.getElementById('progress');
  const bar = document.querySelector('.bar');
  const statusText = document.getElementById('statusText');
  const result = document.getElementById('result');
  const downloadLink = document.getElementById('downloadLink');

  progress.classList.remove('hidden');
  bar.style.width = '0%';
  statusText.textContent = '正在上傳與混音中…請稍候';
  result.classList.add('hidden');

  let percent = 0;
  const interval = setInterval(() => {
    percent = Math.min(percent + Math.random() * 10, 95);
    bar.style.width = `${percent.toFixed(1)}%`;
  }, 500);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    clearInterval(interval);
    bar.style.width = '100%';

    const data = await response.json();
    if (data.video_url) {
      statusText.textContent = '✅ 混音完成，點擊以下按鈕下載';
      downloadLink.href = data.video_url;
      downloadLink.download = "vocal_mix.mp4";
      result.classList.remove('hidden');
    } else {
      throw new Error(data.error || '合成失敗，請再試一次');
    }
  } catch (err) {
    clearInterval(interval);
    bar.style.width = '0%';
    statusText.textContent = `❌ 發生錯誤：${err.message}`;
  }
});

// 顯示已選檔名
const vocalInput = document.getElementById('vocal');
vocalInput.addEventListener('change', (e) => {
  const label = e.target.nextElementSibling;
  const file = e.target.files[0];
  if (file) {
    label.textContent = `🎵 已選擇：${file.name}`;
  } else {
    label.textContent = '📤 請選擇您的清唱音檔';
  }
});
