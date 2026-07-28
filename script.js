const countdownEl = document.getElementById('countdown');
const countdownSubtitleEl = document.getElementById('countdownSubtitle');
const countdownShellEl = document.getElementById('countdownShell');
const unlockFieldEl = document.getElementById('unlockField');
const mainTextEl = document.getElementById('mainText');
const messageTextEl = document.getElementById('messageText');
const tinyLabelEl = document.getElementById('tinyLabel');
const statusLineEl = document.getElementById('statusLine');
const burstLayer = document.getElementById('burstLayer');
const petalLayer = document.getElementById('petalLayer');
const cardEl = document.querySelector('.card');
const loveTriggerEl = document.getElementById('loveTrigger');
const heartLockEl = document.getElementById('heartLock');
const unlockNameInputEl = document.getElementById('unlockNameInput');
const sceneTransitionEl = document.getElementById('sceneTransition');
const heartOverlayEl = document.getElementById('heartOverlay');
const mc = document.getElementById('matrixCanvas');
const mx = mc.getContext('2d');
const dc = document.getElementById('dotCanvas');
const ctx = dc.getContext('2d');

mc.width = window.innerWidth;
mc.height = window.innerHeight;
dc.width = window.innerWidth;
dc.height = window.innerHeight;

let count = 10;
let isFinished = false;
let countdownStarted = false;
let countdownTimer = null;
let unlockedName = 'em';
let unlockReady = false;
let matrixTimer = null;
let dots = [];
let animId = null;
let step = 0;
let audioUnlocked = false;
// audio element for the final reveal; use the existing media file from the repo
const finalAudioEl = document.getElementById('finalAudio');
const sakuraLayerEl = document.getElementById('sakuraLayer');

function playFinalAudio() {
  if (!finalAudioEl) return;

  try {
    finalAudioEl.loop = true;
    finalAudioEl.pause();
    finalAudioEl.currentTime = 0;
    finalAudioEl.play().catch(() => {
      finalAudioEl.src = 'music.mp4';
      finalAudioEl.load();
      finalAudioEl.play().catch(() => {});
    });
  } catch (e) {}
}

function unlockAudioPlayback() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  playFinalAudio();
}

function createPetals() {
  for (let i = 0; i < 32; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.top = `${-8 - Math.random() * 10}vh`;
    petal.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
    petal.style.animationDuration = `${4.5 + Math.random() * 3.5}s`;
    petal.style.animationDelay = `${Math.random() * 0.7}s`;
    petalLayer.appendChild(petal);
  }
}

function createFloatingDots() {
  for (let i = 0; i < 22; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'float-dot';
    dot.style.left = `${Math.random() * 100}vw`;
    dot.style.top = `${Math.random() * 100}vh`;
    dot.style.setProperty('--drift', `${(Math.random() - 0.5) * 240}px`);
    dot.style.animationDuration = `${5 + Math.random() * 3}s`;
    dot.style.animationDelay = `${Math.random() * 1.2}s`;
    petalLayer.appendChild(dot);
  }
}

