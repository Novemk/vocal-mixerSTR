import os
import time
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'

# 確保資料夾存在
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

    # 儲存上傳的音檔
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # 模擬處理時間
    time.sleep(2)  # 此處可換成真實的處理邏輯

    # 假設輸出檔案
    output_filename = f"output.{output_type.lower()}"
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
    with open(output_path, 'w') as f:
        f.write('模擬合成結果')  # 實際可改成合成後的資料寫入

    return jsonify({'status': 'done', 'file': output_filename})

@app.route('/download/<filename>')
def download(filename):
    path = os.path.join(OUTPUT_FOLDER, filename)
    if not os.path.exists(path):
        return "檔案不存在", 404
    return send_file(path, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
