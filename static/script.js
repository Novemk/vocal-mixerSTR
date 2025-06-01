const vocalInput = document.getElementById("vocal");
const fileNameDisplay = document.getElementById("file-name");
const formatButtons = document.querySelectorAll(".format-btn");
const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status-text");
const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const progressContainer = document.querySelector(".progress-container");
const elapsedTime = document.querySelector(".elapsed-time");
const elapsedTimeSpan = document.getElementById("time");
const downloadLink = document.getElementById("download-link");
let selectedFormat = "mp3";

// 檔案顯示
vocalInput.addEventListener("change", () => {
  const file = vocalInput.files[0];
  if (file) {
    fileNameDisplay.textContent = `上傳檔案：${file.name}`;
  }
});

// 選擇格式
formatButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    formatButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedFormat = btn.dataset.format;
  });
});

// 開始合成
startBtn.addEventListener("click", () => {
  const file = vocalInput.files[0];
  const singer = document.getElementById("singer").value;

  if (!file || !singer) {
    alert("請選擇檔案並輸入歌唱者名稱");
    return;
  }

  // 鎖定
  startBtn.disabled = true;
  vocalInput.disabled = true;
  formatButtons.forEach((btn) => (btn.disabled = true));

  statusText.classList.remove("hidden");
  progressContainer.classList.remove("hidden");
  elapsedTime.classList.remove("hidden");
  downloadLink.classList.add("hidden");

  // 時間
  let seconds = 0;
  const timer = setInterval(() => {
    seconds++;
    elapsedTimeSpan.textContent = seconds;
  }, 1000);

  // 模擬進度條
  let progress = 0;
  const progressTimer = setInterval(() => {
    if (progress < 95) {
      progress += Math.random() * 3;
      progressBar.style.width = `${progress}%`;
      progressPercent.textContent = `${Math.floor(progress)}%`;
    }
  }, 500);

  // 上傳資料
  const formData = new FormData();
  formData.append("vocal", file);
  formData.append("singer", singer);
  formData.append("format", selectedFormat);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      clearInterval(timer);
      clearInterval(progressTimer);
      progressBar.style.width = `100%`;
      progressPercent.textContent = `100%`;

      if (data.video_url) {
        downloadLink.href = data.video_url;
        downloadLink.classList.remove("hidden");
      } else if (data.audio_url) {
        downloadLink.href = data.audio_url;
        downloadLink.classList.remove("hidden");
      } else {
        alert("合成失敗！");
      }
    })
    .catch((err) => {
      clearInterval(timer);
      clearInterval(progressTimer);
      alert("合成錯誤：" + err.message);
    });
});
