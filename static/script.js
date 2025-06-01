<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CETRO Vocal Mixer</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CETRO - 5.M.A [reimagined] Challenge</h1>
    </div>

    <div class="upload-section">
      <label for="vocal">請上傳清唱音檔 (mp3或wav)</label>
      <input type="file" id="vocal" name="vocal" accept=".mp3,.wav" onchange="handleFileChange(this)" />
      <span id="file-name-display">上傳檔案：檔名</span>
    </div>

    <div class="singer-section">
      <label for="singer">請輸入歌唱者名稱</label>
      <input type="text" id="singer" name="singer" placeholder="例如：Cetro - 5.M.A" />
    </div>

    <div class="format-section">
      <label for="format">選擇輸出格式</label>
      <select id="format">
        <option value="mp3">MP3（較快完成）</option>
        <option value="mp4">MP4（1:1影片）</option>
      </select>
    </div>

    <div class="action-section">
      <button id="submit-btn">開始混音</button>
    </div>

    <div class="progress-section hidden" id="progress-container">
      <p id="wait-message">混音合成中，需 1~2 分鐘內，請耐心等候。</p>
      <div class="progress-bar">
        <div class="progress-inner" id="progress-inner"></div>
      </div>
      <p id="progress-text">0%</p>
      <p id="elapsed-time">已經處理時間：0 秒</p>
    </div>

    <div class="download-section hidden" id="download-container">
      <a id="download-link" href="#" download>下載合成檔案</a>
    </div>
  </div>

  <script>
    function handleFileChange(input) {
      const fileDisplay = document.getElementById("file-name-display");
      if (input.files && input.files[0]) {
        fileDisplay.textContent = `上傳檔案：${input.files[0].name}`;
      } else {
        fileDisplay.textContent = "上傳檔案：檔名";
      }
    }
  </script>
  <script src="/static/script.js"></script>
</body>
</html>
