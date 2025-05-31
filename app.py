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
<h1>上傳你的清唱 MP3，讓我們幫你套上伴奏 🎶</h1>
<form method=post enctype=multipart/form-data>
  <input type=file name=vocal accept="audio/mpeg">
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
        if file and file.filename.endswith('.mp3'):
            filename = str(uuid.uuid4()) + '.mp3'
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # 載入使用者人聲
            vocal = AudioSegment.from_file(filepath)

            # 從 Google Drive 下載伴奏
            drive_url = "https://drive.google.com/uc?export=download&id=1gFNJjfk6jwcKfYhVIPSwGRZjkQQuenoZ"
            response = requests.get(drive_url)
            background = AudioSegment.from_file(BytesIO(response.content), format="mp3")

            # 對齊背景與人聲長度
            if len(background) < len(vocal):
                background = background * (len(vocal) // len(background) + 1)
            background = background[:len(vocal)]

            # 混音處理
            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            output_path = os.path.join(OUTPUT_FOLDER, filename)
            mixed.export(output_path, format='mp3')
            output_url = f'/download/{filename}'

    return render_template_string(HTML, output_url=output_url)

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

# ✅ 這裡是解決 Render 無法公開訪問的關鍵設定
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
