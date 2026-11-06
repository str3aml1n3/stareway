import { BEAT, FIRST_BEAT, TRAVEL_TIME, HIT_WINDOW, noteAt, findHit, eyeRatio, BlinkDetector } from "./game.js";

const $ = id => document.getElementById(id);
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");
const video = $("camera-video");
const cameraButton = $("camera-button");
const detectors = { left: new BlinkDetector(), right: new BlinkDetector() };
const eyes = { left: [362, 385, 387, 263, 373, 380], right: [33, 160, 158, 133, 153, 144] };
let audio, startTime, playing = false, notes = [], nextNote = 0, nextSound = 0, score = 0, combo = 0;
let cameraStream, landmarker, cameraFrame, lastVideoTime = -1, feedbackTimer;

function tone(frequency, when, duration, type, volume, destination = audio.destination) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.01);
}

function scheduleBeat(index) {
  const when = startTime + FIRST_BEAT + index * BEAT;
  const melody = [261.63, 329.63, 392, 493.88, 440, 392, 329.63, 293.66];
  tone(melody[index % melody.length], when, 0.35, "sine", 0.045);
  tone(index % 4 === 0 ? 65.41 : 130.81, when, 0.2, "triangle", index % 4 === 0 ? 0.09 : 0.035);
  if (index % 2 === 1) tone(783.99, when, 0.07, "sine", 0.025);
}

function hit(lane) {
  const check = $(`${lane}-check`);
  check.classList.add("blink");
  setTimeout(() => check.classList.remove("blink"), 180);
  if (!playing) return;
  const time = audio.currentTime - startTime;
  const note = findHit(notes, lane, time);
  if (!note) return;
  note.judged = true;
  combo++;
  score += 100 * Math.min(combo, 10);
  $("score").textContent = String(score).padStart(6, "0");
  $("combo").innerHTML = `${combo} <small>×</small>`;
  showFeedback(Math.abs(note.time - time) < 0.1 ? "PERFECT ✦" : "NICE ✦");
  tone(lane === "left" ? 880 : 1108.73, audio.currentTime, 0.22, "sine", 0.08);
  tone(lane === "left" ? 1320 : 1661.22, audio.currentTime, 0.13, "sine", 0.035);
}

function showFeedback(text) {
  $("feedback").textContent = text;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => $("feedback").textContent = "", 500);
}

function draw(time = 0) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width, h = rect.height, center = w / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#ffffff0c";
  ctx.lineWidth = 1;
  for (const x of [0.08, 0.25, 0.5, 0.75, 0.92]) {
    ctx.beginPath(); ctx.moveTo(center + (x - 0.5) * w * 0.35, 0); ctx.lineTo(x * w, h); ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const y = ((i / 7 + (playing ? time * 0.08 : 0)) % 1) ** 2 * h;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  const targetY = h * 0.79;
  ctx.setLineDash([5, 6]); ctx.strokeStyle = "#ffffff48";
  ctx.beginPath(); ctx.moveTo(w * 0.09, targetY); ctx.lineTo(w * 0.91, targetY); ctx.stroke(); ctx.setLineDash([]);
  for (const [lane, color] of [["left", "#ff96c1"], ["right", "#c5a5ff"]]) {
    const x = w * (lane === "left" ? 0.31 : 0.69);
    ctx.strokeStyle = color; ctx.globalAlpha = 0.65; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, targetY, 35, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const note of notes) {
    if (note.judged) continue;
    const progress = 1 - (note.time - time) / TRAVEL_TIME;
    if (progress < 0 || progress > 1.1) continue;
    const eased = Math.max(0, progress);
    const x = center + (note.lane === "left" ? -1 : 1) * w * (0.05 + eased * 0.14);
    const y = 10 + eased * (targetY - 10) + Math.sin(time * 8 + note.time * 4) * 3;
    const radius = 8 + eased * 19;
    const color = note.lane === "left" ? "#ff8db8" : "#bba0ff";
    const glow = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 1, x, y, radius);
    glow.addColorStop(0, "#fff9"); glow.addColorStop(0.35, color); glow.addColorStop(1, note.lane === "left" ? "#b84d88" : "#7258c1");
    ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffffbb"; ctx.font = `${Math.max(10, radius * 0.75)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("✦", x, y);
  }
}

