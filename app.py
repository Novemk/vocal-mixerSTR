import os
import time
import requests
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from moviepy.editor import *
from pydub import AudioSegment

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ✅ 自動下載 bgm.mp3（來自 GitHub raw 連結）
def download_bgm_if_needed():
    bgm_path = "bgm.mp3"
    if not os.path.exists(bgm_path):
        print("🔄 自動下載 BGM 中...")
        url = "https://raw.githubusercontent.com/Novemk/vocal-mixerSTR/main/bgm.mp3"
        try:
            response = requests.get(url)
            response.raise_for_status()
            with open(bgm_path, 'wb') as f:
                f.write(response.content)
            print("✅ BGM 下載完成")
        except Exception as e:
            print("❌ 無法下載 BGM：", e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    download_bgm_if_needed()  # 🔁 確保背景音樂已下載

    file = request.files.get('file')
    output_type = request.form.get('output_type')

    if not file or output_type not in ['MP3', 'MP4']:
        return jsonify({'status': 'error', 'message': '無效的輸入資料'}), 400

    # 儲存上傳的清唱檔案
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # 輸出檔案路徑
    output_filename = f"output.{output_type.lower()}"
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)

    if output_type == "MP4":
        # 載入音訊
        vocal = AudioSegment.from_file(filepath)
        bgm = AudioSegment.from_file("bgm.mp3")

        # 限制長度：最多 90 秒（毫秒）
        max_duration_ms = 90 * 1000
        vocal = vocal[:max_duration_ms]
        bgm = bgm[:max_duration_ms]

        # 混音合成
        combined = bgm.overlay(vocal)
        temp_audio = os.path.join(OUTPUT_FOLDER, "temp_audio.mp3")
        combined.export(temp_audio, format="mp3")

        # 建立影片（固定長度）
        cover = ImageClip("default_cover.png", duration=90)
        cover = cover.set_audio(AudioFileClip(temp_audio))
        cover = cover.set_duration(90)
        cover = cover.set_fps(1)  # 低 FPS 以降低容量
        cover.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            bitrate="800k",
            threads=1,
            preset="ultrafast"
        )

    else:  # MP3
        vocal = AudioSegment.from_file(filepath)
        bgm = AudioSegment.from_file("bgm.mp3")
        combined = bgm.overlay(vocal)
        combined.export(output_path, format="mp3")

    return jsonify({'status': 'done', 'file': output_filename})

@app.route('/download/<filename>')
def download(filename):
    path = os.path.join(OUTPUT_FOLDER, filename)
    return send_file(path, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
