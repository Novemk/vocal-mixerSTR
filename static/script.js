let selectedFormat = "MP3";
let uploadedFilePath = "";
let pollingInterval = null;

// 上傳按鈕綁定點擊
document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

// 檔案變動觸發上傳
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

// 格式選擇切換
document.querySelectorAll(".format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".format-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedFormat = btn.dataset.format;
  });
});

// 開始合成按鈕
document.getElementById("startBtn").addEventListener("click", async () => {
  if (!uploadedFilePath) {
    alert("請先上傳清唱音檔");
    return;
  }

  // 初始化畫面
  document.getElementById("statusMsg").style.display = "block";
  document.getElementById("statusMsg").innerText = "正在合成中，請稍候...";
  document.getElementById("downloadLink").style.display = "none";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("timeDisplay").innerText = "已經處理時間：0秒";

  // 呼叫後端開始合成
  await fetch("/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filepath: uploadedFilePath,
      format: selectedFormat,
    }),
  });

  // 啟動進度輪詢
  pollingInterval = setInterval(checkProgress, 1000);
});

// 每秒查詢進度
async function checkProgress() {
  const res = await fetch("/progress");
  const data = await res.json();

  const percent = Math.floor(data.percent);
  const seconds = Math.floor(data.seconds);

  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("timeDisplay").innerText = `已經處理時間：${seconds}秒`;
  document.getElementById("statusMsg").innerText = `目前進度：${percent}%`;

  if (percent >= 100 && data.status === "done") {
    clearInterval(pollingInterval);
    document.getElementById("downloadLink").style.display = "block";
    document.getElementById("downloadLink").href = "/download";
    document.getElementById("statusMsg").innerText = "✅ 合成完成，可下載！";
  }

  if (data.status === "error") {
    clearInterval(pollingInterval);
    document.getElementById("statusMsg").innerText = "❌ 合成失敗（音訊過長或格式錯誤）";
  }
}
