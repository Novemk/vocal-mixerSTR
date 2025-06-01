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
            # 將 mp3 轉成 wav 避免 moviepy 讀取問題
            temp_wav_path = os.path.join(app.config["UPLOAD_FOLDER"], f"temp_{uid}.wav")
            sound = AudioSegment.from_file(filepath)
            sound.export(temp_wav_path, format="wav")

            audio = AudioFileClip(temp_wav_path)

            if audio.duration > 90:
                progress["status"] = "error"
                progress["filename"] = None
                os.remove(temp_wav_path)
                return

            if not os.path.exists(COVER_IMAGE):
                print("[錯誤] 找不到封面圖片")
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
