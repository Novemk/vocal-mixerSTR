<script>
document.addEventListener("DOMContentLoaded", function () {
    const uploadInput = document.getElementById("vocal");
    const fileName = document.getElementById("file-name");
    const formatButtons = document.querySelectorAll(".format-select button");
    const startButton = document.getElementById("start");
    const progressBar = document.querySelector(".progress-bar");
    const statusMessage = document.getElementById("status-message");
    const downloadLink = document.getElementById("download-link");
    const timeCounter = document.getElementById("elapsed-time");

    let selectedFormat = "mp3";
    let interval;

    uploadInput.addEventListener("change", function () {
        const file = uploadInput.files[0];
        if (file) {
            fileName.textContent = file.name;
        }
    });

    formatButtons.forEach(button => {
        button.addEventListener("click", function () {
            formatButtons.forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            selectedFormat = button.dataset.format;
        });
    });

    startButton.addEventListener("click", function () {
        const file = uploadInput.files[0];
        const singer = document.getElementById("singer").value.trim();

        if (!file) {
            alert("請選擇清唱檔案。");
            return;
        }

        startButton.disabled = true;
        statusMessage.textContent = "混音合成中，需 1~2 分鐘內，請耐心等候。";
        progressBar.style.width = "0%";
        progressBar.textContent = "0%";

        let startTime = Date.now();
        interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeCounter.textContent = `已處理時間：${elapsed} 秒`;
        }, 1000);

        const formData = new FormData();
        formData.append("vocal", file);
        formData.append("singer", singer);
        formData.append("format", selectedFormat);

        fetch("/upload", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                clearInterval(interval);
                progressBar.style.width = "100%";
                progressBar.textContent = "100%";
                statusMessage.textContent = "混音完成！";
                if (data.video_url) {
                    downloadLink.href = data.video_url;
                    downloadLink.style.display = "block";
                }
            })
            .catch(err => {
                clearInterval(interval);
                statusMessage.textContent = "合成失敗，請重試。";
                console.error(err);
            });
    });
});
</script>
