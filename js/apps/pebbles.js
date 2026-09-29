/* ===== Pebbles: the pet rock =====
   A painted rock lives in a small meadow. It breathes, blinks, sleeps at night, and thinks in bubbles.
   The child taps it, rubs it, gives it tricks, dresses it, and plays 2 small games with it.
   Nothing decays and nothing resets: the rock never needs the child.
   Pictures: art/pebbles/, all layers of the rock share one 1024 canvas (brief 11 of Astra). */
{
const t = OS.texts('pebbles');

var PebblesApp = (() => {
  const STORE_KEY = 'kidsOS_pebbles';

  /* ---- Rules with no screen. Node test: _work/pebbles.test.mjs ---- */
  const core = (() => {
    const PLACES = ['head', 'eyes', 'neck', 'back'];
    const ITEMS = {
      'top-hat': 'head', crown: 'head', 'flower-crown': 'head',
      sunglasses: 'eyes', 'googly-eyes': 'eyes',
      'bow-tie': 'neck', scarf: 'neck',
      cape: 'back',
    };
    const START_OPEN = ['top-hat', 'bow-tie'];
    const GIFT_ORDER = ['crown', 'sunglasses', 'scarf', 'cape', 'flower-crown', 'googly-eyes'];
    const GIFT_ACTIONS = ['roll', 'dead', 'jump', 'shake', 'rub', 'game'];
    // First version of the app: accessories opened at an XP value
    const OLD_ITEMS = { eyes: ['googly-eyes', 0], hat: ['top-hat', 30], bow: ['bow-tie', 75], sunglasses: ['sunglasses', 150], crown: ['crown', 300], cape: ['cape', 500] };
    const EYES = ['open', 'closed', 'happy', 'wide', 'x'];
    const MOUTHS = ['smile', 'open', 'flat'];
    const PICTURES = [
      'pebbles-body', 'pebbles-leaf', ...EYES.map(e => 'pebbles-eyes-' + e), ...MOUTHS.map(m => 'pebbles-mouth-' + m),
      'pebbles-blush', 'pebbles-shine', 'pebbles-shadow',
      ...Object.keys(ITEMS).map(id => 'wear-' + id),
      'pebbles-box-back', 'pebbles-box-front', 'pebbles-scene-day', 'pebbles-scene-night',
      ...['heart', 'star', 'zzz', 'question', 'exclaim', 'note', 'sparkle', 'drop', 'sun'].map(b => 'bubble-' + b),
      ...['sit', 'stay', 'play-dead', 'roll-over', 'jump', 'shake-hands'].map(k => 'trick-' + k),
      'hand-rock', 'hand-paper', 'hand-scissors', 'leaf-pile', 'critter-snail', 'critter-ladybug', 'fx-puff', 'gift',
    ].map(f => f + '.webp');
    // Rub: 3 changes of direction within 1.5 s, each part 12 px or longer. ponytail: first guess, tune on the tablet
    const RUB_TURNS = 3, RUB_TIME = 1500, RUB_PART = 12;

    const fresh = () => ({ v: 2, name: 'Pebbles', days: 0, lastDay: '', wear: { head: null, eyes: null, neck: null, back: null }, open: START_OPEN.slice(), firsts: [], muted: false });
    const count = n => Number.isFinite(Number(n)) && Number(n) > 0 ? Math.floor(Number(n)) : 0;
    const day = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
    const pad = n => String(n).padStart(2, '0');
    const dayKey = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    const isNight = date => date.getHours() >= 20 || date.getHours() < 7;
    const openItem = (s, id) => { if (ITEMS[id] && !s.open.includes(id)) s.open.push(id); };

    // A stored value of any form gives a working rock
    function load(raw) {
      let saved = null;
      try { saved = JSON.parse(raw); } catch (e) { /* broken value: new rock */ }
      const s = fresh();
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return s;
      if (typeof saved.name === 'string' && saved.name.trim()) s.name = saved.name.trim().slice(0, 20);
      if (saved.v === 2) {
        s.days = count(saved.days);
        s.lastDay = day(saved.lastDay);
        s.muted = saved.muted === true;
        if (Array.isArray(saved.open)) saved.open.forEach(id => openItem(s, id));
        if (Array.isArray(saved.firsts)) saved.firsts.forEach(a => { if (GIFT_ACTIONS.includes(a) && !s.firsts.includes(a)) s.firsts.push(a); });
        const wear = saved.wear && typeof saved.wear === 'object' ? saved.wear : {};
        PLACES.forEach(p => { if (ITEMS[wear[p]] === p && s.open.includes(wear[p])) s.wear[p] = wear[p]; });
        return s;
      }
      s.days = Math.max(count(saved.bestStreak), count(saved.streak));
      s.lastDay = day(saved.lastDate);
      if (s.lastDay) s.days = Math.max(s.days, 1);
      if ('xp' in saved) Object.values(OLD_ITEMS).forEach(([id, xp]) => { if (count(saved.xp) >= xp) openItem(s, id); });
      const worn = OLD_ITEMS[saved.currentAccessory];
      if (worn && saved.currentAccessory !== 'eyes' && s.open.includes(worn[0])) s.wear[ITEMS[worn[0]]] = worn[0];
      return s;
    }

    // One open of the app on this date: a new day together, and the greeting
    function visit(s, date) {
      const today = dayKey(date);
      if (!s.lastDay) { s.days = Math.max(s.days, 1); s.lastDay = today; return 'first'; }
      if (today <= s.lastDay) return null; // same day, or the clock went back
      const gap = Math.round((new Date(today + 'T12:00') - new Date(s.lastDay + 'T12:00')) / 86400000);
      s.days += 1;
      s.lastDay = today;
      if (gap >= 2) return 'back';
      return date.getHours() >= 7 && date.getHours() < 12 ? 'morning' : null;
    }

    // First try of a gift action: the next closed item of the gift order, or null
    function firstTry(s, action) {
      if (!GIFT_ACTIONS.includes(action) || s.firsts.includes(action)) return null;
      s.firsts.push(action);
      const item = GIFT_ORDER.find(id => !s.open.includes(id)) || null;
      if (item) s.open.push(item);
      return item;
    }

    // Put an open item on, or take it off when the rock wears it
    function wear(s, id) {
      const place = ITEMS[id];
      if (!place || !s.open.includes(id)) return false;
      s.wear[place] = s.wear[place] === id ? null : id;
      return true;
    }

    // The child against a rock. Pebbles always plays rock
    const rps = hand => hand === 'paper' ? 'win' : hand === 'rock' ? 'tie' : 'lose';

    function rubber() {
      let runs = null, turns = [];
      const run = v => ({ dir: 0, start: v, pos: v });
      function track(r, v, now) {
        const step = v - r.pos;
        if (!step) return;
        const dir = step > 0 ? 1 : -1;
        if (r.dir && dir !== r.dir) {
          if (Math.abs(r.pos - r.start) >= RUB_PART) turns.push(now);
          r.start = r.pos;
        }
        r.dir = dir;
        r.pos = v;
      }
      return {
        down(x, y) { runs = [run(x), run(y)]; turns = []; },
        move(x, y, now) {
          if (!runs) return false;
          track(runs[0], x, now);
          track(runs[1], y, now);
          turns = turns.filter(at => now - at <= RUB_TIME);
          if (turns.length < RUB_TURNS) return false;
          turns = [];
          return true;
        },
        up() { runs = null; },
      };
    }

    // A second press within ms after the last accepted press is a holdover (research): ignore it
    function guard(ms) {
      let last = -Infinity;
      return now => { if (now - last < ms) return false; last = now; return true; };
    }

    return { PLACES, ITEMS, START_OPEN, GIFT_ORDER, GIFT_ACTIONS, EYES, MOUTHS, PICTURES, fresh, load, dayKey, isNight, visit, firstTry, wear, rps, rubber, guard };
  })();

  /* ---- Pictures ---- */
  const ART = 'art/pebbles/';
  // A bubble picture has a short name ('heart'). Other pictures have their file name ('hand-rock', 'gift')
  const pic = name => ART + (name.includes('-') || name === 'gift' ? name : 'bubble-' + name) + '.webp';
  const img = (cls, file) => `<img class="${cls}" src="${ART}${file}.webp" alt="" draggable="false">`;
  // Zone of each place in the rock canvas (brief 11): a square around it makes the picture of an item
  const ZONES = { head: [230, 110, 640, 420], eyes: [330, 555, 690, 660], neck: [390, 660, 630, 790], back: [110, 250, 914, 800] };

  const GREETING = {
    first: ['heart', () => t("Hi! I'm Pebbles. I'm a rock.")],
    back: ['heart', () => t("You're back! I didn't move.")],
    morning: ['sun', () => t('Good morning! I stayed.')],
  };

  /* ---- Sound: short tones made in code, no sound files ---- */
  function sounds() {
    let audio = null;
    // [from Hz, to Hz, seconds, wave, start after seconds, volume]
    const TUNES = {
      pop: [[520, 880, 0.08, 'sine', 0, 0.1]],
      giggle: [[700, 900, 0.07, 'triangle', 0, 0.08], [800, 1000, 0.07, 'triangle', 0.09, 0.08], [900, 1150, 0.08, 'triangle', 0.18, 0.08]],
      shine: [[1200, 2000, 0.22, 'sine', 0, 0.06], [1600, 2600, 0.2, 'sine', 0.1, 0.05]],
      chime: [[660, 660, 0.16, 'triangle', 0, 0.1], [990, 990, 0.3, 'triangle', 0.14, 0.1]],
      boing: [[180, 620, 0.28, 'sine', 0, 0.12]],
      whoosh: [[420, 90, 0.45, 'sawtooth', 0, 0.03]],
      snore: [[95, 70, 0.7, 'sine', 0, 0.12]],
      win: [[523, 523, 0.12, 'triangle', 0, 0.1], [659, 659, 0.12, 'triangle', 0.12, 0.1], [784, 784, 0.24, 'triangle', 0.24, 0.1]],
    };
    function tone(from, to, seconds, type, after, volume) {
      const start = audio.currentTime + after;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, start);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + seconds);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + seconds);
    }
    return {
      // A browser starts audio only after a touch
      unlock() {
        if (!audio) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) audio = new Ctx(); }
        if (audio && audio.state === 'suspended') audio.resume();
      },
      play(name) { if (audio && state && !state.muted) (TUNES[name] || []).forEach(n => tone(...n)); },
      close() { if (audio) { audio.close(); audio = null; } },
    };
  }

  /* ---- The app ---- */
  let app = null, rig = null, bubble = null, bubbleText = null, bubbleImg = null, tag = null, bar = null, panel = null;
  let state = null, tones = null, controller = null, observer = null;
  let paused = false, night = null, sleeping = false, awake = false;
  let blinkTimer = null, bubbleTimer = null, nightTimer = null;
  const timers = new Set();

  // A timer that destroy() and pause() can clear
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

  function rigHTML() {
    return '<div class="pb-rig" data-eyes="open" data-mouth="smile">' +
      img('pb-l pb-l-shadow', 'pebbles-shadow') +
      '<img class="pb-l pb-l-wear-back" alt="" draggable="false" hidden>' +
      img('pb-l pb-l-body', 'pebbles-body') +
      '<div class="pb-l pb-shine-clip">' + img('pb-l pb-l-shine', 'pebbles-shine') + '</div>' +
      img('pb-l pb-l-blush', 'pebbles-blush') +
      core.EYES.map(e => img('pb-l pb-eye pb-eye-' + e, 'pebbles-eyes-' + e)).join('') +
      core.MOUTHS.map(m => img('pb-l pb-mouth pb-mouth-' + m, 'pebbles-mouth-' + m)).join('') +
      img('pb-l pb-l-leaf', 'pebbles-leaf') +
      ['eyes', 'neck', 'head'].map(p => `<img class="pb-l pb-l-wear-${p}" alt="" draggable="false" hidden>`).join('') +
      '</div>';
  }

  // Picture of an item: its layer, cut to a square around the zone of its place
  function thumb(id) {
    const [x0, y0, x1, y1] = ZONES[core.ITEMS[id]];
    const side = Math.max(x1 - x0, y1 - y0);
    const scale = 1024 / side;
    const left = ((x0 + x1) / 2 - side / 2) / side * 100, top = ((y0 + y1) / 2 - side / 2) / side * 100;
    return `<span class="pb-thumb"><img src="${ART}wear-${id}.webp" alt="" draggable="false" style="width:${scale * 100}%;height:${scale * 100}%;left:${-left}%;top:${-top}%"></span>`;
  }

  function getHTML() {
    return `<div class="pb-app">
      ${img('pb-scene pb-scene-day', 'pebbles-scene-day')}
      ${img('pb-scene pb-scene-night', 'pebbles-scene-night')}
      <div class="pb-stage">
        <div class="pb-spot">
          ${img('pb-box pb-box-back', 'pebbles-box-back')}
          <div class="pb-move">${rigHTML()}</div>
          ${img('pb-box pb-box-front', 'pebbles-box-front')}
          <div class="pb-bubble" hidden><img alt=""><span class="pb-bubble-text"></span></div>
        </div>
        <div class="pb-play"></div>
      </div>
      <button class="pb-tag" data-act="card"><span class="pb-tag-name"></span><span class="pb-tag-days"></span></button>
      <button class="pb-round" data-act="sound" aria-label="${t('Sound')}">🔊</button>
      <div class="pb-panel" hidden></div>
      <nav class="pb-bar">
        <button data-act="tricks">${img('', 'trick-jump')}<span>${t('Tricks')}</span></button>
        <button data-act="dress">${thumb('top-hat')}<span>${t('Dress up')}</span></button>
        <button data-act="games">${img('', 'hand-paper')}<span>${t('Games')}</span></button>
      </nav>
      <div class="pb-fx"></div>
      <div class="pb-card" hidden></div>
    </div>`;
  }

  function init(winId) {
    app = document.getElementById('win-body-' + winId).querySelector('.pb-app');
    rig = app.querySelector('.pb-rig');
    bubble = app.querySelector('.pb-bubble');
    bubbleText = bubble.querySelector('.pb-bubble-text');
    bubbleImg = bubble.querySelector('img');
    tag = app.querySelector('.pb-tag');
    bar = app.querySelector('.pb-bar');
    panel = app.querySelector('.pb-panel');
    state = core.load(localStorage.getItem(STORE_KEY));
    const greet = core.visit(state, OS.now());
    save();
    tones = sounds();
    paused = false; night = null; sleeping = false; awake = false;

    controller = new AbortController();
    app.addEventListener('click', onClick, { signal: controller.signal });
    observer = new ResizeObserver(layout);
    observer.observe(app);
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    app.classList.toggle('pb-calm', !!calm);

    showTag();
    showWear();
    showSound();
    layout();
    checkNight();
    nightTimer = setInterval(checkNight, 60000);
    blinkLater();
    if (!night && greet) say(GREETING[greet][0], GREETING[greet][1]());
  }

  function destroy() {
    clearTimers();
    clearTimeout(blinkTimer); clearTimeout(bubbleTimer); clearInterval(nightTimer);
    blinkTimer = bubbleTimer = nightTimer = null;
    if (observer) observer.disconnect();
    if (controller) controller.abort();
    if (tones) tones.close();
    app = rig = bubble = bubbleText = bubbleImg = tag = bar = panel = null;
    state = tones = controller = observer = null;
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* full storage: the rock stays as it is */ }
  }

  /* ---- Layout: the rock gets the free part of the frame ---- */
  function layout() {
    if (!app) return;
    const W = app.clientWidth, H = app.clientHeight;
    if (!W || !H) return;
    const wide = W > H;
    app.classList.toggle('pb-wide', wide);
    app.classList.toggle('pb-tall', !wide);
    const barH = bar.offsetHeight;
    app.style.setProperty('--bar', barH + 'px');
    const open = !panel.hidden;
    const freeW = open && wide ? W * 0.62 : W;
    const freeH = H - barH - (open && !wide ? panel.offsetHeight + 8 : 0);
    const stage = app.querySelector('.pb-stage');
    stage.style.width = freeW + 'px';
    stage.style.height = freeH + 'px';
    app.style.setProperty('--rig', Math.round(Math.max(80, Math.min(freeH * 0.62, freeW * 0.8))) + 'px');
  }

  /* ---- Face, blink, bubble ---- */
  function face(eyes, mouth) { rig.dataset.eyes = eyes; rig.dataset.mouth = mouth; }
  function restFace() { face(sleeping ? 'closed' : 'open', 'smile'); }

  function blinkLater() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(blink, 2000 + Math.random() * 4000);
  }
  function blink() {
    if (!rig) return;
    const close = () => { if (rig && rig.dataset.eyes === 'open') rig.dataset.eyes = 'closed'; };
    const open = () => { if (rig && rig.dataset.eyes === 'closed' && !sleeping) rig.dataset.eyes = 'open'; };
    if (rig.dataset.eyes === 'open') {
      close();
      later(open, 120);
      if (Math.random() < 0.2) { later(close, 270); later(open, 390); }
    }
    blinkLater();
  }

  function say(name, text, keep) {
    if (!bubble) return;
    bubbleImg.src = pic(name);
    bubbleText.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove('pb-pop');
    void bubble.offsetWidth; // start the pop again
    bubble.classList.add('pb-pop');
    clearTimeout(bubbleTimer);
    bubbleTimer = keep ? null : setTimeout(hush, Math.min(5000, 2500 + 50 * text.length));
  }
  function hush() {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
    if (bubble) bubble.hidden = true;
  }

  /* ---- Tag, dress, sound ---- */
  const rockName = () => state.name === 'Pebbles' ? t('Pebbles') : state.name;
  function showTag() {
    tag.querySelector('.pb-tag-name').textContent = rockName();
    tag.querySelector('.pb-tag-days').textContent = t('{n} {days} together', { n: state.days, days: t.plural(state.days, 'day', 'days') });
  }
  function showWear() {
    for (const place of core.PLACES) {
      const layer = rig.querySelector('.pb-l-wear-' + place);
      const id = state.wear[place];
      if (id) { layer.src = ART + 'wear-' + id + '.webp'; layer.hidden = false; }
      else { layer.hidden = true; layer.removeAttribute('src'); }
    }
  }
  function showSound() {
    const btn = app.querySelector('[data-act="sound"]');
    btn.textContent = state.muted ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', String(!state.muted));
  }

  /* ---- Night: the device clock of KidsOS, 20:00 to 06:59 ---- */
  function checkNight() {
    if (!app) return;
    const now = core.isNight(OS.now());
    if (now === night) return;
    night = now;
    app.classList.toggle('pb-night', night);
    if (night) fallAsleep(); else wakeUp();
  }
  function fallAsleep() {
    sleeping = true; awake = false;
    app.classList.add('pb-sleep');
    restFace();
    say('zzz', t('Zzz...'), true);
  }
  function wakeUp() {
    const wasAsleep = sleeping;
    sleeping = false; awake = false;
    app.classList.remove('pb-sleep');
    restFace();
    if (wasAsleep) hush();
  }

  /* ---- Home button: the app waits in the dock ---- */
  function pause() {
    if (!app || paused) return;
    paused = true;
    app.classList.add('pb-paused');
    clearTimeout(blinkTimer); blinkTimer = null;
    clearInterval(nightTimer); nightTimer = null;
  }
  function resume() {
    if (!app || !paused) return;
    paused = false;
    app.classList.remove('pb-paused');
    checkNight();
    nightTimer = setInterval(checkNight, 60000);
    blinkLater();
  }

  /* ---- Input ---- */
  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || !state) return;
    tones.unlock();
    const act = btn.dataset.act;
    if (act === 'sound') { state.muted = !state.muted; save(); showSound(); }
  }

  return {
    core, getHTML, init, destroy, pause, resume, checkNight, say,
    // For the tests
    get state() { return state; },
    get paused() { return paused; },
    get night() { return night === true; },
    get awake() { return awake; },
    get blinking() { return blinkTimer !== null; },
    get muted() { return !!(state && state.muted); },
    get bubble() { return bubble && !bubble.hidden ? bubbleText.textContent : ''; },
  };
})();

OS.registerApp('pebbles', {
  singleInstance: true,
  getWindowOpts() {
    return {
      id: 'pebbles', title: t('Pebbles'), icon: '🪨',
      stage: false, // the scene fills the frame, the rock gets its size from the free part
      width: 760, height: 560,
      content: PebblesApp.getHTML(),
    };
  },
  onOpen(id) { PebblesApp.init(id); },
  onClose() { PebblesApp.destroy(); },
  // Home button: the rock waits in the dock
  onMinimize() { PebblesApp.pause(); },
  onRestore() { PebblesApp.resume(); },
});
}
