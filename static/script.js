document.addEventListener("DOMContentLoaded", function () {
  const vocalInput = document.getElementById("vocal");
  const filenameDisplay = document.getElementById("filename");
  const formatButtons = document.querySelectorAll(".format-button");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const timeDisplay = document.getElementById("elapsed-time");
  const submitBtn = document.getElementById("submitBtn");
  const reminderText = document.getElementById("reminder-text");
  const downloadLink = document.getElementById("download-link");
  const form = document.getElementById("upload-form");

  let selectedFormat = "mp3";
  let interval = null;
  let startTime = null;

  vocalInput.addEventListener("change", function () {
    const file = this.files[0];
    filenameDisplay.innerText = file ? file.name : "未選擇檔案";
  });

  formatButtons.forEach(button => {
    button.addEventListener("click", function () {
      formatButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      selectedFormat = this.dataset.format;
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    formData.append("format", selectedFormat);

    submitBtn.disabled = true;
    vocalInput.disabled = true;
    formatButtons.forEach(btn => btn.disabled = true);
    reminderText.style.display = "block";
    progressBar.style.width = "0%";
    progressText.innerText = "0%";
    timeDisplay.innerText = "已處理時間：0 秒";
    downloadLink.style.display = "none";

    let progress = 0;
    startTime = Date.now();

    interval = setInterval(() => {
      progress += 2 + Math.random() * 3;
      if (progress >= 99) progress = 99;
      progressBar.style.width = progress + "%";
      progressText.innerText = Math.floor(progress) + "%";
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      timeDisplay.innerText = `已處理時間：${seconds} 秒`;
    }, 500);

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        clearInterval(interval);
        progressBar.style.width = "100%";
        progressText.innerText = "100%";
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        timeDisplay.innerText = `總處理時間：${seconds} 秒`;

        if (data.video_url || data.audio_url) {
          downloadLink.href = data.video_url || data.audio_url;
          downloadLink.style.display = "inline-block";
        } else {
          alert("處理失敗，請稍後再試。");
        }

        submitBtn.disabled = false;
        vocalInput.disabled = false;
        formatButtons.forEach(btn => btn.disabled = false);
      })
      .catch(err => {
        clearInterval(interval);
        alert("處理過程中發生錯誤。");
        submitBtn.disabled = false;
        vocalInput.disabled = false;
        formatButtons.forEach(btn => btn.disabled = false);
      });
  });
});
