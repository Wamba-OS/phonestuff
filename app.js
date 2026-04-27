"use strict";

const startBtn = document.getElementById("startBtn");
const thresholdInput = document.getElementById("threshold");
const thresholdVal = document.getElementById("thresholdVal");
const volumeDisplay = document.getElementById("volumeDisplay");
const levelFill = document.getElementById("levelFill");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const alertBox = document.getElementById("alert");
const alertMsg = document.getElementById("alertMsg");
const fallbackBox = document.getElementById("fallback");
const fallbackMsg = document.getElementById("fallbackMsg");

const NOTIFICATION_COOLDOWN = 5000;
let lastNotifTime = 0;
let notifPermission = "default";
let animationId = null;

thresholdInput.addEventListener("input", () => {
  thresholdVal.textContent = thresholdInput.value;
});

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;

  if (!("mediaDevices" in navigator) || !("getUserMedia" in navigator.mediaDevices)) {
    showFallback("Your browser does not support microphone access. Try Chrome or Firefox.");
    return;
  }

  await requestNotifications();

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    showFallback("Microphone access was denied or unavailable. Grant mic permission and reload the page to use the noise meter.");
    return;
  }

  startMeter(stream);
});

async function requestNotifications() {
  if (!("Notification" in window)) return;
  notifPermission = await Notification.requestPermission();
}

function startMeter(stream) {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;

  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function tick() {
    analyser.getByteFrequencyData(dataArray);

    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const volume = Math.round(avg);

    volumeDisplay.textContent = volume;
    updateLevelBar(volume);
    drawVisualizer(dataArray);
    checkThreshold(volume);

    animationId = requestAnimationFrame(tick);
  }

  tick();
}

function updateLevelBar(volume) {
  const pct = Math.min(volume, 100);
  levelFill.style.width = pct + "%";

  if (pct < 40) {
    levelFill.style.backgroundColor = "#2a7";
  } else if (pct < 70) {
    levelFill.style.backgroundColor = "#ca0";
  } else {
    levelFill.style.backgroundColor = "#c33";
  }
}

function drawVisualizer(dataArray) {
  const w = canvas.width;
  const h = canvas.height;
  const barWidth = w / dataArray.length * 2.5;

  ctx.clearRect(0, 0, w, h);

  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * h;
    const ratio = dataArray[i] / 255;
    const r = Math.round(ratio * 200);
    const g = Math.round((1 - ratio) * 180);
    ctx.fillStyle = "rgb(" + r + "," + g + ",60)";
    ctx.fillRect(x, h - barHeight, barWidth, barHeight);
    x += barWidth + 1;
    if (x > w) break;
  }
}

function checkThreshold(volume) {
  const threshold = Number(thresholdInput.value);
  if (volume > threshold) {
    const now = Date.now();
    if (now - lastNotifTime < NOTIFICATION_COOLDOWN) return;
    lastNotifTime = now;

    if (notifPermission === "granted") {
      new Notification("Noise Alert", { body: "Volume is " + volume + " (threshold: " + threshold + ")" });
      hideAlert();
    } else {
      showAlert("Noise Alert: volume is " + volume + " (threshold: " + threshold + ")");
    }
  } else {
    hideAlert();
  }
}

function showAlert(msg) {
  alertMsg.textContent = msg;
  alertBox.hidden = false;
}

function hideAlert() {
  alertBox.hidden = true;
}

function showFallback(msg) {
  fallbackMsg.textContent = msg;
  fallbackBox.hidden = false;
}
