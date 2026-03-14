/* ═══════════════════════════════════════════════
   КОНФИГУРАЦИЯ — меняй здесь
   ═══════════════════════════════════════════════ */

const SECRET_CODE = '0000';

// Чтобы добавить приз — скопируй объект ниже и заполни поля:
// { name: 'Название', value: 'Сумма', img: 'assets/имя_файла.jpg' }
// Поле img необязательно — без него покажется иконка-заглушка 🎁
const CERTIFICATES = [
  { name: 'Подарочный сертификат', value: '2 000 ₽', img: 'assets/sertificate.jpg' },
];

const TEXTS = {
  rewardTitle: 'С 8 Марта, красавицы!',
  rewardBody:
    'Вы — сокровища из сказки,\n' +
    'Драгоценней всех на свете!\n' +
    'Принимайте дары с любовью —\n' +
    'От души, при звёздном свете.\n\n' +
    'Пусть сундук сей будет знаком,\n' +
    'Что вы — чудо, вы — награда,\n' +
    'И дарить вам подарки —\n' +
    'Для нас — истинна отрада!',
  errorWrong: 'Замок не поддался! Попробуйте ещё раз...',
};

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
    upBtn.setAttribute('aria-label', 'вверх');
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
    downBtn.setAttribute('aria-label', 'вниз');
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
    errEl.textContent = TEXTS.errorWrong;

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
  // ADDED: chest video — after CSS chest animation settles (~2s), play video
  setTimeout(() => showChestVideo(), 2000);
}

/* ADDED: chest video */
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

/* ADDED: scroll display — scroll text constant */
const SCROLL_TEXT_TITLE = '⚜ Свиток из казны Сберградовской';
const SCROLL_TEXT_BODY =
`Сударыни мудрые и отважные!

Вы разгадали тайну чисел
И открыли казну, что скрыта была
От глаз недостойных.

Но знайте:
рыцари Ливонского ордена
боятся не меча, не копья
и даже не богатырской силы.

Больше всего на свете
страшатся они ведьминских проклятий.

Посему, когда явятся они за казной,
не медлите и не страшитесь.

Говорите громко, единогласно,
и осыпьте их древними заклятиями —
и обратятся они в бегство.

Вот слова силы:

— Да чтоб латы ваши ржавчиной покрылись!
— Чтоб мечи ваши в лапшу согнулись!
— Чтоб шлемы ваши на глаза съехали!
— Чтоб кони ваши задом наперёд ходили!
— Чтоб сапоги ваши к полу прилипли!
— Чтоб щиты ваши мыши прогрызли!
— Чтоб бороды ваши узлом завязались!
— Чтоб доспехи ваши скрипели громче телеги!
— Чтоб шпоры ваши в узел свернулись!
— Чтоб меч ваш от ножен убегал!

Кричите дружно, не жалея голоса —
и не устоит перед вами
ни один рыцарь заморский.

А когда прогоните их прочь,
освободите своих богатырей
и празднуйте победу.

Ибо казна сия —
лишь малая награда
за храбрость вашу и мудрость.

Слава вам,
сударыни-победительницы!`;

/* ADDED: scroll display — show scroll scene */
function showScrollScene() {
  // Populate text
  const titleEl = document.querySelector('#scroll-body-text .scroll-text-title');
  const bodyEl  = document.querySelector('#scroll-body-text .scroll-text-body');
  if (titleEl) titleEl.textContent = SCROLL_TEXT_TITLE;
  if (bodyEl)  bodyEl.textContent  = SCROLL_TEXT_BODY;

  // Transition from active scene to scroll scene
  const prev = document.querySelector('.scene.active');
  if (prev) prev.classList.remove('active');
  setTimeout(() => {
    const scrollScene = document.getElementById('scene-scroll');
    scrollScene.classList.add('active');
    setupScrollHint();
  }, 100);
}

/* ADDED: scroll display — hide hint + fade after user scrolls */
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

/* ADDED: scroll display — "Далее" button goes to reward scene */
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
  document.getElementById('reward-title').textContent = TEXTS.rewardTitle;
  document.getElementById('reward-text').textContent  = TEXTS.rewardBody;

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
      <div class="cert-value">${cert.value}</div>
      <div class="cert-label">дар заветный</div>
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
   INIT
   ═══════════════════════════════════════════════ */
buildComboLock();
createGoldParticles();
