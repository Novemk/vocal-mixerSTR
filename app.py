from flask import Flask, render_template, request, jsonify
from pydub import AudioSegment
from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip
from PIL import Image, ImageDraw, ImageFont
import os
import uuid
import requests
from io import BytesIO

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = os.path.join("static", "outputs")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# 可更換的封面網址（已設定為 GitHub 上傳圖）
DEFAULT_COVER_URL = "https://github.com/Novemk/vocal-mixerSTR/blob/main/default_cover.png?raw=true"

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['vocal']
        singer = request.form.get('singer', 'Unknown Artist')

        if file:
            ext = file.filename.split('.')[-1].lower()
            if ext not in ['mp3', 'wav']:
                return jsonify({'error': '請上傳 mp3 或 wav 格式'}), 400

            uid = str(uuid.uuid4())
            vocal_path = os.path.join(UPLOAD_FOLDER, f"{uid}.{ext}")
            file.save(vocal_path)
            vocal = AudioSegment.from_file(vocal_path, format=ext)

            # 從 Google Drive 下載伴奏音檔
            drive_url = "https://drive.google.com/uc?export=download&id=14i05ZGKqpzaoufhQmBHXrnfYbMqZGhPk"
            response = requests.get(drive_url)
            background = AudioSegment.from_file(BytesIO(response.content), format="wav")
            if len(background) < len(vocal):
                background *= (len(vocal) // len(background) + 1)
            background = background[:len(vocal)]
            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            audio_path = os.path.join(OUTPUT_FOLDER, f"{uid}_audio.mp3")
            mixed.export(audio_path, format='mp3')

            # 下載封面並加入歌手名稱
            cover_response = requests.get(DEFAULT_COVER_URL)
            img = Image.open(BytesIO(cover_response.content)).convert("RGB")
            img = img.resize((720, 720))
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.truetype("DejaVuSans-Bold.ttf", 40)
            except:
                font = ImageFont.load_default()
            bbox = draw.textbbox((0, 0), singer, font=font)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
            draw.rectangle([(0, 660), (720, 720)], fill="black")
            draw.text(((720 - w) / 2, 675), singer, font=font, fill="white")
            final_cover_path = os.path.join(OUTPUT_FOLDER, f"{uid}_finalcover.jpg")
            img.save(final_cover_path)

            # 合成影片
            audioclip = AudioFileClip(audio_path)
            imageclip = ImageClip(final_cover_path).set_duration(audioclip.duration)
            videoclip = CompositeVideoClip([imageclip.set_audio(audioclip)])
            video_path = os.path.join(OUTPUT_FOLDER, f"{uid}.mp4")
            videoclip.write_videofile(video_path, codec='libx264', fps=10, preset='ultrafast', verbose=False, logger=None)

            # 回傳影片路徑給前端
            return jsonify({ 'video_url': f"/static/outputs/{uid}.mp4" })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
