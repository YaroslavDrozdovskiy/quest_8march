/* ═══════════════════════════════════════════════
   SCENE MANAGEMENT
   ═══════════════════════════════════════════════ */

let currentScene = 1;

function showScene(n) {
  const prev = document.querySelector('.scene.active');
  const next = document.getElementById(
    n === 1 ? 'scene-intro'   :
    n === 2 ? 'scene-chest'   :
    n === 3 ? 'scene-opening' :
              'scene-reward'
  );
  if (prev) prev.classList.remove('active');
  setTimeout(() => {
    next.classList.add('active');
    currentScene = n;
    if (n === 3) onOpeningEnter();
    if (n === 4) onRewardEnter();
  }, 100);
}

/* ═══════════════════════════════════════════════
   COMBO LOCK
   ═══════════════════════════════════════════════ */

const ITEM_H       = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--item-h')) || 54;
const DRUM_COUNT   = 4;
// Padded strip: wrap-around so digit 0 always shows prev/next neighbours
const STRIP_DIGITS = ['9','0','1','2','3','4','5','6','7','8','9','0'];
const drumValues   = new Array(DRUM_COUNT).fill(0);

function buildComboLock() {
  const housing = document.getElementById('combo-lock');
  housing.innerHTML = '';

  for (let i = 0; i < DRUM_COUNT; i++) {
    const col = document.createElement('div');
    col.className = 'drum-col';
    col.dataset.index = i;

    // ▲ up arrow
    const upBtn = document.createElement('button');
    upBtn.className = 'drum-arrow';
    upBtn.setAttribute('aria-label', CONTENT.chest.arrowUp);
    upBtn.innerHTML = '▲';
    upBtn.addEventListener('click', () => drumSpin(i, 1));

    // drum window
    const win = document.createElement('div');
    win.className = 'drum-window';
    win.id = `drum-win-${i}`;

    const strip = document.createElement('div');
    strip.className = 'drum-strip';
    strip.id = `drum-strip-${i}`;

    STRIP_DIGITS.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'drum-digit';
      cell.textContent = d;
      strip.appendChild(cell);
    });

    // Initial position: digit 0 → translateY = 0
    strip.style.transform = 'translateY(0px)';

    const hl = document.createElement('div');
    hl.className = 'drum-highlight';

    win.appendChild(strip);
    win.appendChild(hl);

    // ▼ down arrow
    const downBtn = document.createElement('button');
    downBtn.className = 'drum-arrow';
    downBtn.setAttribute('aria-label', CONTENT.chest.arrowDown);
    downBtn.innerHTML = '▼';
    downBtn.addEventListener('click', () => drumSpin(i, -1));

    col.appendChild(upBtn);
    col.appendChild(win);
    col.appendChild(downBtn);

    // Mouse wheel
    win.addEventListener('wheel', e => {
      e.preventDefault();
      drumSpin(i, e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    // Touch swipe
    let touchStartY = null;
    win.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });
    win.addEventListener('touchend', e => {
      if (touchStartY === null) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 12) drumSpin(i, dy > 0 ? 1 : -1);
      touchStartY = null;
    });

    housing.appendChild(col);
  }
}

function drumSpin(idx, direction) {
  drumValues[idx] = (drumValues[idx] + direction + 10) % 10;
  const itemH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--item-h')) || 54;
  const strip = document.getElementById(`drum-strip-${idx}`);
  strip.style.transform = `translateY(${-drumValues[idx] * itemH}px)`;
}

function getEnteredCode() {
  return drumValues.join('');
}

function checkCode() {
  const errEl = document.getElementById('error-msg');

  if (getEnteredCode() === SECRET_CODE) {
    errEl.innerHTML = '&nbsp;';
    showScene(3);
  } else {
    // Shake the housing
    const housing = document.getElementById('combo-lock');
    housing.classList.add('shake-lock');
    document.querySelectorAll('.drum-window').forEach(w => w.classList.add('error'));
    errEl.textContent = CONTENT.chest.errorWrong;

    setTimeout(() => {
      housing.classList.remove('shake-lock');
      document.querySelectorAll('.drum-window').forEach(w => w.classList.remove('error'));
    }, 600);
  }
}

/* ═══════════════════════════════════════════════
   SCENE 3 — OPENING
   ═══════════════════════════════════════════════ */

function onOpeningEnter() {
  launchConfetti();
  // chest video — after CSS chest animation settles (~2s), play video
  setTimeout(() => showChestVideo(), 2000);
}

function showChestVideo() {
  const overlay = document.getElementById('video-overlay');
  const video   = document.getElementById('chest-video');

  overlay.classList.add('active');
  video.currentTime = 0;
  video.play().catch(() => {
    // Autoplay blocked — skip straight to scroll
    overlay.classList.remove('active');
    showScrollScene();
  });

  video.addEventListener('ended', () => {
    overlay.classList.remove('active');
    setTimeout(() => showScrollScene(), 300);
  }, { once: true });
}