function frame() {
  if (!playing) return;
  const time = audio.currentTime - startTime;
  while (FIRST_BEAT + nextNote * BEAT <= time + TRAVEL_TIME) notes.push(noteAt(nextNote++));
  while (FIRST_BEAT + nextSound * BEAT <= time + 0.15) scheduleBeat(nextSound++);
  for (const note of notes) {
    if (!note.judged && time > note.time + HIT_WINDOW) {
      note.judged = true;
      combo = 0;
      $("combo").innerHTML = "0 <small>×</small>";
      showFeedback("KEEP GOING ✦");
    }
  }
  notes = notes.filter(note => note.time > time - 1);
  draw(time);
  requestAnimationFrame(frame);
}

$("start-button").addEventListener("click", async () => {
  try {
    audio ||= new AudioContext();
    await audio.resume();
    notes = []; nextNote = 0; nextSound = 0; score = 0; combo = 0;
    $("score").textContent = "000000";
    $("combo").innerHTML = "0 <small>×</small>";
    startTime = audio.currentTime + 0.1;
    playing = true;
    $("start-overlay").hidden = true;
    $("game-status").textContent = "IN THE FLOW";
    frame();
  } catch {
    $("game-status").textContent = "AUDIO UNAVAILABLE";
  }
});

document.addEventListener("keydown", event => {
  if (event.repeat || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  hit(event.key === "ArrowLeft" ? "left" : "right");
});

function stopCamera() {
  cancelAnimationFrame(cameraFrame);
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
  video.srcObject = null;
  landmarker?.close();
  landmarker = null;
  lastVideoTime = -1;
  detectors.left = new BlinkDetector();
  detectors.right = new BlinkDetector();
  $("camera-placeholder").hidden = false;
  $("camera-placeholder").style.display = "";
  $("camera-live").innerHTML = "<i></i> CAMERA OFF";
  $("camera-status-dot").classList.remove("on");
  document.querySelector(".camera-frame").classList.remove("active");
  cameraButton.innerHTML = "◎ &nbsp; ENABLE CAMERA <span>↗</span>";
}

function detectFrame() {
  if (!cameraStream || !landmarker) return;
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = landmarker.detectForVideo(video, performance.now());
    if (result.faceLandmarks.length) {
      const points = result.faceLandmarks[0];
      const left = detectors.left.update(eyeRatio(points, eyes.left));
      const right = detectors.right.update(eyeRatio(points, eyes.right));
      $("camera-status").textContent = detectors.left.samples < 20 ? "Hold your eyes open to calibrate" : "Face found — ready to blink";
      if (left && !detectors.right.closed && !right) hit("left");
      if (right && !detectors.left.closed && !left) hit("right");
    } else {
      $("camera-status").textContent = "Move your face into view";
    }
  }
  cameraFrame = requestAnimationFrame(detectFrame);
}

cameraButton.addEventListener("click", async () => {
  if (cameraStream) {
    stopCamera();
    $("camera-status").textContent = "Camera is off";
    return;
  }
  cameraButton.disabled = true;
  $("camera-status").textContent = "Loading eye tracking…";
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera requires HTTPS or localhost.");
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = cameraStream;
    await video.play();
    const { FaceLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm");
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm");
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" },
      runningMode: "VIDEO", numFaces: 1
    });
    document.querySelector(".camera-frame").classList.add("active");
    $("camera-placeholder").style.display = "none";
    $("camera-live").innerHTML = "<i></i> CAMERA ON";
    $("camera-status-dot").classList.add("on");
    cameraButton.innerHTML = "◎ &nbsp; DISABLE CAMERA <span>↗</span>";
    detectFrame();
  } catch (error) {
    stopCamera();
    $("camera-status").textContent = error.name === "NotAllowedError" ? "Camera permission denied. Use arrow keys instead." : "Camera unavailable. Use arrow keys instead.";
  } finally {
    cameraButton.disabled = false;
  }
});

window.addEventListener("resize", () => { if (!playing) draw(); });
window.addEventListener("pagehide", stopCamera);
draw();
