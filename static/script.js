document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const progress = document.getElementById("progressContainer");
  const result = document.getElementById("result");
  const progressBarFill = document.getElementById("progressBarFill");
  const elapsed = document.getElementById("elapsedTime");

  progress.classList.remove("hidden");
  result.classList.add("hidden");
  progressBarFill.style.width = "0%";
  progressBarFill.innerText = "0%";
  elapsed.innerText = "已經處理時間：0 秒";

  let percent = 0;
  let time = 0;
  const timer = setInterval(() => {
    time++;
    elapsed.innerText = `已經處理時間：${time} 秒`;
    if (percent < 95) {
      percent += 1;
      progressBarFill.style.width = percent + "%";
      progressBarFill.innerText = percent + "%";
    }
  }, 1000);

  const response = await fetch("/upload?format=" + form.format.value, {
    method: "POST",
    body: formData,
  });

  clearInterval(timer);
  progressBarFill.style.width = "100%";
  progressBarFill.innerText = "100%";

  const data = await response.json();
  if (data.video_url || data.audio_url) {
    const url = data.video_url || data.audio_url;
    document.getElementById("downloadLink").href = url;
    result.classList.remove("hidden");
  } else {
    alert("發生錯誤：" + (data.error || "未知錯誤"));
  }
});
