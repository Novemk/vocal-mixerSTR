// script.js

const uploadInput = document.getElementById("vocal");
const fileLabel = document.getElementById("file-label");
const singerInput = document.getElementById("singer");
const outputButtons = document.querySelectorAll(".output-btn");
const startButton = document.getElementById("start-btn");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const progressSection = document.getElementById("progress-section");
const elapsedTime = document.getElementById("elapsed-time");
const tipText = document.getElementById("tip-text");
const downloadLink = document.getElementById("download-link");

let selectedOutput = "mp3";
let startTime = null;

uploadInput.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (file) {
        fileLabel.textContent = `${file.name}`;
    }
});

outputButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        outputButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedOutput = btn.getAttribute("data-output");
    });
});

startButton.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) return alert("請選擇一個清唱音檔");

    startButton.disabled = true;
    uploadInput.disabled = true;
    singerInput.disabled = true;
    outputButtons.forEach(b => b.disabled = true);

    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    tipText.style.display = "block";
    progressSection.style.display = "block";
    downloadLink.style.display = "none";
    startTime = Date.now();
    updateElapsedTime();
    const timerInterval = setInterval(updateElapsedTime, 1000);

    const formData = new FormData();
    formData.append("vocal", file);
    formData.append("singer", singerInput.value);
    formData.append("output", selectedOutput);

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    clearInterval(timerInterval);
    if (!response.ok) {
        alert("合成失敗，請稍後再試");
        location.reload();
        return;
    }

    const result = await response.json();
    progressBar.style.width = "100%";
    progressText.textContent = "100%";
    downloadLink.href = result.video_url;
    downloadLink.style.display = "inline-block";
});

function updateElapsedTime() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    elapsedTime.textContent = `${seconds} 秒`;

    const percentage = Math.min(100, Math.floor((seconds / 90) * 100));
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
}
