// script.js

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("vocal");
  const fileNameDisplay = document.getElementById("file-name");
  const singerInput = document.getElementById("singer");
  const outputOptions = document.querySelectorAll(".output-option");
  const startButton = document.getElementById("start-button");
  const downloadLink = document.getElementById("download-link");
  const progressBar = document.getElementById("progress-bar");
  const progressPercent = document.getElementById("progress-percent");
  const statusMessage = document.getElementById("status-message");
  const elapsedTimeDisplay = document.getElementById("elapsed-time");

  let selectedOutput = "mp4";

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      fileNameDisplay.textContent = file.name;
    }
  });

  outputOptions.forEach((option) => {
    option.addEventListener("click", () => {
      outputOptions.forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedOutput = option.dataset.format;
    });
  });

  startButton.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const singer = singerInput.value.trim() || "Unknown Artist";

    if (!file) {
      alert("請先上傳清唱檔案。");
      return;
    }

    startButton.disabled = true;
    fileInput.disabled = true;
    singerInput.disabled = true;
    outputOptions.forEach((o) => (o.style.pointerEvents = "none"));
    downloadLink.style.display = "none";

    statusMessage.textContent = "混音合成中，需 1~2 分鐘內，請耐心等候。";
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    elapsedTimeDisplay.textContent = "0 秒";

    let startTime = Date.now();
    let timer = setInterval(() => {
      let elapsed = Math.floor((Date.now() - startTime) / 1000);
      elapsedTimeDisplay.textContent = `${elapsed} 秒`;
    }, 1000);

    let progress = 0;
    let fakeProgress = setInterval(() => {
      if (progress < 95) {
        progress += Math.random() * 2;
        progress = Math.min(progress, 95);
        progressBar.style.width = `${progress.toFixed(0)}%`;
        progressPercent.textContent = `${progress.toFixed(0)}%`;
      }
    }, 500);

    const formData = new FormData();
    formData.append("vocal", file);
    formData.append("singer", singer);
    formData.append("format", selectedOutput);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.video_url || data.audio_url) {
        clearInterval(fakeProgress);
        clearInterval(timer);
        progressBar.style.width = `100%`;
        progressPercent.textContent = `100%`;
        statusMessage.textContent = "合成完成！點選下方按鈕下載。";
        downloadLink.href = data.video_url || data.audio_url;
        downloadLink.style.display = "block";
      } else {
        throw new Error(data.error || "未知錯誤");
      }
    } catch (e) {
      clearInterval(fakeProgress);
      clearInterval(timer);
      statusMessage.textContent = `發生錯誤：${e.message}`;
      console.error(e);
    }

    startButton.disabled = false;
    fileInput.disabled = false;
    singerInput.disabled = false;
    outputOptions.forEach((o) => (o.style.pointerEvents = "auto"));
  });
});
