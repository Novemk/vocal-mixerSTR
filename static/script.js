document.addEventListener("DOMContentLoaded", () => {
  const vocalInput = document.getElementById("vocal");
  const fileNameDisplay = document.getElementById("file-name-display");
  const formatSelect = document.getElementById("format");
  const submitBtn = document.getElementById("submitBtn");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const timerDisplay = document.getElementById("timerDisplay");
  const downloadLink = document.getElementById("downloadLink");
  const statusMessage = document.getElementById("statusMessage");

  let interval;

  vocalInput.addEventListener("change", () => {
    if (vocalInput.files && vocalInput.files[0]) {
      fileNameDisplay.textContent = `上傳檔案：${vocalInput.files[0].name}`;
    } else {
      fileNameDisplay.textContent = "上傳檔案：檔名";
    }
  });

  formatSelect.addEventListener("change", () => {
    document.querySelectorAll(".format-option").forEach(opt => {
      opt.classList.remove("selected");
    });
    formatSelect.selectedOptions[0].parentElement.classList.add("selected");
  });

  submitBtn.addEventListener("click", async () => {
    const formData = new FormData(document.getElementById("uploadForm"));
    const format = formatSelect.value;

    submitBtn.disabled = true;
    formatSelect.disabled = true;
    vocalInput.disabled = true;
    progressContainer.style.display = "block";
    downloadLink.style.display = "none";
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    statusMessage.textContent = "混音合成中，需 1~2 分鐘內，請耐心等候。";

    let startTime = Date.now();
    interval = setInterval(() => {
      let seconds = Math.floor((Date.now() - startTime) / 1000);
      timerDisplay.textContent = `已經處理時間：${seconds}秒`;
    }, 1000);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      clearInterval(interval);
      submitBtn.disabled = false;
      formatSelect.disabled = false;
      vocalInput.disabled = false;
      progressBar.style.width = "100%";
      progressText.textContent = "100%";

      if (data.video_url) {
        downloadLink.href = data.video_url;
        downloadLink.style.display = "block";
      } else {
        statusMessage.textContent = "發生錯誤，請重試。";
      }
    } catch (error) {
      clearInterval(interval);
      statusMessage.textContent = "處理過程中發生錯誤。";
      console.error("Upload error:", error);
    }
  });
});
