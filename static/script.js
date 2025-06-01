let outputType = 'MP3';
let timer = 0;
let interval;

document.getElementById('mp3Btn').onclick = function () {
    outputType = 'MP3';
    this.classList.add('active');
    document.getElementById('mp4Btn').classList.remove('active');
};

document.getElementById('mp4Btn').onclick = function () {
    outputType = 'MP4';
    this.classList.add('active');
    document.getElementById('mp3Btn').classList.remove('active');
};

document.getElementById('startBtn').onclick = function () {
    const fileInput = document.getElementById('audioFile');
    if (!fileInput.files.length) {
        alert('請選擇檔案');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('output_type', outputType);

    document.getElementById('status').textContent = '混音合成中，需 1~2 分鐘內，請耐心等候。';
    document.getElementById('progress').style.width = '0%';
    timer = 0;
    interval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = `已經處理時間：${timer} 秒`;
        let percent = Math.min(100, timer * 1.5); // 模擬進度
        document.getElementById('progress').style.width = percent + '%';
    }, 1000);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        clearInterval(interval);
        document.getElementById('status').textContent = '合成完成！點我下載檔案';
        document.getElementById('status').style.cursor = 'pointer';
        document.getElementById('status').onclick = () => {
            window.location.href = `/download/${data.file}`;
        };
    });
};
