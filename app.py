import os
import requests
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from moviepy.editor import *
from pydub import AudioSegment

app = Flask(__name__)

# ✅ 自動下載 bgm.mp3
def download_bgm_if_needed():
    bgm_path = "bgm.mp3"
    if not os.path.exists(bgm_path):
        print("🔄 正在下載 BGM...")
        url = "https://raw.githubusercontent.com/Novemk/vocal-mixerSTR/main/bgm.mp3"
        r = requests.get(url)
        r.raise_for_status()
        with open(bgm_path, 'wb') as f:
            f.write(r.content)
        print("✅ 下載完成")

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

    # 📥 儲存清唱音檔
    filename = secure_filename(file.filename)
    filepath = filename
    file.save(filepath)

    # 📤 合成輸出
    output_filename = f"output.{output_type.lower()}"
    output_path = output_filename

    if output_type == "MP4":
        vocal = AudioSegment.from_file(filepath)
        bgm = AudioSegment.from_file("bgm.mp3")

        max_duration_ms = 90 * 1000
        vocal = vocal[:max_duration_ms]
        bgm = bgm[:max_duration_ms]
        combined = bgm.overlay(vocal)

        temp_audio = "temp_audio.mp3"
        combined.export(temp_audio, format="mp3")

        cover = ImageClip("default_cover.png", duration=90)
        cover = cover.set_audio(AudioFileClip(temp_audio))
        cover = cover.set_duration(90)
        cover = cover.set_fps(1)
        cover.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            bitrate="800k",
            threads=1,
            preset="ultrafast"
        )

    else:  # MP3 合成
        vocal = AudioSegment.from_file(filepath)
        bgm = AudioSegment.from_file("bgm.mp3")
        combined = bgm.overlay(vocal)
        combined.export(output_path, format="mp3")

    return jsonify({'status': 'done', 'file': output_filename})

@app.route('/download/<filename>')
def download(filename):
    if not os.path.exists(filename):
        return "❌ 找不到合成檔案", 404
    return send_file(filename, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
