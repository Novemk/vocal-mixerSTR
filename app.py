# ============================================================
#  🔧 app.py v1.2 - 清唱混音網站
#  ✅ 增量功能：多Key支援、封面加名、原功能完全保留
# ============================================================

import os
import time
import requests
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from moviepy.editor import *
from pydub import AudioSegment

app = Flask(__name__)

# ------------------------------------------------------------
# ✅ 自動下載原始 Key 的伴奏（bgm.mp3）
# ------------------------------------------------------------
def download_bgm_if_needed():
    bgm_path = "bgm.mp3"
    if not os.path.exists(bgm_path):
        print("🔄 正在下載 BGM...")
        url = "https://raw.githubusercontent.com/Novemk/vocal-mixerSTR/main/bgm.mp3"
        r = requests.get(url)
        r.raise_for_status()
        with open(bgm_path, 'wb') as f:
            f.write(r.content)
        print("✅ BGM 下載完成")

# ------------------------------------------------------------
# 📄 首頁 - 上傳頁面
# ------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')

# ------------------------------------------------------------
# 📤 使用者上傳音訊進行混音與合成影片
# ------------------------------------------------------------
@app.route('/upload', methods=['POST'])
def upload():
    download_bgm_if_needed()

    # 🧾 取得表單資料
    file = request.files.get('file')
    delay_seconds = float(request.form.get('delay', 0))
    delay_ms = int(delay_seconds * 1000)
    output_type = request.form.get('output_type')
    key = request.form.get('key', '0')              # ✅ 新增：使用者選擇的Key
    username = request.form.get('username', '')     # ✅ 新增：封面加字用使用者名稱

    if not file or output_type not in ['MP3', 'MP4']:
        return jsonify({'status': 'error', 'message': '無效的輸入資料'}), 400

    # 🧾 儲存檔案與命名
    timestamp = int(time.time())
    input_filename = f"input_{timestamp}.mp3"
    file.save(input_filename)
    output_filename = f"output_{timestamp}.{output_type.lower()}"
    output_path = output_filename

    # 🎼 選擇 Key 對應的 BGM
    bgm_map = {
        '0': 'bgm.mp3',
        '3': 'bgm_3.mp3',
        '4': 'bgm_4.mp3',
        '5': 'bgm_5.mp3',
    }
    bgm_file = bgm_map.get(key, 'bgm.mp3')

    # 🎧 載入與處理音訊
    vocal = AudioSegment.from_file(input_filename)
    bgm = AudioSegment.from_file(bgm_file)

    if delay_ms > 0:
        vocal = AudioSegment.silent(duration=delay_ms) + vocal

    # ⏱ 限制長度為 120 秒
    max_duration_ms = 120 * 1000
    vocal = vocal[:max_duration_ms]
    bgm = bgm[:max_duration_ms]

    # 🧪 混音處理
    combined = bgm.overlay(vocal)

    if output_type == "MP4":
        # 🎛 輸出臨時 MP3 作為影片音訊
        temp_audio = f"temp_{timestamp}.mp3"
        combined.export(temp_audio, format="mp3")

        # 🖼️ 使用預設封面圖並加上音訊
        cover = ImageClip("default_cover.png", duration=120)
        cover = cover.resize(width=512)
        cover = cover.set_duration(120)
        cover = cover.set_audio(AudioFileClip(temp_audio))
        cover = cover.set_fps(1)

        # 📝 加入使用者名稱文字到封面（右上角）
        if username:
            txt_clip = TextClip(username, fontsize=36, color='white', font="Arial-Bold")
            txt_clip = txt_clip.set_position(("right", "top")).set_duration(cover.duration)
            cover = CompositeVideoClip([cover, txt_clip])

        # 📤 輸出影片
        print("🎞️ 開始輸出影片檔案：", output_path)
        cover.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            bitrate="800k",
            threads=1,
            preset="ultrafast",
            remove_temp=True,
            write_logfile=False
        )
        print("✅ 🎬 影片生成完成！輸出於：", output_path)

        # 🧹 清除臨時檔
        if os.path.exists(temp_audio):
            os.remove(temp_audio)

    else:
        # 🎧 輸出 MP3
        combined.export(output_path, format="mp3")

    # 🧼 清除原始上傳檔案
    if os.path.exists(input_filename):
        os.remove(input_filename)

    return jsonify({'status': 'done', 'file': output_filename})

# ------------------------------------------------------------
# ⬇️ 合成檔案下載介面
# ------------------------------------------------------------
@app.route('/download/<filename>')
def download(filename):
    if not os.path.exists(filename):
        return "❌ 找不到合成檔案", 404

    # 🗂️ 自訂命名格式
    now = datetime.now().strftime("%Y-%m-%d %H-%M-%S")
    ext = filename.split('.')[-1]
    custom_name = f"CETRO - 5.M.A - CHALLENGE {now}.{ext}"

    return send_file(
        filename,
        as_attachment=True,
        download_name=custom_name
    )

# ------------------------------------------------------------
# ▶️ 主程式執行點
# ------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
