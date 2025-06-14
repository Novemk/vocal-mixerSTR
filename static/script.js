// ============================================================
//  📜 script.js v1.3 - 清唱混音網站 前端邏輯
//  ✅ 增量支援：key選擇、使用者名稱傳送、安全處理空值（保留所有原功能）
// ============================================================

let outputType = 'MP3';
let timer = 0;
let interval;

// 🎛️ UI 元件取得
const mp3Btn = document.getElementById('mp3Btn');
const mp4Btn = document.getElementById('mp4Btn');
const synthBtn = document.getElementById('synthesizeButton');
const fileInput = document.getElementById('audioFile');
const statusText = document.getElementById('status');
const progressBar = document.getElementById('progress');
const timerText = document.getElementById('timer');
const downloadSection = document.getElementById('downloadSection');
const delayInput = document.getElementById('delayInput');
const keySelect = document.getElementById('keySelect');          // ✅ 新增 Key
const usernameInput = document.getElementById('usernameInput');  // ✅ 新增 使用者名稱

// ✅ 防呆：限制延遲秒數最多 20 秒
delayInput.addEventListener("input", () => {
  if (parseFloat(delayInput.value) > 20) {
    delayInput.value = 20;
  }
});

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

  // ✅ 安全處理欄位值
  let delay = parseFloat(delayInput.value.trim());
  if (isNaN(delay) || delay < 0) delay = 0;

  const username = usernameInput.value.trim();

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('output_type', outputType);
  formData.append('delay', delay);
  formData.append('key', keySelect.value);
  formData.append('username', username);

  statusText.textContent = '混音合成中，需 1~2 分鐘內，請耐心等候。';
  statusText.style.cursor = 'default';
  progressBar.style.width = '0%';
  downloadSection.innerHTML = '';
  timer = 0;

  interval = setInterval(() => {
    timer++;
    timerText.textContent = `已經處理時間：${timer} 秒`;
    let percent = Math.min(100, timer * 1.2); // 會更快顯示滿格
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

// ✅ 初始化合成按鈕綁定
synthBtn.onclick = originalSynthesizeFunction;
