import os
import time
import requests
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from moviepy.editor import *
from pydub import AudioSegment

app = Flask(__name__)

# ✅ 自動下載 BGM
def download_bgm_if_needed():
    bgm_path = "bgm.mp3"
    if not os.path.exists(bgm_path):
        print("🔄 正在下載 BGM...")
        url = "https://raw.githubusercontent.com/Novemk/vocal-mixerSTR/main/bgm.mp3"
        r = requests.get(url)
        r.raise_for_status()
        with open(bgm_path, 'wb') as f:
            f.write(r.content)
        print("✅ BGM 下載完成")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    download_bgm_if_needed()

    file = request.files.get('file')
    output_type = request.form.get('output_type')

    if not file or output_type not in ['MP3', 'MP4']:
        return jsonify({'status': 'error', 'message': '無效的輸入資料'}), 400

    # 儲存上傳檔案
    timestamp = int(time.time())
    input_filename = f"input_{timestamp}.mp3"
    file.save(input_filename)

    # 輸出檔案命名
    output_filename = f"output_{timestamp}.{output_type.lower()}"
    output_path = output_filename

    if output_type == "MP4":
        # 載入音訊
        vocal = AudioSegment.from_file(input_filename)
        bgm = AudioSegment.from_file("bgm.mp3")

        # 限制長度為 90 秒
        max_duration_ms = 120 * 1000
        vocal = vocal[:max_duration_ms]
        bgm = bgm[:max_duration_ms]

        # 混音處理
        combined = bgm.overlay(vocal)
        temp_audio = f"temp_{timestamp}.mp3"
        combined.export(temp_audio, format="mp3")

        # 封面圖 + 音訊生成影片
        cover = ImageClip("default_cover.png", duration=120)
        cover = cover.resize(width=512)  # ✅ 降畫質

        cover = cover.set_audio(AudioFileClip(temp_audio))
        cover = cover.set_duration(120)
        cover = cover.set_fps(1)

        print("🎞️ 開始輸出影片檔案：", output_path)
        cover.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            bitrate="800k",
            threads=1,
            preset="ultrafast",
            remove_temp=True,
            write_logfile=False
        )
        print("✅ 🎬 影片生成完成！輸出於：", output_path)

        if os.path.exists(temp_audio):
            os.remove(temp_audio)

    else:
        # MP3 輸出
        vocal = AudioSegment.from_file(input_filename)
        bgm = AudioSegment.from_file("bgm.mp3")
        combined = bgm.overlay(vocal)
        combined.export(output_path, format="mp3")

    # 可選：清除上傳音訊
    if os.path.exists(input_filename):
        os.remove(input_filename)

    return jsonify({'status': 'done', 'file': output_filename})

@app.route('/download/<filename>')
def download(filename):
    if not os.path.exists(filename):
        return "❌ 找不到合成檔案", 404

    # 自動命名格式：CETRO - 5.M.A - CHALLENGE YYYY-MM-DD hh-mm-ss
    now = datetime.now().strftime("%Y-%m-%d %H-%M-%S")
    ext = filename.split('.')[-1]
    custom_name = f"CETRO - 5.M.A - CHALLENGE {now}.{ext}"

    return send_file(
        filename,
        as_attachment=True,
        download_name=custom_name  # ✅ Flask 2.0+ 支援命名
    )

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
