let outputType = 'MP3';
let timer = 0;
let interval;

const mp3Btn = document.getElementById('mp3Btn');
const mp4Btn = document.getElementById('mp4Btn');
const synthBtn = document.getElementById('synthesizeBtn');
const fileInput = document.getElementById('audioFile');
const statusText = document.getElementById('status');
const progressBar = document.getElementById('progress');
const timerText = document.getElementById('timer');
const downloadSection = document.getElementById('downloadSection');
const delayInput = document.getElementById('delayInput');

// ✅ 預設禁用按鈕（若未選檔案）
synthBtn.disabled = true;

// ✅ 檔案選擇變動 → 更新按鈕狀態
fileInput.addEventListener('change', () => {
  synthBtn.disabled = !fileInput.files.length;
  synthBtn.innerText = '開始合成';
  synthBtn.onclick = originalSynthesizeFunction;
});

// ✅ 切換格式
mp3Btn.onclick = () => {
  outputType = 'MP3';
  mp3Btn.classList.add('active');
  mp4Btn.classList.remove('active');
};
mp4Btn.onclick = () => {
  outputType = 'MP4';
  mp4Btn.classList.add('active');
  mp3Btn.classList.remove('active');
};

// ✅ 合成流程
function originalSynthesizeFunction() {
  console.log("🔘 合成按鈕被點擊了");

  // 防呆：沒檔案就跳警告，不執行後續
  if (!fileInput.files.length) {
    console.log("⚠️ 沒選檔案，應跳出 alert");
    alert('請選擇檔案');
    synthBtn.disabled = true;
    return;
  }

  synthBtn.disabled = true;
  synthBtn.innerText = '合成中...';

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('output_type', outputType);
  formData.append('delay', delayInput.value);

  statusText.textContent = '混音合成中，需 1~2 分鐘內，請耐心等候。';
  statusText.style.cursor = 'default';
  progressBar.style.width = '0%';
  downloadSection.innerHTML = '';
  timer = 0;

  interval = setInterval(() => {
    timer++;
    timerText.textContent = `已經處理時間：${timer} 秒`;
    let percent = Math.min(100, timer * 3); // 會更快顯示滿格
    progressBar.style.width = percent + '%';
  }, 1000);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
  clearInterval(interval);
  progressBar.style.width = '100%';

  const now = new Date();
  const formattedTime = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename = `CETRO - 5.M.A - CHALLENGE ${formattedTime}.${outputType.toLowerCase()}`;
  const fileURL = `/download/${data.file}`;

  // ✅ 合成完成：改為下載按鈕
  synthBtn.innerText = '合成完成！點我下載檔案';
  synthBtn.disabled = false;

  // ✅ 點擊後觸發下載，然後重設為初始狀態
  synthBtn.onclick = () => {
    window.location.href = fileURL;

    // 重設狀態（重新綁定原始合成功能）
    fileInput.value = '';
    fileInput.dispatchEvent(new Event('change'));
    outputType = 'MP3';
    mp3Btn.classList.add('active');
    mp4Btn.classList.remove('active');
    progressBar.style.width = '0%';
    timerText.textContent = '已經處理時間：0 秒';
    statusText.textContent = '';
    synthBtn.innerText = '開始合成';
    synthBtn.disabled = true;
    synthBtn.onclick = originalSynthesizeFunction;
  };
})

    .catch(err => {
      clearInterval(interval);
      console.error('合成失敗', err);
      synthBtn.innerText = '合成失敗，請重試';
      setTimeout(() => {
        synthBtn.innerText = '開始合成';
        synthBtn.disabled = !fileInput.files.length;
      }, 3000);
    });
}

synthBtn.onclick = originalSynthesizeFunction;
