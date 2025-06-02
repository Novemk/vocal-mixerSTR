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

synthBtn.onclick = () => {
    if (synthBtn.disabled) return;
    if (!fileInput.files.length) {
        alert('請選擇檔案');
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
        let percent = Math.min(100, timer * 1.2);
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

        const a = document.createElement('a');
        a.href = `/download/${data.file}`;
        a.download = filename;
        a.textContent = '合成完成！點我下載檔案';
        a.className = 'download-btn';
        downloadSection.innerHTML = '';
        downloadSection.appendChild(a);

        synthBtn.disabled = false;
        synthBtn.innerText = '開始合成';
    })
    .catch(err => {
        clearInterval(interval);
        console.error('合成失敗', err);
        synthBtn.innerText = '合成失敗，請重試';
        setTimeout(() => {
            synthBtn.innerText = '開始合成';
            synthBtn.disabled = false;
        }, 3000);
    });
};
