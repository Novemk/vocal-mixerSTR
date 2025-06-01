let selectedFormat = "MP3";
let uploadedFilePath = "";
let pollingInterval = null;

// 檔案上傳按鈕
document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  const result = await res.json();
  if (result.success) {
    uploadedFilePath = result.filepath;
    document.getElementById("fileNameDisplay").innerText = `已上傳檔案：${result.filename}`;
  } else {
    alert("上傳失敗，請重試");
  }
});

// 格式選擇按鈕切換樣式
document.querySelectorAll(".format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".format-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedFormat = btn.dataset.format;
  });
});

// 開始合成
document.getElementById("startBtn").addEventListener("click", async () => {
  if (!uploadedFilePath) {
    alert("請先上傳清唱音檔");
    return;
  }

  document.getElementById("statusMsg").style.display = "block";
  document.getElementById("downloadLink").style.display = "none";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("timeDisplay").innerText = "已經處理時間：0秒";

  await fetch("/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filepath: uploadedFilePath,
      format: selectedFormat,
    }),
  });

  pollingInterval = setInterval(checkProgress, 1000);
});

async function checkProgress() {
  const res = await fetch("/progress");
  const data = await res.json();

  document.getElementById("progressBar").style.width = `${data.percent}%`;
  document.getElementById("timeDisplay").innerText = `已經處理時間：${Math.floor(data.seconds)}秒`;

  if (data.percent >= 100 && data.status === "done") {
    clearInterval(pollingInterval);
    document.getElementById("downloadLink").style.display = "block";
    document.getElementById("downloadLink").href = "/download";
  }
}
