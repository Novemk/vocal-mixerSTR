from flask import Flask, render_template_string, request, send_file
from pydub import AudioSegment
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
<title>清唱自動配樂器</title>
<h1>上傳你的清唱檔案（MP3 或 WAV）🎙️</h1>
<form method=post enctype=multipart/form-data>
  <input type=file name=vocal accept=".mp3, .wav">
  <input type=submit value=上傳並合成>
</form>
{% if output_url %}
  <p>✨ 點此下載合成音檔：<a href="{{ output_url }}">下載 MP3</a></p>
{% endif %}
'''

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    output_url = None
    if request.method == 'POST':
        file = request.files['vocal']
        if file:
            original_ext = file.filename.split('.')[-1].lower()
            if original_ext not in ['mp3', 'wav']:
                return "請上傳 mp3 或 wav 檔案。"

            unique_id = str(uuid.uuid4())
            input_filename = f"{unique_id}.{original_ext}"
            input_path = os.path.join(UPLOAD_FOLDER, input_filename)
            file.save(input_path)

            # 載入人聲檔案
            vocal = AudioSegment.from_file(input_path, format=original_ext)

            # 載入伴奏檔（從 Google Drive）
            drive_url = "https://drive.google.com/uc?export=download&id=14i05ZGKqpzaoufhQmBHXrnfYbMqZGhPk"
            response = requests.get(drive_url)
            background = AudioSegment.from_file(BytesIO(response.content), format="wav")

            # 對齊長度
            if len(background) < len(vocal):
                background *= (len(vocal) // len(background) + 1)
            background = background[:len(vocal)]

            # 混音處理
            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            # 輸出成 mp3
            output_filename = f"{unique_id}.mp3"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)
            mixed.export(output_path, format='mp3')
            output_url = f'/download/{output_filename}'

    return render_template_string(HTML, output_url=output_url)

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
