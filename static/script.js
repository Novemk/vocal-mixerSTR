document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("uploadForm");
  const progressBar = document.getElementById("progressBar");
  const statusText = document.getElementById("statusText");
  const downloadLink = document.getElementById("downloadLink").querySelector("a");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById("vocal");
    const singerInput = document.getElementById("singer");
    const format = document.getElementById("format").value;

    if (!fileInput.files.length || !singerInput.value.trim()) {
      alert("請選擇檔案並輸入歌唱者名稱。");
      return;
    }

    formData.append("vocal", fileInput.files[0]);
    formData.append("singer", singerInput.value);
    formData.append("format", format);

    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusText.style.display = "block";
    downloadLink.parentElement.style.display = "none";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload", true);

    xhr.upload.addEventListener("progress", function (e) {
      if (e.lengthComputable) {
        const percent = Math.floor((e.loaded / e.total) * 100);
        progressBar.style.width = percent + "%";
        progressBar.textContent = percent + "%";
      }
    });

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          progressBar.style.width = "100%";
          progressBar.textContent = "100%";
          if (res.video_url) {
            downloadLink.href = res.video_url;
            downloadLink.parentElement.style.display = "block";
          } else {
            progressBar.textContent = "錯誤：找不到影片網址";
          }
        } else {
          progressBar.textContent = "發生錯誤，請稍後再試。";
        }
      }
    };

    xhr.send(formData);
  });
});
