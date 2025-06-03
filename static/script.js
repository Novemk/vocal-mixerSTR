// ============================================================
//  📜 script.js v1.2 - 清唱混音網站 前端邏輯
//  ✅ 增量支援：key選擇、使用者名稱傳送
//  ✅ 原功能保留：格式選擇、延遲、進度條、下載連結
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const delayInput = document.getElementById("delayInput");
  const audioFile = document.getElementById("audioFile");
  const keySelect = document.getElementById("keySelect");
  const usernameInput = document.getElementById("usernameInput");

  const mp3Btn = document.getElementById("mp3Btn");
  const mp4Btn = document.getElementById("mp4Btn");
  const synthesizeBtn = document.getElementById("synthesizeBtn");
  const statusText = document.getElementById("status");
  const downloadSection = document.getElementById("downloadSection");
  const processingStatus = document.getElementById("processingStatus");
  const timer = document.getElementById("timer");
  const progressBar = document.getElementById("progress");

  let outputType = "MP3";
  let timerInterval;

  // 🎞️ 切換輸出格式按鈕狀態
  mp3Btn.addEventListener("click", function () {
    outputType = "MP3";
    mp3Btn.classList.add("active");
    mp4Btn.classList.remove("active");
  });

  mp4Btn.addEventListener("click", function () {
    outputType = "MP4";
    mp4Btn.classList.add("active");
    mp3Btn.classList.remove("active");
  });

  // 🚀 發送合成請求
  synthesizeBtn.addEventListener("click", async function () {
    const file = audioFile.files[0];
    if (!file) {
      alert("請先選擇音訊檔案");
      return;
    }

    // 🕒 初始化處理進度與 UI
    statusText.style.display = "none";
    downloadSection.innerHTML = "";
    processingStatus.textContent = "處理中...";
    progressBar.style.width = "0%";
    let elapsed = 0;
    timer.textContent = `已經處理時間：0 秒`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsed++;
      timer.textContent = `已經處理時間：${elapsed} 秒`;
    }, 1000);

    // 📦 準備表單資料
    const formData = new FormData();
    formData.append("file", file);
    formData.append("delay", delayInput.value);
    formData.append("output_type", outputType);
    formData.append("key", keySelect.value);
    formData.append("username", usernameInput.value);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      clearInterval(timerInterval);
      progressBar.style.width = "100%";

      if (result.status === "done") {
        processingStatus.textContent = "✅ 合成完成！";
        statusText.style.display = "block";
        statusText.addEventListener("click", function () {
          window.location.href = `/download/${result.file}`;
        });
      } else {
        processingStatus.textContent = "❌ 發生錯誤：" + result.message;
      }
    } catch (error) {
      clearInterval(timerInterval);
      processingStatus.textContent = "❌ 請求失敗，請稍後再試。";
      console.error("上傳失敗：", error);
    }
  });
});
