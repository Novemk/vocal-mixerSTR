let selectedFormat = "MP3";
let uploadedFilePath = "";
let pollingInterval = null;

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const formatBtns = document.querySelectorAll(".format-btn");
const startBtn = document.getElementById("startBtn");
const downloadLink = document.getElementById("downloadLink");
const progressBar = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const elapsedTime = document.getElementById("elapsedTime");
const errorMsg = document.getElementById("errorMsg");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  fileName.textContent = file.name;
  errorMsg.textContent = "";
  downloadLink.style.display = "none";

  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        uploadedFilePath = data.filepath;
      } else {
        errorMsg.textContent = data.message || "上傳失敗";
      }
    })
    .catch((err) => {
      console.error(err);
      errorMsg.textContent = "檔案上傳錯誤";
    });
});

formatBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    formatBtns.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedFormat = btn.dataset.format;
  });
});

startBtn.addEventListener("click", () => {
  if (!uploadedFilePath) {
    errorMsg.textContent = "請先上傳音訊檔案";
    return;
  }

  fetch("/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath: uploadedFilePath, format: selectedFormat }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        errorMsg.textContent = "";
        pollingInterval = setInterval(checkProgress, 500);
      } else {
        errorMsg.textContent = data.message || "合成啟動失敗";
      }
    })
    .catch((err) => {
      console.error(err);
      errorMsg.textContent = "發送合成請求錯誤";
    });
});

function checkProgress() {
  fetch("/progress")
    .then((res) => res.json())
    .then((data) => {
      progressBar.style.width = `${data.percent}%`;
      progressText.textContent = `處理進度：${data.percent}%`;
      elapsedTime.textContent = `已處理時間：${Math.floor(data.seconds)} 秒`;

      if (data.status === "done") {
        clearInterval(pollingInterval);
        downloadLink.href = "/download";
        downloadLink.style.display = "inline-block";
      } else if (data.status === "error") {
        clearInterval(pollingInterval);
        errorMsg.textContent = "合成失敗，請確認檔案格式與長度";
      }
    })
    .catch((err) => {
      console.error(err);
      clearInterval(pollingInterval);
      errorMsg.textContent = "進度查詢錯誤";
    });
}
