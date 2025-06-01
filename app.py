import os
import uuid
import time
import threading
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from moviepy.editor import AudioFileClip, ImageClip

app = Flask(__name__)
UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"
COVER_IMAGE = "default_cover.png"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

progress = {
    "status": "idle",
    "percent": 0,
    "seconds": 0,
    "filename": None
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

    try:
        for _ in range(5):
            time.sleep(0.5)
            progress["seconds"] += 0.5
            progress["percent"] += 10

        if output_format == "MP3":
            sound = AudioSegment.from_file(filepath)
            sound.export(output_path, format="mp3")
            progress["percent"] = 100
            progress["filename"] = output_path

        elif output_format == "MP4":
            # 轉成 WAV 避免 moviepy 讀 MP3 出錯
            temp_wav_path = os.path.join(app.config["UPLOAD_FOLDER"], f"temp_{uid}.wav")
            sound = AudioSegment.from_file(filepath)
            sound.export(temp_wav_path, format="wav")

            audio = AudioFileClip(temp_wav_path)
            if audio.duration > 90:
                progress["status"] = "error"
                progress["filename"] = None
                os.remove(temp_wav_path)
                print("[MP4] 音訊長度超過 90 秒，已中止合成")
                return

            if not os.path.exists(COVER_IMAGE):
                print("[MP4] 找不到封面圖片")
                progress["status"] = "error"
                return

            image = ImageClip(COVER_IMAGE).set_duration(audio.duration).set_audio(audio).resize((720, 720))
            image.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                bitrate="800k",
                threads=2,
                preset="ultrafast",
                temp_audiofile="temp-audio.m4a",
                remove_temp=True,
                logger=None
            )

            progress["percent"] = 100
            progress["filename"] = output_path
            os.remove(temp_wav_path)

        progress["status"] = "done"

    except Exception as e:
        progress["status"] = "error"
        progress["filename"] = None
        print(f"[合成錯誤] {e}")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    reset_progress()
    file = request.files.get("file")
    if file:
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()
        print(f"[UPLOAD] 檔名: {filename} 副檔名: {ext}")

        if ext not in [".mp3", ".wav"]:
            print("[UPLOAD] 格式錯誤")
            return jsonify({"success": False, "message": "只允許上傳 MP3 或 WAV 音訊檔案"})

        filepath = os.path.join(app.config["UPLOAD_FOLDER"], f_]()
