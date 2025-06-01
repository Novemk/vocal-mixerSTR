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

    // 禁用按鈕避免連點
    document.getElementById('startBtn').disabled = true;
    document.getElementById('status').style.cursor = 'default';
    document.getElementById('status').textContent = '混音合成中，需 1~2 分鐘內，請耐心等候。';

    // 顯示進度條與時間
    document.getElementById('progress').style.width = '0%';
    document.getElementById('timer').textContent = '已經處理時間：0 秒';
    timer = 0;

    interval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = `已經處理時間：${timer} 秒`;
        let percent = Math.min(100, timer * 1.5); // 模擬進度
        document.getElementById('progress').style.width = percent + '%';
    }, 1000);

    // 上傳與處理
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('output_type', outputType);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        clearInterval(interval);
        document.getElementById('startBtn').disabled = false;

        if (data.status === 'done') {
            // ✅ 強制進度條補齊
            document.getElementById('progress').style.width = '100%';

            document.getElementById('status').textContent = '合成完成！點我下載檔案';
            document.getElementById('status').style.cursor = 'pointer';
            document.getElementById('status').onclick = () => {
                window.location.href = `/download/${data.file}`;
            };
        } else {
            document.getElementById('status').textContent = '❌ 合成失敗，請稍後再試';
            document.getElementById('status').style.cursor = 'default';
        }
    })
    .catch(err => {
        clearInterval(interval);
        document.getElementById('startBtn').disabled = false;
        document.getElementById('status').textContent = '❌ 發生錯誤，請重新整理';
        document.getElementById('status').style.cursor = 'default';
        console.error('❌ 上傳失敗：', err);
    });
};
