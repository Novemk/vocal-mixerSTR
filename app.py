from flask import Flask, render_template_string, request, send_file
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

# 外部封面圖連結（可更換）
DEFAULT_COVER_URL = "https://drive.google.com/uc?export=download&id=1_rq6nXU-3yJJq8HyIrUtGwRMZI6FrAsz"

HTML = '''
<!doctype html>
<title>Cetro - 5.M.A [reimagined] Challenge</title>
<h1>🎤 Cetro 混音投稿系統</h1>
<form method=post enctype=multipart/form-data>
  <label>上傳你的清唱音檔（MP3 或 WAV）</label><br>
  <input type=file name=vocal accept=".mp3,.wav" required><br><br>

  <label>輸入歌唱者名稱（將印在封面下方）</label><br>
  <input type=text name=singer placeholder="你的名字"><br><br>

  <input type=submit value="上傳並合成 MP4 🎬">
</form>
{% if output_url %}
  <p>✨ 點此下載合成影片：<a href="{{ output_url }}">下載 MP4</a></p>
{% endif %}
'''

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    output_url = None
    if request.method == 'POST':
        file = request.files['vocal']
        singer = request.form.get('singer', 'Unknown Artist')

        if file:
            ext = file.filename.split('.')[-1].lower()
            if ext not in ['mp3', 'wav']:
                return "請上傳 mp3 或 wav 格式的清唱檔案。"

            uid = str(uuid.uuid4())
            vocal_path = os.path.join(UPLOAD_FOLDER, f"{uid}.{ext}")
            file.save(vocal_path)
            vocal = AudioSegment.from_file(vocal_path, format=ext)

            # 載入伴奏
            drive_url = "https://drive.google.com/uc?export=download&id=14i05ZGKqpzaoufhQmBHXrnfYbMqZGhPk"
            response = requests.get(drive_url)
            background = AudioSegment.from_file(BytesIO(response.content), format="wav")
            if len(background) < len(vocal):
                background *= (len(vocal) // len(background) + 1)
            background = background[:len(vocal)]
            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            # 匯出混音音訊
            audio_path = os.path.join(OUTPUT_FOLDER, f"{uid}_audio.mp3")
            mixed.export(audio_path, format='mp3')

            # 下載封面並加字
            cover_response = requests.get(DEFAULT_COVER_URL)
            img = Image.open(BytesIO(cover_response.content)).convert("RGB")
            img = img.resize((720, 720))
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.truetype("DejaVuSans-Bold.ttf", 40)
            except:
                font = ImageFont.load_default()
            w, h = draw.textsize(singer, font=font)
            draw.rectangle([(0, 660), (720, 720)], fill="black")
            draw.text(((720 - w) / 2, 675), singer, font=font, fill="white")
            final_cover_path = os.path.join(OUTPUT_FOLDER, f"{uid}_finalcover.jpg")
            img.save(final_cover_path)

            # 合成影片
            audioclip = AudioFileClip(audio_path)
            imageclip = ImageClip(final_cover_path).set_duration(audioclip.duration)
            videoclip = CompositeVideoClip([imageclip.set_audio(audioclip)])
            video_path = os.path.join(OUTPUT_FOLDER, f"{uid}.mp4")
            videoclip.write_videofile(video_path, codec='libx264', fps=24)

            output_url = f"/download/{uid}.mp4"

    return render_template_string(HTML, output_url=output_url)

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
