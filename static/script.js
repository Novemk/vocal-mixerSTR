document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status');
  const resultLink = document.getElementById('result');
  const downloadLink = document.getElementById('download');

  progress.style.display = 'block';
  statusText.innerText = "混音合成中，需 1~2 分鐘內，請耐心等候。";
  resultLink.innerHTML = '';
  downloadLink.style.display = 'none';

  // 模擬進度條：每 500ms 增加進度
  let percent = 0;
  const interval = setInterval(() => {
    if (percent < 99) {
      percent += Math.random() * 3;
      progressBar.style.width = `${Math.floor(percent)}%`;
      progressBar.innerText = `${Math.floor(percent)}%`;
    }
  }, 500);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      clearInterval(interval);
      if (data.video_url || data.audio_url) {
        progressBar.style.width = `100%`;
        progressBar.innerText = `100%`;

        const url = data.video_url || data.audio_url;
        resultLink.innerHTML = `<a href="${url}" target="_blank">🔗 點此下載成品</a>`;
        downloadLink.href = url;
        downloadLink.style.display = 'inline-block';
        statusText.innerText = "混音完成 🎉";
      } else if (data.error) {
        statusText.innerText = `錯誤：${data.error}`;
      }
    })
    .catch(err => {
      clearInterval(interval);
      statusText.innerText = `發生錯誤：${err}`;
    });
});
