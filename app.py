from flask import Flask, render_template_string, request, send_file
from pydub import AudioSegment
from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip, TextClip
import os
import uuid
import requests
from io import BytesIO

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

HTML = '''
<!doctype html>
<title>Cetro - 5.M.A [reimagined] Challenge</title>
<h1>🎤 Cetro 混音投稿系統</h1>
<form method=post enctype=multipart/form-data>
  <label>上傳你的清唱音檔（MP3 或 WAV）</label><br>
  <input type=file name=vocal accept=".mp3,.wav" required><br><br>

  <label>上傳你的封面圖片（正方形）</label><br>
  <input type=file name=cover accept="image/*"><br><br>

  <label>輸入歌唱者名稱（會顯示在影片封面上）</label><br>
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
        cover = request.files.get('cover')
        singer = request.form.get('singer', 'Unknown')

        if file:
            ext = file.filename.split('.')[-1].lower()
            if ext not in ['mp3', 'wav']:
                return "請上傳 mp3 或 wav 格式的清唱檔案。"

            unique_id = str(uuid.uuid4())
            input_audio_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}.{ext}")
            file.save(input_audio_path)
            vocal = AudioSegment.from_file(input_audio_path, format=ext)

            # 封面處理
            if cover:
                cover_ext = cover.filename.split('.')[-1].lower()
                cover_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_cover.{cover_ext}")
                cover.save(cover_path)
            else:
                # 預設封面
                cover_path = "default_cover.jpg"  # 請替換為實際預設封面圖

            # 下載伴奏
            drive_url = "https://drive.google.com/uc?export=download&id=14i05ZGKqpzaoufhQmBHXrnfYbMqZGhPk"
            response = requests.get(drive_url)
            background = AudioSegment.from_file(BytesIO(response.content), format="wav")

            if len(background) < len(vocal):
                background *= (len(vocal) // len(background) + 1)
            background = background[:len(vocal)]

            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            mixed_audio_path = os.path.join(OUTPUT_FOLDER, f"{unique_id}_audio.mp3")
            mixed.export(mixed_audio_path, format='mp3')

            # 產出影片（封面圖 + 音訊 + 文字）
            audio_clip = AudioFileClip(mixed_audio_path)
            image_clip = ImageClip(cover_path).set_duration(audio_clip.duration).resize((720, 720))

            # 歌唱者名字貼上圖
            text_clip = TextClip(singer, fontsize=36, color='white', bg_color='black', font='Arial-Bold')\
                .set_duration(audio_clip.duration).set_position(('center', 'bottom'))

            video = CompositeVideoClip([image_clip, text_clip])
            video = video.set_audio(audio_clip)

            output_video_path = os.path.join(OUTPUT_FOLDER, f"{unique_id}.mp4")
            video.write_videofile(output_video_path, fps=24, codec='libx264')

            output_url = f'/download/{unique_id}.mp4'

    return render_template_string(HTML, output_url=output_url)

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