/* scroll display — show scroll scene */
function showScrollScene() {
  const titleEl = document.querySelector('#scroll-body-text .scroll-text-title');
  const bodyEl  = document.querySelector('#scroll-body-text .scroll-text-body');
  if (titleEl) titleEl.textContent = CONTENT.scroll.title;
  if (bodyEl)  bodyEl.textContent  = CONTENT.scroll.body;

  const prev = document.querySelector('.scene.active');
  if (prev) prev.classList.remove('active');
  setTimeout(() => {
    const scrollScene = document.getElementById('scene-scroll');
    scrollScene.classList.add('active');
    setupScrollHint();
  }, 100);
}

/* scroll display — hide hint + fade after user scrolls */
function setupScrollHint() {
  const wrapper = document.getElementById('scroll-wrapper');
  const hint    = document.getElementById('scroll-hint');
  const fade    = document.querySelector('.scroll-fade-bottom');

  if (!wrapper) return;

  wrapper.scrollTop = 0;

  function onScroll() {
    if (wrapper.scrollTop > 50) {
      if (hint) hint.classList.add('hidden');
      if (fade) fade.classList.add('hidden');
      wrapper.removeEventListener('scroll', onScroll);
    }
  }
  wrapper.addEventListener('scroll', onScroll);
}

/* scroll display — "Далее" button goes to reward scene */
function proceedToReward() {
  showScene(4);
}

function launchConfetti() {
  const defaults = { spread: 360, ticks: 90, gravity: 0.4, decay: 0.94, startVelocity: 22, zIndex: 999 };
  const colors   = ['#d4a017', '#f5d76e', '#8b6914', '#fff8e7', '#ffe066', '#c8102e'];

  function burst(n, origin) { confetti({ ...defaults, particleCount: n, colors, origin }); }

  burst(45, { x: 0.5, y: 0.45 });
  setTimeout(() => burst(32, { x: 0.28, y: 0.5  }), 200);
  setTimeout(() => burst(32, { x: 0.72, y: 0.5  }), 350);
  setTimeout(() => burst(28, { x: 0.4,  y: 0.35 }), 550);
  setTimeout(() => burst(28, { x: 0.6,  y: 0.35 }), 700);
}

/* ═══════════════════════════════════════════════
   SCENE 4 — REWARD
   ═══════════════════════════════════════════════ */

function onRewardEnter() {
  document.getElementById('reward-title').textContent = CONTENT.reward.title;
  document.getElementById('reward-text').textContent  = CONTENT.reward.body;

  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  CERTIFICATES.forEach((cert, i) => {
    const card = document.createElement('div');
    card.className = 'cert-card';
    const media = cert.img
      ? `<img class="cert-img" src="${cert.img}" alt="${cert.name}">`
      : `<span class="cert-icon">${cert.icon || '🎁'}</span>`;
    card.innerHTML = `
      ${media}
      <div class="cert-name">${cert.name}</div>
      <div class="cert-poem">${cert.poem}</div>
      <div class="cert-label">${CONTENT.reward.cardLabel}</div>
    `;
    container.appendChild(card);
    setTimeout(() => card.classList.add('visible'), 400 * (i + 1));
  });

  setTimeout(() => launchConfetti(), 700);
}

/* ═══════════════════════════════════════════════
   GOLD SPARKLE PARTICLES
   ═══════════════════════════════════════════════ */

function createGoldParticles() {
  const container = document.getElementById('particles-bg');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 3;
    const dur  = 9 + Math.random() * 11;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      --drift: ${-70 + Math.random() * 140}px;
      animation: particleDrift ${dur}s ${Math.random() * dur}s linear infinite;
    `;
    container.appendChild(p);
  }
}

/* ═══════════════════════════════════════════════
   INIT CONTENT — populate HTML elements from content.js
   ═══════════════════════════════════════════════ */

function initContent() {
  document.title = CONTENT.pageTitle;

  // Scene 1
  document.getElementById('intro-eyebrow').textContent    = CONTENT.intro.eyebrow;
  document.getElementById('intro-title').innerHTML        = CONTENT.intro.title;
  document.getElementById('intro-tagline').textContent    = CONTENT.intro.tagline;
  document.getElementById('intro-verse').innerHTML        = CONTENT.intro.verse;
  document.getElementById('intro-start-btn').textContent  = CONTENT.intro.startBtn;

  // Scene 2
  document.getElementById('chest-title').textContent      = CONTENT.chest.title;
  document.getElementById('chest-hint').innerHTML         = CONTENT.chest.hint;
  document.getElementById('chest-open-btn').textContent   = CONTENT.chest.openBtn;

  // Scene 3
  document.getElementById('opening-verse').innerHTML      = CONTENT.opening.verse;

  // Scene scroll
  document.getElementById('scroll-hint-text').textContent = CONTENT.scroll.hint;
  document.getElementById('scroll-next-btn').textContent  = CONTENT.scroll.nextBtn;
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
initContent();
buildComboLock();
createGoldParticles();