function createSparkles() {
  for (let i = 0; i < 70; i += 1) {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}vw`;
    sparkle.style.top = `${Math.random() * 100}vh`;
    sparkle.style.animationDuration = `${0.9 + Math.random() * 0.8}s`;
    sparkle.style.animationDelay = `${Math.random() * 0.25}s`;
    burstLayer.appendChild(sparkle);
  }
}

function drawMatrix() {
  const chars = 'アイウエオカキ0123456789LOVE♥❤';
  const pinks = ['#ff69b4', '#ff1493', '#ffb6d9', '#ff4d94', '#ff85c2', '#e91e8c', '#c2185b'];
  const fs = 13;
  const cols = Math.floor(mc.width / fs);
  const drops = Array.from({ length: cols }, () => Math.random() * -80);

  function tick() {
    mx.fillStyle = 'rgba(0,0,0,0.055)';
    mx.fillRect(0, 0, mc.width, mc.height);
    for (let i = 0; i < cols; i += 1) {
      mx.fillStyle = pinks[Math.floor(Math.random() * pinks.length)];
      mx.font = `${fs}px monospace`;
      mx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, drops[i] * fs);
      if (drops[i] * fs > mc.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }
  }

  matrixTimer = setInterval(tick, 34);
}

class Dot {
  constructor(tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.x = Math.random() * dc.width;
    this.y = Math.random() * dc.height;
    this.vx = 0;
    this.vy = 0;
    this.r = 7 * (0.7 + Math.random() * 0.6);
    this.color = ['#ffffff', '#fff0f5', '#ffe4f0', '#ffffff'][Math.floor(Math.random() * 4)];
    this.alpha = 0;
  }

  update() {
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    this.vx += dx * 0.09;
    this.vy += dy * 0.09;
    this.vx *= 0.72;
    this.vy *= 0.72;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha = Math.min(1, this.alpha + 0.04);
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }
}

function buildPixels(str) {
  const FONT = {
    '3': [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [0, 0, 0, 0, 1], [0, 1, 1, 1, 0], [0, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0]],
    '2': [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [0, 0, 0, 0, 1], [0, 0, 1, 1, 0], [0, 1, 0, 0, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 1]],
    '1': [[0, 0, 1, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0]],
    Y: [[1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]],
    O: [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0]],
    U: [[1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0]],
    A: [[0, 0, 1, 0, 0], [0, 1, 0, 1, 0], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1]],
    R: [[1, 1, 1, 1, 0], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 0], [1, 0, 1, 0, 0], [1, 0, 0, 1, 0], [1, 0, 0, 0, 1]],
    E: [[1, 1, 1, 1, 1], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 1]],
    M: [[1, 0, 0, 0, 1], [1, 1, 0, 1, 1], [1, 0, 1, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1]],
    L: [[1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 1]],
    V: [[1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0]]
  };
  const gap = 1;
  const out = [];
  for (let c = 0; c < str.length; c += 1) {
    const map = FONT[str[c]] || FONT.A;
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (map[row] && map[row][col]) {
          out.push({ cx: col + (5 + gap) * c, cy: row });
        }
      }
    }
  }
  return out;
}

function getTargets(str) {
  const pixels = buildPixels(str);
  const dotGap = 16;
  const totalW = (pixels.reduce((m, p) => Math.max(m, p.cx), 0) + 1) * dotGap;
  const totalH = 7 * dotGap;
  const ox = (dc.width - totalW) / 2;
  const oy = (dc.height - totalH) / 2;
  return pixels.map((p) => ({ x: ox + p.cx * dotGap + dotGap / 2, y: oy + p.cy * dotGap + dotGap / 2 }));
}

function showDots(str) {
  const targets = getTargets(str);
  while (dots.length < targets.length) {
    dots.push(new Dot(0, 0));
  }
  dots.length = targets.length;
  targets.forEach((t, i) => {
    dots[i].tx = t.x;
    dots[i].ty = t.y;
    dots[i].alpha = Math.max(0, dots[i].alpha - 0.1);
  });
}

function animateDots() {
  ctx.clearRect(0, 0, dc.width, dc.height);
  dots.forEach((dot) => {
    dot.update();
    dot.draw();
  });
  animId = requestAnimationFrame(animateDots);
}

function showHeart() {
  cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, dc.width, dc.height);
  if (matrixTimer) clearInterval(matrixTimer);
  mx.clearRect(0, 0, mc.width, mc.height);
}

function revealHeartMessage() {
  if (!heartOverlayEl) return;
  heartOverlayEl.classList.add('active');
  // short reveal to match earlier elegant reveal
  setTimeout(() => heartOverlayEl.classList.remove('active'), 1400);
}

function buildWordTargets(centerX, centerY) {
  const targets = [];
  const letters = [
    { x: centerX - 300, y: centerY },
    { x: centerX - 230, y: centerY },
    { x: centerX - 160, y: centerY },
    { x: centerX - 90, y: centerY },
    { x: centerX - 20, y: centerY },
    { x: centerX + 55, y: centerY },
    { x: centerX + 125, y: centerY },
    { x: centerX + 200, y: centerY }
  ];

  letters.forEach((letter, idx) => {
    for (let i = 0; i < 18; i += 1) {
      const offsetX = (i % 3 - 1) * 18 + (idx % 2 ? 10 : -6);
      const offsetY = Math.floor(i / 3) * 18 - 18 + (idx % 2 ? 18 : -6);
      targets.push({ x: letter.x + offsetX, y: letter.y + offsetY });
    }
  });

  return targets;
}

function triggerLoveBurst() {
  if (isFinished) return;
  isFinished = true;

  document.body.classList.add('bursting');
  cardEl.classList.add('final-phase');
  countdownEl.classList.add('hidden');
  countdownSubtitleEl.classList.add('reveal');

  const displayName = unlockedName.trim() || 'em';
  mainTextEl.textContent = `Anh yêu ${displayName} cục vàng của anh 💖`;
  messageTextEl.textContent = 'Em là điều nhỏ bé mà anh luôn giữ trong tim 💗';
  tinyLabelEl.textContent = 'TÌNH YÊU • ĐÃ CHẠM ĐẾN NỖI THƯƠNG';
  statusLineEl.textContent = '[LOVE-777] Kết nối hoàn tất';

  if (unlockFieldEl) {
    unlockFieldEl.style.display = 'none';
  }
  if (heartLockEl) {
    heartLockEl.style.display = 'none';
  }
  if (countdownShellEl) {
    countdownShellEl.style.display = 'none';
  }

  mainTextEl.classList.add('reveal');
  messageTextEl.classList.add('reveal');
  tinyLabelEl.classList.add('reveal');
  statusLineEl.classList.add('reveal');
  countdownSubtitleEl.classList.add('reveal');
  loveTriggerEl.classList.add('reveal');

  sceneTransitionEl.classList.add('active');
  setTimeout(() => sceneTransitionEl.classList.remove('active'), 1400);

  createSparkles();
  setTimeout(() => {
    showHeart();
    playFinalAudio();
    createSakuraFall();
  }, 1000);
}
// final images removed per user request

function createSakuraFall() {
  if (!sakuraLayerEl) return;
  sakuraLayerEl.innerHTML = '';
  const petals = 20;
  for (let i = 0; i < petals; i += 1) {
    const p = document.createElement('span');
    p.className = 'sakura-petal';
    const left = Math.random() * 100;
    p.style.left = `${left}vw`;
    const delay = Math.random() * 2;
    const dur = 10 + Math.random() * 10; // slow fall
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${dur}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    sakuraLayerEl.appendChild(p);
  }
}

function revealIntroText() {
  [tinyLabelEl, mainTextEl, messageTextEl, statusLineEl, countdownSubtitleEl].forEach((el) => {
    if (el) el.classList.add('reveal');
  });
  countdownEl.classList.remove('hidden');
}

function renderCountdown() {
  const value = String(count).padStart(2, '0');
  countdownEl.textContent = value;
  countdownSubtitleEl.textContent = `00:${value}`;
}

function startCountdown() {
  if (countdownStarted || isFinished) return;

  countdownStarted = true;
  count = 10;
  renderCountdown();
  countdownEl.classList.remove('hidden');
  if (countdownShellEl) {
    countdownShellEl.classList.add('active');
  }
  countdownEl.classList.remove('pop');
  void countdownEl.offsetWidth;
  countdownEl.classList.add('pop');

  const tick = () => {
    if (!countdownStarted || isFinished) return;

    countdownEl.classList.remove('pop');
    void countdownEl.offsetWidth;
    countdownEl.classList.add('pop');

    count -= 1;
    renderCountdown();

    if (count < 0) {
      triggerLoveBurst();
      return;
    }

    countdownTimer = window.setTimeout(tick, 1000);
  };

  countdownTimer = window.setTimeout(tick, 1000);
}

function burstUnlockUI() {
  const targets = [unlockFieldEl, heartLockEl].filter(Boolean);
  targets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    for (let i = 0; i < 20; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'unlock-sakura';
      const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width;
      const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height;
      const dx = (Math.random() - 0.5) * 260;
      const dy = -120 + Math.random() * -100;
      petal.style.left = `${x}px`;
      petal.style.top = `${y}px`;
      petal.style.setProperty('--dx', `${dx}px`);
      petal.style.setProperty('--dy', `${dy}px`);
      petal.style.zIndex = '20';
      document.body.appendChild(petal);
      petal.addEventListener('animationend', () => petal.remove());
    }
  });
}

function hideUnlockUI() {
  if (unlockFieldEl) {
    unlockFieldEl.classList.remove('active');
    unlockFieldEl.classList.add('explode-out');
    unlockFieldEl.style.pointerEvents = 'none';
    unlockFieldEl.style.maxHeight = '0';
    unlockFieldEl.style.marginBottom = '0';
  }
  if (heartLockEl) {
    heartLockEl.classList.remove('active');
    heartLockEl.classList.add('explode-out');
    heartLockEl.style.pointerEvents = 'none';
  }
  setTimeout(() => {
    if (unlockFieldEl) {
      unlockFieldEl.style.display = 'none';
    }
    if (heartLockEl) {
      heartLockEl.style.display = 'none';
    }
  }, 650);
}

function handleHeartUnlock() {
  if (!unlockReady) {
    unlockReady = true;
    if (unlockFieldEl) {
      unlockFieldEl.classList.add('active');
    }
    if (unlockNameInputEl) {
      unlockNameInputEl.focus();
    }
    messageTextEl.textContent = 'Nhập tên rồi bấm lại nút mở khóa để tiếp tục 💖';
    if (heartLockEl) {
      heartLockEl.classList.add('active');
      heartLockEl.innerHTML = '<span class="heart-lock__icon">🔓</span><span class="heart-lock__text">BẮT ĐẦU</span>';
    }
    return;
  }

  const enteredName = unlockNameInputEl?.value ?? '';
  if (!enteredName.trim()) {
    messageTextEl.textContent = 'Vui lòng nhập tên trước khi bắt đầu 💖';
    return;
  }

  unlockedName = enteredName.trim() || 'em';
  messageTextEl.textContent = 'Đã mở khóa, đếm ngược đã bắt đầu ✨';
  tinyLabelEl.textContent = 'MỞ KHÓA • ĐẾM NGƯỢC ĐANG CHẠY';
  statusLineEl.textContent = `[LOVE-002] Tên nhận được: ${unlockedName}`;
  burstUnlockUI();
  hideUnlockUI();
  startCountdown();
}

if (heartLockEl) {
  heartLockEl.addEventListener('click', handleHeartUnlock);
}

if (unlockNameInputEl) {
  unlockNameInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleHeartUnlock();
    }
  });
}

if (loveTriggerEl) {
  loveTriggerEl.addEventListener('click', () => {
    unlockAudioPlayback();
    revealHeartMessage();
  });
}

window.addEventListener('pointerdown', unlockAudioPlayback, { once: true });
window.addEventListener('keydown', unlockAudioPlayback, { once: true });
window.addEventListener('touchstart', unlockAudioPlayback, { once: true });

createPetals();
createFloatingDots();
drawMatrix();
animateDots();
revealIntroText();
renderCountdown();
