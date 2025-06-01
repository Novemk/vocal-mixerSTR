// script.js

const uploadInput = document.getElementById("vocal");
const uploadLabel = document.getElementById("upload-label");
const singerInput = document.getElementById("singer");
const mp3Btn = document.getElementById("mp3-option");
const mp4Btn = document.getElementById("mp4-option");
const startBtn = document.getElementById("start-btn");
const resultDiv = document.getElementById("result");
const downloadBtn = document.getElementById("download-btn");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const elapsedTime = document.getElementById("elapsed-time");
const notice = document.getElementById("processing-notice");

let selectedFormat = "mp4";

uploadInput.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (file) {
        uploadLabel.textContent = `上傳檔案：${file.name}`;
    }
});

mp3Btn.addEventListener("click", () => {
    selectedFormat = "mp3";
    mp3Btn.classList.add("selected");
    mp4Btn.classList.remove("selected");
});

mp4Btn.addEventListener("click", () => {
    selectedFormat = "mp4";
    mp4Btn.classList.add("selected");
    mp3Btn.classList.remove("selected");
});

startBtn.addEventListener("click", () => {
    const file = uploadInput.files[0];
    const singer = singerInput.value.trim();
    if (!file || !singer) {
        alert("請上傳檔案並填寫歌唱者名稱");
        return;
    }

    // Disable UI
    uploadInput.disabled = true;
    singerInput.disabled = true;
    mp3Btn.disabled = true;
    mp4Btn.disabled = true;
    startBtn.disabled = true;

    notice.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    elapsedTime.textContent = "已處理時間：0 秒";
    resultDiv.style.display = "none";
    downloadBtn.style.display = "none";

    const formData = new FormData();
    formData.append("vocal", file);
    formData.append("singer", singer);
    formData.append("format", selectedFormat);

    let percent = 0;
    let seconds = 0;

    const timer = setInterval(() => {
        seconds++;
        percent = Math.min(100, Math.floor((seconds / 90) * 100));
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
        elapsedTime.textContent = `已處理時間：${seconds} 秒`;
    }, 1000);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(timer);
        if (data.error) throw new Error(data.error);

        progressBar.style.width = `100%`;
        progressText.textContent = `100%`;
        downloadBtn.href = data.video_url;
        downloadBtn.style.display = "inline-block";
        resultDiv.style.display = "block";
    })
    .catch(err => {
        clearInterval(timer);
        alert("處理失敗：" + err.message);
    });
});
