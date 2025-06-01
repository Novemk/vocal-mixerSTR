import os
import uuid
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from moviepy.editor import AudioFileClip, ImageClip
import threading
import time

app = Flask(__name__)
UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"
COVER_IMAGE = "default_cover.png"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# 全域暫存進度狀態
progress = {
    "status": "idle",
    "percent": 0,
    "seconds": 0,
    "filename": None,
}


def reset_progress():
    progress["status"] = "idle"
    progress["percent"] = 0
    progress["seconds"] = 0
    progress["filename"] = None


def synthesize_audio(filepath, output_format):
    progress["status"] = "processing"
    progress["percent"] = 10
    progress["seconds"] = 0

    filename = os.path.splitext(os.path.basename(filepath))[0]
    uid = str(uuid.uuid4())[:8]
    output_filename = f"{filename}_{uid}.{output_format.lower()}"
    output_path = os.path.join(app.config["OUTPUT_FOLDER"], output_filename)

    for i in range(5):  # 模擬進度用
        time.sleep(0.5)
        progress["seconds"] += 0.5
        progress["percent"] += 10

    if output_format == "MP3":
        sound = AudioSegment.from_file(filepath)
        sound.export(output_path, format="mp3")
        progress["percent"] = 100
        progress["filename"] = output_path

    elif output_format == "MP4":
        audio = AudioFileClip(filepath)
        image = ImageClip(COVER_IMAGE).set_duration(audio.duration).set_audio(audio).resize((720, 720))
        image.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")
        progress["percent"] = 100
        progress["filename"] = output_path

    progress["status"] = "done"


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    reset_progress()
    file = request.files["file"]
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        return jsonify({"success": True, "filepath": filepath, "filename": filename})
    return jsonify({"success": False})


@app.route("/synthesize", methods=["POST"])
def synthesize():
    data = request.json
    filepath = data.get("filepath")
    output_format = data.get("format")

    if not filepath or not output_format:
        return jsonify({"success": False, "message": "缺少參數"})

    # 開啟後台執行緒處理混音
    thread = threading.Thread(target=synthesize_audio, args=(filepath, output_format))
    thread.start()

    return jsonify({"success": True})


@app.route("/progress")
def get_progress():
    return jsonify(progress)


@app.route("/download")
def download():
    if progress["filename"] and progress["status"] == "done":
        return send_file(progress["filename"], as_attachment=True)
    return "尚未完成", 400

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # 讀取 Render 提供的 PORT
    app.run(host="0.0.0.0", port=port)

