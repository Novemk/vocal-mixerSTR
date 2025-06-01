import os
import time
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from moviepy.editor import *
from pydub import AudioSegment

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
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
        vocal = AudioSegment.from_file(filepath)
        bgm = AudioSegment.from_file("bgm.mp3")

        # 混音處理（可調整音量）
        combined = bgm.overlay(vocal)
        temp_audio = os.path.join(OUTPUT_FOLDER, "temp_audio.mp3")
        combined.export(temp_audio, format="mp3")

        # 加上圖片轉成影片
        cover = ImageClip("default_cover.png", duration=combined.duration_seconds)
        cover = cover.set_audio(AudioFileClip(temp_audio))
        cover = cover.set_duration(combined.duration_seconds)
        cover = cover.set_fps(1)
        cover.write_videofile(output_path, codec="libx264", audio_codec="aac")

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
