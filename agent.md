# Agent Plan — HW 9: Web APIs (Programming the Mobile Web)

## Objective

Build a single webpage that combines **two or more browser Web APIs** into a coherent, interesting experience. The APIs must come from the [MDN Specifications list](https://developer.mozilla.org/en-US/docs/Web/API). At least one API must require user permission, and the page must degrade gracefully if that permission is denied.

---

## Constraints

| Rule | Detail |
|------|--------|
| **Excluded APIs** | Console API, DOM API, Fetch API. If SSE or WebSockets were used in HW 8, exclude those too. |
| **Minimum APIs** | 2 (from the MDN Specifications list) |
| **Permission required** | ≥ 1 API must prompt the user for permission (e.g., Geolocation, Media Capture, Notifications, MIDI, Clipboard read, etc.) |
| **Graceful degradation** | If the user denies permission, the page must not crash or become unusable — show a fallback UI or message instead. |
| **Avoid deprecated / non-standard** | No trash-can (deprecated) or triangle-bang (non-standard) APIs on MDN. Experimental (beaker) is OK but must be tested in both Firefox and Chrome. |
| **Valid HTML & CSS** | Must pass [W3C HTML Validator](https://validator.w3.org/) and [W3C CSS Validator](https://jigsaw.w3.org/css-validator/) with no errors. |
| **HTTPS** | Serve over SSL with a valid certificate (many APIs like Geolocation and Media Capture require a secure context anyway). |
| **Instructions** | Provide usage instructions either on the page itself or in the submission comment. |

---

## Recommended API Combinations

Pick a combination where the APIs reinforce each other — "the whole is greater than the sum of its parts." Below are ideas ranked roughly by impressiveness.

### Tier 1 — High "wow" factor

| Idea | APIs | Permission? | Notes |
|------|------|-------------|-------|
| **Voice-controlled music visualizer** | Web Speech API (SpeechRecognition) + Web Audio API + Canvas API | Yes (microphone) | User speaks commands ("bass", "treble", "stop") to control a canvas-drawn audio visualization. |
| **Geo-aware soundscape** | Geolocation API + Web Audio API | Yes (location) | Generates ambient audio that changes based on the user's real-world coordinates (e.g., ocean sounds near the coast, city sounds elsewhere). |
| **AR-lite compass** | Device Orientation Events + Canvas API (or WebGL) | Yes (motion/orientation sensors) | A compass or horizon display that reacts to how the user tilts/rotates their phone. |
| **Noise-level meter with notifications** | Media Capture and Streams API + Web Audio API (AnalyserNode) + Notifications API | Yes (microphone + notifications) | Monitors ambient noise through the mic; sends a browser notification when decibels exceed a threshold. |

### Tier 2 — Solid and interesting

| Idea | APIs | Permission? | Notes |
|------|------|-------------|-------|
| **Shake-to-draw** | Device Orientation Events + Canvas API | Yes (motion sensors on iOS) | Shaking the phone randomizes colors/brush; tilting controls brush position on canvas. |
| **Location-based to-do list** | Geolocation API + Notifications API + Web Storage API | Yes (location + notifications) | Reminds the user of tasks when they reach a specific location. |
| **Clipboard art board** | Clipboard API (read) + Canvas API | Yes (clipboard read) | Paste images from clipboard onto a canvas collage; add filters via canvas pixel manipulation. |
| **Speech-to-text notepad with fullscreen** | Web Speech API + Fullscreen API + Web Storage API | Yes (microphone) | Dictate notes that persist in localStorage; fullscreen mode for distraction-free writing. |

### Tier 3 — Straightforward but acceptable

| Idea | APIs | Permission? | Notes |
|------|------|-------------|-------|
| **Gamepad tester + Vibration** | Gamepad API + Vibration API | No explicit permission prompt (still valid if paired with one that does) | Visualize gamepad input; vibrate phone on button press. Pair with Notifications API for the permission requirement. |
| **Screen Wake Lock timer** | Screen Wake Lock API + Web Animations API | No permission prompt | A meditation/pomodoro timer that keeps the screen awake. Add Notifications API for permission. |

---

## Recommended Pick (default if no preference stated)

**Noise-level meter with notifications**

- **Media Capture and Streams API** — access the microphone (requires permission).
- **Web Audio API** — run an `AnalyserNode` to compute real-time decibel levels.
- **Notifications API** — alert the user when noise exceeds a threshold (requires permission).
- **Canvas API** — draw a live bar/waveform visualization.

This combination is coherent (all pieces serve one goal), interesting (real-time audio analysis with visual + notification feedback), uses two permission-gated APIs, and degrades gracefully (show a static message if mic denied; fall back to on-page alerts if notifications denied).

---

## Implementation Plan

### 1. Project Structure

```
hw9/
├── index.html
├── style.css
└── app.js
```

### 2. HTML Skeleton (`index.html`)

- Semantic HTML5: `<header>`, `<main>`, `<section>`, `<footer>`.
- `<canvas id="visualizer">` for the audio waveform.
- A `<section id="instructions">` with clear usage directions.
- A `<div id="fallback">` hidden by default, shown when permission is denied.
- Link to `style.css` and `app.js`.
- Include `<meta charset="UTF-8">`, viewport meta, `<lang="en">`.

### 3. CSS (`style.css`)

- Mobile-first responsive layout.
- Dark theme suits a "meter" aesthetic.
- Style the canvas to fill the viewport width.
- Validate with the W3C CSS validator — avoid vendor prefixes that cause warnings; use standard properties.

### 4. JavaScript (`app.js`)

#### a. Microphone Access (Media Capture and Streams API)

```js
async function initMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // success → hook up to Web Audio API
  } catch (err) {
    // permission denied or not available → show fallback UI
    showFallback("Microphone access is needed for the noise meter.");
  }
}
```

#### b. Audio Analysis (Web Audio API)

```js
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;

// Connect mic stream → analyser
const source = audioCtx.createMediaStreamSource(stream);
source.connect(analyser);

// Read data every animation frame
const dataArray = new Uint8Array(analyser.frequencyBinCount);
function tick() {
  analyser.getByteFrequencyData(dataArray);
  const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  drawVisualizer(dataArray);
  checkThreshold(avgVolume);
  requestAnimationFrame(tick);
}
```

#### c. Canvas Visualization (Canvas API)

```js
function drawVisualizer(dataArray) {
  // Clear canvas, draw frequency bars or waveform
  // Color shifts from green → yellow → red based on volume
}
```

#### d. Notifications (Notifications API)

```js
async function initNotifications() {
  if (!("Notification" in window)) return;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    // Degrade: use an on-page banner instead of OS notifications
  }
}

function checkThreshold(volume) {
  if (volume > THRESHOLD) {
    if (Notification.permission === "granted") {
      new Notification("🔊 Noise alert!", { body: `Volume: ${volume.toFixed(0)} dB` });
    } else {
      showOnPageAlert(volume);
    }
  }
}
```

#### e. Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| Mic denied | Hide canvas & meter; show friendly message explaining what the page would do and why mic access is needed. |
| Notifications denied | Everything else still works; threshold alerts appear as on-page banners instead of OS notifications. |
| Browser doesn't support an API | Feature-detect first (`if ('mediaDevices' in navigator)`); show an incompatibility notice. |

### 5. Validation & Testing Checklist

- [ ] `index.html` passes [W3C HTML Validator](https://validator.w3.org/) with 0 errors.
- [ ] `style.css` passes [W3C CSS Validator](https://jigsaw.w3.org/css-validator/) with 0 errors.
- [ ] Page served over HTTPS with a valid certificate.
- [ ] Works in latest Chrome.
- [ ] Works in latest Firefox.
- [ ] Mic permission prompt appears; denying it shows the fallback UI (no console errors).
- [ ] Notification permission prompt appears; denying it falls back to on-page alerts.
- [ ] Canvas visualization renders in real-time while mic is active.
- [ ] Notification fires when noise exceeds threshold.
- [ ] Instructions are visible on the page.

### 6. Submission Comment Template

> **APIs used:**
> 1. **Media Capture and Streams API** — captures microphone audio (requires permission).
> 2. **Web Audio API** — performs real-time frequency analysis via `AnalyserNode`.
> 3. **Notifications API** — sends an OS notification when noise exceeds a configurable threshold (requires permission).
> 4. **Canvas API** — renders a live frequency-bar visualization.
>
> **How to interact:**
> 1. Open the page and grant microphone access when prompted.
> 2. Optionally allow notifications.
> 3. Make noise — the canvas visualizer responds in real-time.
> 4. If volume exceeds the threshold (adjustable via the slider), a notification fires.
> 5. If mic is denied, a fallback message is displayed. If notifications are denied, alerts appear on-page instead.

---

## Rubric Mapping

| Criterion (10 pts total) | How this plan addresses it |
|--------------------------|---------------------------|
| Valid HTML and CSS (1 pt) | Validate before submission; semantic HTML5, no vendor-prefix hacks. |
| A for Affort / style bonus (1 pt) | Polished dark-theme UI, smooth canvas animation, responsive layout. |
| HTTPS (1 pt) | Serve via HTTPS (required for `getUserMedia` anyway). |
| At least one Web API (1 pt) | Media Capture and Streams API. |
| At least two Web APIs (1 pt) | + Web Audio API, Notifications API, Canvas API. |
| Permission needed (1 pt) | Microphone (getUserMedia) and Notifications both require permission. |
| Permission denied (1 pt) | Fallback UI for mic denial; on-page banners for notification denial. |
| Coherent (1 pt) | All APIs serve one unified purpose: real-time noise monitoring. |
| Interesting — 1+1 > 2 (1 pt) | Mic alone is useless; audio analysis alone is invisible; canvas alone is static; notifications alone are pointless. Together they create a live noise-monitoring tool. |
| Instructions provided (1 pt) | On-page `<section id="instructions">` + submission comment. |
