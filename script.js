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
    percent = Math.min(percent + Math.random() * 10, 90);
    bar.style.width = `${percent.toFixed(1)}%`;
  }, 500);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    clearInterval(interval);
    bar.style.width = '100%';
    statusText.textContent = '✅ 混音完成！準備下載…';

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = 'vocal_mix.mp4';
      result.classList.remove('hidden');
    } else {
      throw new Error('伺服器錯誤，請稍後再試');
    }
  } catch (err) {
    clearInterval(interval);
    bar.style.width = '0%';
    statusText.textContent = `❌ 發生錯誤：${err.message}`;
  }
});
