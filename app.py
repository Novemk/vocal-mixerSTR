from flask import Flask, render_template_string, request, send_file
from pydub import AudioSegment
import os
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
BACKGROUND_TRACK = 'accompaniment.mp3'  # 固定的伴奏檔案

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

            # 載入音訊
            vocal = AudioSegment.from_file(filepath)
            background = AudioSegment.from_file(BACKGROUND_TRACK)

            # 對齊長度
            if len(background) < len(vocal):
                times = len(vocal) // len(background) + 1
                background = background * times
            background = background[:len(vocal)]

            # 混音：背景降低 6db，人聲提升 3db
            mixed = background - 6
            mixed = mixed.overlay(vocal + 3)

            output_path = os.path.join(OUTPUT_FOLDER, filename)
            mixed.export(output_path, format='mp3')
            output_url = f'/download/{filename}'

    return render_template_string(HTML, output_url=output_url)

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
