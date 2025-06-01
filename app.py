from flask import Flask, render_template, request, send_file, jsonify
from pydub import AudioSegment
from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip
from PIL import Image, ImageDraw, ImageFont
import os
import uuid
import requests
from io import BytesIO

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

DEFAULT_COVER_URL = "https://github.com/Novemk/vocal-mixerSTR/blob/main/default_cover.png?raw=true"

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['vocal']
        singer = request.form.get('singer', 'Unknown Artist')
        output_type = request.form.get('output', 'mp3')

        if file:
            ext = file.filename.split('.')[-1].lower()
            if ext not in ['mp3', 'wav']:
                return jsonify({'error': '請上傳 mp3 或 wav 格式'}), 400

            uid = str(uuid.uuid4())
            vocal_path = os.path.join(UPLOAD_FOLDER, f"{uid}.{ext}")
            file.save(vocal_path)
            vocal = AudioSegment.from_file(vocal_path, format=ext)

            # 背景音訊（固定網址）
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

            # 製作封面圖加上歌手名稱
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
            draw.rectangle([(0, 660), (720, 720)], fill="black")
            draw.text(((720 - w) / 2, 675), singer, font=font, fill="white")
            final_cover_path = os.path.join(OUTPUT_FOLDER, f"{uid}_finalcover.jpg")
            img.save(final_cover_path)

            # 視訊合成 or 音訊輸出
            if output_type == "mp4":
                audioclip = AudioFileClip(audio_path)
                imageclip = ImageClip(final_cover_path).set_duration(audioclip.duration)
                videoclip = CompositeVideoClip([imageclip.set_audio(audioclip)])
                video_path = os.path.join(OUTPUT_FOLDER, f"{uid}.mp4")
                videoclip.write_videofile(video_path, codec='libx264', fps=10, preset='ultrafast', verbose=False, logger=None)
                return jsonify({ 'video_url': f"/download/{uid}.mp4" })
            else:
                return jsonify({ 'video_url': f"/download/{uid}_audio.mp3" })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
