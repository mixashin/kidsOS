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

  // Lines with their bubble picture. A function, so the language of the moment is used
  const TAPS = () => [
    ['heart', t('Hee hee! That tickles.')], ['note', t('Boop!')], ['exclaim', t('Whoa. I moved!')], ['heart', t('Best human ever.')],
    ['sparkle', t('I feel so rocky.')], ['question', t('Was that a poke?')], ['note', t('Wiggle wiggle.')], ['heart', t('Again! Again!')],
  ];
  const RUBS = () => [['sparkle', t('Shiny!')], ['sparkle', t('So polished!')], ['sparkle', t('I can see myself!')]];
  const ITEM_NAMES = () => ({
    'top-hat': t('Top hat'), crown: t('Crown'), 'flower-crown': t('Flower crown'), sunglasses: t('Sunglasses'),
    'googly-eyes': t('Googly eyes'), 'bow-tie': t('Bow tie'), scarf: t('Scarf'), cape: t('Cape'),
  });
  const PLACE_NAMES = () => ({ head: t('Head'), eyes: t('Eyes'), neck: t('Neck'), back: t('Back') });
  const DRESS = () => [['sparkle', t('Fancy!')], ['heart', t('How do I look?')]];
  // Body box of the rock canvas (brief 11), 10 percent larger on each side: a touch slightly outside counts
  const ROCK_AREA = [123, 272, 901, 848];

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
  let paused = false, night = null, sleeping = false, awake = false, busy = false, taps = 0;
  let blinkTimer = null, bubbleTimer = null, nightTimer = null, wakeTimer = null, wakeMs = 30000;
  let tapGuard = null, rubGuard = null, rubber = null, press = null, lastLine = '', panelName = null;
  let game = null, gameToken = 0, rounds = 0, hidden = -1, roundBusy = false;
  const unpaid = [];         // names of gifts that are stored but not shown yet
  const guards = new Map();  // holdover guard of each button
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
      <div class="pb-card" data-act="card-close" hidden></div>
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
    paused = false; night = null; sleeping = false; awake = false; busy = false; taps = 0; press = null; panelName = null;
    guards.clear();
    game = null; gameToken++; rounds = 0; hidden = -1; roundBusy = false;
    tapGuard = core.guard(350);
    rubGuard = core.guard(2000);
    rubber = core.rubber();

    controller = new AbortController();
    const on = (el, type, fn) => el.addEventListener(type, fn, { signal: controller.signal });
    on(app, 'click', onClick);
    const stage = app.querySelector('.pb-stage');
    on(stage, 'pointerdown', onDown);
    on(stage, 'pointermove', onMove);
    on(stage, 'pointerup', onUp);
    on(stage, 'pointercancel', onUp);
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
    unpaid.slice().forEach(pay);
    clearTimers();
    clearTimeout(blinkTimer); clearTimeout(bubbleTimer); clearInterval(nightTimer); clearTimeout(wakeTimer);
    blinkTimer = bubbleTimer = nightTimer = wakeTimer = null;
    press = null; panelName = null; busy = false; game = null; gameToken++; roundBusy = false;
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
  function showWear(target = rig) {
    for (const place of core.PLACES) {
      const layer = target.querySelector('.pb-l-wear-' + place);
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
    clearTimeout(wakeTimer); wakeTimer = null;
    sleeping = true; awake = false;
    app.classList.add('pb-sleep');
    restFace();
    say('zzz', t('Zzz...'), true);
  }
  function wakeUp() {
    clearTimeout(wakeTimer); wakeTimer = null;
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
    touched();
  }

  /* ---- Motion helpers ---- */
  const calm = () => app.classList.contains('pb-calm');
  // Web Animations. With calm motion only the opacity changes
  function animate(el, frames, ms, easing = 'ease-out', fill = 'none') {
    if (!el) return null;
    if (calm()) {
      frames = frames.map(f => { const c = { ...f }; delete c.transform; return c; });
      if (!frames.some(f => 'opacity' in f)) return null;
    }
    return el.animate(frames, { duration: ms, easing, fill });
  }
  // Box of the rock square in app pixels
  function spotBox() {
    const s = app.querySelector('.pb-spot').getBoundingClientRect(), a = app.getBoundingClientRect();
    return { left: s.left - a.left, top: s.top - a.top, width: s.width, height: s.height };
  }
  // Small pictures that float up from the rock and go away
  function float(name, count, cls, from = 0.32) {
    const fx = app.querySelector('.pb-fx');
    const s = spotBox();
    const size = Math.max(22, s.width * 0.09);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('img');
      el.className = cls;
      el.src = pic(name);
      el.alt = '';
      el.draggable = false;
      el.style.width = el.style.height = size + 'px';
      el.style.left = s.left + s.width * (0.35 + 0.3 * Math.random()) - size / 2 + 'px';
      el.style.top = s.top + s.height * from + 'px';
      fx.appendChild(el);
      const a = animate(el, [
        { opacity: 0, transform: 'translate(0, 0) scale(.6)' },
        { opacity: 1, offset: 0.2 },
        { opacity: 0, transform: `translate(${Math.round((Math.random() - 0.5) * 60)}px, ${-Math.round(s.height * 0.35)}px) scale(1)` },
      ], 900 + i * 150);
      if (a) a.onfinish = () => el.remove(); else later(() => el.remove(), 900);
    }
  }
  function buzz(pattern) {
    if (state.muted || typeof navigator.vibrate !== 'function') return;
    try { navigator.vibrate(pattern); } catch (e) { /* no vibration on this device */ }
  }
  // A line of a list, not the same as the last one
  function line(list) {
    const pool = list.filter(([, text]) => text !== lastLine);
    const [name, text] = pool[Math.floor(Math.random() * pool.length)];
    lastLine = text;
    say(name, text);
  }

  /* ---- Touch the rock ---- */
  // Place of a pointer in the rock canvas (0 to 1024)
  function onRock(e) {
    const r = app.querySelector('.pb-spot').getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 1024, y = (e.clientY - r.top) / r.height * 1024;
    return x >= ROCK_AREA[0] && x <= ROCK_AREA[2] && y >= ROCK_AREA[1] && y <= ROCK_AREA[3];
  }
  function onDown(e) {
    if (!state || e.target.closest('button')) return;
    // A tap on the scene closes a panel. During Hide and Seek the rock is hidden: its place is scene
    if (!onRock(e) || game === 'hide') { closePanel(); return; }
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), moved: 0 };
    rubber.down(e.clientX, e.clientY);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* the pointer is gone */ }
    e.preventDefault();
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    press.moved = Math.max(press.moved, Math.hypot(e.clientX - press.x, e.clientY - press.y));
    if (rubber.move(e.clientX, e.clientY, performance.now())) rubRock();
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const quick = performance.now() - press.at <= 350 && press.moved <= 10;
    press = null;
    rubber.up();
    if (quick && e.type === 'pointerup') tapRock();
  }

  function tapRock() {
    if (busy || !tapGuard(performance.now())) return;
    tones.unlock();
    touched();
    if (sleeping) { halfWake(); return; }
    taps++;
    tones.play(Math.random() < 0.3 ? 'giggle' : 'pop');
    buzz(15);
    animate(app.querySelector('.pb-move'), [
      { transform: 'scale(1, 1)' }, { transform: 'scale(1.08, .9)', offset: 0.3 },
      { transform: 'scale(.97, 1.06)', offset: 0.65 }, { transform: 'scale(1, 1)' },
    ], 450);
    animate(rig.querySelector('.pb-l-leaf'), [{ transform: 'rotate(0)' }, { transform: 'rotate(12deg)', offset: 0.3 }, { transform: 'rotate(-8deg)', offset: 0.65 }, { transform: 'rotate(0)' }], 600);
    face('happy', 'open');
    later(restFace, 450);
    float('heart', 3, 'pb-heart');
    line(TAPS());
  }

  function rubRock() {
    if (busy || !rubGuard(performance.now())) return;
    tones.unlock();
    touched();
    if (sleeping) { halfWake(); return; }
    tones.play('shine');
    buzz([8, 30, 8]);
    animate(rig.querySelector('.pb-l-shine'), [{ opacity: 0, transform: 'translateX(-45%)' }, { opacity: 1, offset: 0.35 }, { opacity: 0, transform: 'translateX(55%)' }], 700);
    animate(rig.querySelector('.pb-l-blush'), [{ opacity: 0.85 }, { opacity: 1, offset: 0.15 }, { opacity: 0.85 }], 2000);
    float('sparkle', 3, 'pb-sparkle');
    face('happy', 'smile');
    later(restFace, 900);
    line(RUBS());
    giftFor('rub', 1400);
  }

  /* ---- Gifts: at the first try of a gift action. Stored at once, shown and paid after the action.
     A gift that the app did not show yet is paid at the close of the window ---- */
  function giftFor(action, delay) {
    const item = core.firstTry(state, action);
    if (!item) return;
    save();
    const name = ITEM_NAMES()[item];
    unpaid.push(name);
    later(() => showGift(item, name), delay);
  }
  function pay(name) {
    const i = unpaid.indexOf(name);
    if (i < 0) return;
    unpaid.splice(i, 1);
    OS.awardCoins(2, 'Pebbles', '🪨', t('Gift: {item}', { item: name }));
  }
  function showGift(item, name) {
    const s = spotBox();
    const size = s.width * 0.3;
    const box = document.createElement('div');
    box.className = 'pb-gift';
    box.innerHTML = `<img src="${pic('gift')}" alt="" draggable="false">`;
    Object.assign(box.style, { width: size + 'px', height: size + 'px', left: s.left + s.width * 0.02 + 'px', top: s.top + s.height * 0.78 - size + 'px' });
    app.querySelector('.pb-fx').appendChild(box);
    animate(box, [{ transform: 'translateY(-300%)' }, { transform: 'translateY(0)', offset: 0.6 }, { transform: 'translateY(-12%)', offset: 0.8 }, { transform: 'translateY(0)' }], 700, 'ease-in');
    tones.play('pop');
    say('gift', t('A present? For me?'));
    later(() => {
      box.innerHTML = thumb(item);
      box.classList.add('pb-gift-open');
      tones.play('chime');
      say('sparkle', t('{item}!', { item: name }));
      pay(name);
      if (panelName === 'dress') refreshPanel();
    }, 1300);
    later(() => box.remove(), 3600);
  }

  /* ---- Night: a touch half-wakes the rock. After wakeMs with no touch it sleeps again ---- */
  function halfWake() {
    awake = true;
    sleeping = false;
    app.classList.remove('pb-sleep');
    face('open', 'open');
    later(restFace, 1500);
    tones.play('snore');
    say('zzz', t('5 more minutes...'));
    touched();
  }
  function touched() {
    if (!night || !awake) return;
    clearTimeout(wakeTimer);
    wakeTimer = setTimeout(() => { wakeTimer = null; if (app && night) fallAsleep(); }, wakeMs);
  }

  /* ---- Panels over the scene ---- */
  const TRICKS = () => [
    ['sit', 'trick-sit', t('Sit')], ['stay', 'trick-stay', t('Stay')], ['dead', 'trick-play-dead', t('Play dead')],
    ['roll', 'trick-roll-over', t('Roll over')], ['jump', 'trick-jump', t('Jump')], ['shake', 'trick-shake-hands', t('Shake hands')],
  ];
  function panelHTML(name) {
    const title = { tricks: t('Tricks'), dress: t('Dress up'), games: t('Games') }[name];
    const head = `<div class="pb-panel-head"><h3>${title}</h3><button class="pb-close" data-act="close" aria-label="${t('Close')}">✕</button></div>`;
    if (name === 'tricks') {
      return head + '<div class="pb-grid">' + TRICKS().map(([id, file, label]) =>
        `<button class="pb-choice" data-act="trick" data-trick="${id}">${img('', file)}<span>${label}</span></button>`).join('') + '</div>';
    }
    if (name === 'dress') {
      const names = ITEM_NAMES(), places = PLACE_NAMES();
      // A closed item is a closed gift box: no text says how to open it
      const item = (id, place) => state.open.includes(id)
        ? `<button class="pb-choice pb-item${state.wear[place] === id ? ' pb-on' : ''}" data-act="wear" data-item="${id}" aria-pressed="${state.wear[place] === id}">${thumb(id)}<span>${names[id]}</span></button>`
        : `<button class="pb-choice pb-item pb-closed" data-act="wear" data-item="${id}" aria-label="${t('Surprise')}">${img('', 'gift')}<span>?</span></button>`;
      return head + core.PLACES.map(place => `<div class="pb-row" data-place="${place}"><span class="pb-row-label">${places[place]}</span><div class="pb-row-items">` +
        Object.keys(core.ITEMS).filter(id => core.ITEMS[id] === place).map(id => item(id, place)).join('') + '</div></div>').join('');
    }
    if (name === 'games') {
      return head + '<div class="pb-grid">' + [['rps', 'hand-paper', t('Rock Paper Scissors')], ['hide', 'leaf-pile', t('Hide and Seek')]].map(([id, file, label]) =>
        `<button class="pb-choice" data-act="game" data-game="${id}">${img('', file)}<span>${label}</span></button>`).join('') + '</div>';
    }
    return head;
  }
  // New content of the open panel, with the same scroll place
  function refreshPanel() {
    if (!panelName) return;
    const top = panel.scrollTop;
    panel.innerHTML = panelHTML(panelName);
    panel.scrollTop = top;
  }

  /* ---- Dress up: one item for each place, all places together ---- */
  function putOn(id) {
    if (!core.wear(state, id)) return; // a closed item does nothing
    save();
    showWear();
    tones.play('pop');
    if (state.wear[core.ITEMS[id]] === id) line(DRESS());
    refreshPanel();
  }
  function openPanel(name) {
    if (panelName === name) { closePanel(); return; }
    panelName = name;
    panel.innerHTML = panelHTML(name);
    panel.hidden = false;
    panel.classList.toggle('pb-busy', busy);
    bar.querySelectorAll('[data-act]').forEach(b => b.classList.toggle('pb-on', b.dataset.act === name));
    layout();
  }
  function closePanel() {
    if (!panelName) return;
    panelName = null;
    panel.hidden = true;
    panel.innerHTML = '';
    bar.querySelectorAll('.pb-on').forEach(b => b.classList.remove('pb-on'));
    layout();
  }

  /* ---- Tricks: the rock does nothing, and gets big praise for it (Pet Rock manual, 1975) ---- */
  function runTrick(id) {
    if (busy) return;
    busy = true;
    panel.classList.add('pb-busy');
    hush();
    const move = app.querySelector('.pb-move');
    let length = 1600;
    if (id === 'sit' || id === 'stay') {
      const [wait, text] = id === 'sit' ? [1000, t('Perfect sit!')] : [2000, t('Still staying.')];
      later(() => { float('star', 3, 'pb-star'); tones.play('chime'); say('star', text); }, wait);
      length = wait + 600;
    } else if (id === 'dead') {
      face('x', 'flat');
      later(() => { restFace(); tones.play('chime'); say('star', t('Ta-da! Still a rock.')); }, 2000);
      length = 2400;
    } else if (id === 'roll') {
      // Out of the frame to the right, back in from the left, turning around the middle of the rock
      const s = spotBox(), W = app.clientWidth;
      tones.play('whoosh');
      face('wide', 'open');
      say('exclaim', t('Wheee!'));
      move.style.transformOrigin = '50% 54.7%';
      const out = animate(move, [{ transform: 'translateX(0) rotate(0)', opacity: 1 }, { opacity: 1, offset: 0.8 },
        { transform: `translateX(${Math.round(W - s.left + 20)}px) rotate(360deg)`, opacity: 0 }], 900, 'ease-in', 'forwards');
      later(() => {
        if (out) out.cancel();
        animate(move, [{ transform: `translateX(${-Math.round(s.left + s.width + 20)}px) rotate(-360deg)`, opacity: 0 }, { opacity: 1, offset: 0.2 },
          { transform: 'translateX(0) rotate(0)', opacity: 1 }], 900, 'ease-out');
      }, 900);
      later(() => {
        move.style.transformOrigin = '';
        float('fx-puff', 1, 'pb-puff', 0.66);
        restFace();
        tones.play('chime');
        say('star', t('Back! Did you miss me?'));
      }, 1850);
      length = 2300;
    } else if (id === 'jump') {
      // The whole jump is 1.5 percent of the rock high. Big praise
      tones.play('boing');
      face('happy', 'open');
      say('note', t('Big jump!'));
      animate(move, [{ transform: 'translateY(0) scale(1, 1)' }, { transform: 'translateY(0) scale(1.1, .88)', offset: 0.25 },
        { transform: 'translateY(-1.5%) scale(.96, 1.05)', offset: 0.5 }, { transform: 'translateY(0) scale(1.08, .92)', offset: 0.75 },
        { transform: 'translateY(0) scale(1, 1)' }], 800);
      later(() => float('sparkle', 5, 'pb-sparkle'), 450);
      later(restFace, 1000);
      length = 1400;
    } else if (id === 'shake') {
      // No hands: the leaf waves
      tones.play('pop');
      face('open', 'flat');
      say('question', t('Hands? What hands?'));
      animate(rig.querySelector('.pb-l-leaf'), [{ transform: 'rotate(0)' }, { transform: 'rotate(16deg)', offset: 0.17 }, { transform: 'rotate(-10deg)', offset: 0.34 },
        { transform: 'rotate(16deg)', offset: 0.5 }, { transform: 'rotate(-10deg)', offset: 0.67 }, { transform: 'rotate(16deg)', offset: 0.83 },
        { transform: 'rotate(0)' }], 1200, 'ease-in-out');
      later(restFace, 1400);
      length = 1600;
    }
    // Gift actions: the gift is stored now, so a close during the trick keeps it
    if (['dead', 'roll', 'jump', 'shake'].includes(id)) giftFor(id, length + 300);
    later(() => { busy = false; if (panel) panel.classList.remove('pb-busy'); }, length);
  }

  /* ---- Games in the scene. No time limit, no score. Only the bar buttons end a game ---- */
  const play = () => app.querySelector('.pb-play');
  // A timer of the running game: it does nothing after the game ends
  function gameLater(fn, ms) {
    const token = gameToken;
    later(() => { if (token === gameToken && app) fn(); }, ms);
  }
  function startGame(id) {
    endGame();
    game = id;
    rounds = 0;
    bar.querySelector('[data-act="games"]').classList.add('pb-on');
    if (id === 'rps') startRps(); else hideRound();
  }
  function endGame() {
    if (!game) return;
    gameToken++;
    game = null;
    hidden = -1;
    roundBusy = false;
    play().innerHTML = '';
    app.classList.remove('pb-hiding');
    app.style.removeProperty('--dx');
    bar.querySelector('[data-act="games"]').classList.remove('pb-on');
    hush();
    restFace();
  }

  // Rock Paper Scissors: Pebbles always plays rock. The child finds out that paper always wins
  function startRps() {
    const names = { rock: t('Rock'), paper: t('Paper'), scissors: t('Scissors') };
    play().innerHTML = '<div class="pb-hands">' + ['rock', 'paper', 'scissors'].map(h =>
      `<button class="pb-hand" data-act="hand" data-hand="${h}">${img('', 'hand-' + h)}<span>${names[h]}</span></button>`).join('') + '</div>';
    say('question', t('Rock, paper, scissors?'));
  }
  function rpsRound(hand) {
    if (game !== 'rps' || roundBusy) return;
    roundBusy = true;
    rounds++;
    const row = play().querySelector('.pb-hands');
    row.classList.add('pb-wait');
    const s = spotBox(), size = s.width * 0.34;
    const shown = document.createElement('img');
    shown.className = 'pb-shown-hand';
    shown.src = pic('hand-' + hand);
    shown.alt = '';
    Object.assign(shown.style, { width: size + 'px', height: size + 'px', left: s.left - size * 0.55 + 'px', top: s.top + s.height * 0.42 + 'px' });
    play().appendChild(shown);
    animate(shown, [{ transform: 'translateY(60%) scale(.5)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], 350);
    tones.play('pop');
    hush();
    gameLater(() => {
      const result = core.rps(hand);
      if (result === 'win') {
        face('wide', 'open');
        tones.play('win');
        say('drop', Math.random() < 0.5 ? t('Paper? Again?!') : t('Wrapped up. Again.'));
      } else if (result === 'tie') {
        face('open', 'flat');
        say('hand-rock', t('Rock vs rock. Classic.'));
      } else {
        face('happy', 'smile');
        tones.play('chime');
        say('star', t('Rock beats scissors. Obviously.'));
      }
      giftFor('game', 900);
    }, 600);
    gameLater(() => { shown.remove(); restFace(); row.classList.remove('pb-wait'); roundBusy = false; }, 2600);
  }

  // Hide and Seek: 3 leaf piles, the leaf of Pebbles sticks out above its pile (a hint for a child of 5)
  function hideRound() {
    hidden = Math.floor(Math.random() * 3);
    app.style.removeProperty('--dx');
    app.classList.remove('pb-hiding');
    restFace();
    say('note', t('Count to 3!'));
    const cover = document.createElement('div');
    cover.className = 'pb-cover';
    cover.innerHTML = '<span>1</span>';
    play().innerHTML = '';
    play().appendChild(cover);
    tones.play('pop');
    gameLater(() => { cover.innerHTML = '<span>2</span>'; tones.play('pop'); }, 1000);
    gameLater(() => { cover.innerHTML = '<span>3</span>'; tones.play('pop'); }, 2000);
    gameLater(() => { cover.remove(); showPiles(); }, 3000);
  }
  function showPiles() {
    hush();
    app.classList.add('pb-hiding');
    const s = spotBox(), stage = app.querySelector('.pb-stage');
    const gap = Math.min(s.width * 0.9, stage.clientWidth * 0.32);
    const size = Math.max(84, Math.min(s.width * 0.82, gap * 0.95));
    const ground = s.top + s.height * 0.78;
    const center = s.left + s.width / 2;
    play().innerHTML = [0, 1, 2].map(i =>
      `<button class="pb-pile" data-act="pile" data-pile="${i}" aria-label="${t('Leaves')}" style="width:${size}px;height:${size}px;left:${center + (i - 1) * gap - size / 2}px;top:${ground - size * 0.85}px">${img('', 'leaf-pile')}</button>`).join('');
    // The leaf zone of the rock canvas (brief 11): x 440 to 816, y 222 to 430
    const leafW = size * 0.5, leafH = leafW * 208 / 376;
    const hint = document.createElement('span');
    hint.className = 'pb-hint';
    hint.innerHTML = `<img src="${ART}pebbles-leaf.webp" alt="" draggable="false" style="width:${1024 / 376 * 100}%;height:${1024 / 208 * 100}%;left:${-440 / 376 * 100}%;top:${-222 / 208 * 100}%">`;
    Object.assign(hint.style, { width: leafW + 'px', height: leafH + 'px', left: center + (hidden - 1) * gap - leafW / 2 + 'px', top: ground - size * 0.85 - leafH * 0.55 + 'px' });
    play().appendChild(hint);
  }
  function pickPile(i) {
    if (game !== 'hide' || roundBusy) return;
    const pile = play().querySelector(`[data-pile="${i}"]`);
    if (!pile || pile.classList.contains('pb-opened')) return;
    if (i !== hidden) {
      // A small friend lives under a wrong pile
      const snail = Math.random() < 0.5;
      pile.classList.add('pb-opened');
      animate(pile, [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)', offset: 0.25 }, { transform: 'rotate(6deg)', offset: 0.75 }, { transform: 'rotate(0)' }], 400);
      pile.insertAdjacentHTML('beforeend', img('pb-critter', snail ? 'critter-snail' : 'critter-ladybug'));
      tones.play('pop');
      say('question', snail ? t('Just a snail.') : t('Just a ladybug.'));
      return;
    }
    roundBusy = true;
    rounds++;
    const s = spotBox(), gap = parseFloat(pile.style.left) + parseFloat(pile.style.width) / 2 - (s.left + s.width / 2);
    app.style.setProperty('--dx', gap + 'px');
    play().querySelectorAll('.pb-pile, .pb-hint').forEach(el => animate(el, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-40%)' }], 500, 'ease-out', 'forwards'));
    app.classList.remove('pb-hiding');
    face('happy', 'open');
    animate(app.querySelector('.pb-move'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-8%)', offset: 0.4 }, { transform: 'translateY(0)' }], 500);
    tones.play('win');
    say('exclaim', t('You found me! How?!'));
    float('heart', 3, 'pb-heart');
    giftFor('game', 1200);
    gameLater(() => { roundBusy = false; hideRound(); }, 2400);
  }

  /* ---- Rock ID card: a pet passport. The meters are a joke: they never change ---- */
  const METERS = () => [
    ['hunger', t('Hunger'), 0, t('Does not hunger')], ['energy', t('Energy'), 100, t('Forever')],
    ['happiness', t('Happiness'), 100, t('Always')], ['moves', t('Moves'), 0, t('Proudly')],
  ];
  function openCard() {
    const card = app.querySelector('.pb-card');
    card.innerHTML = `<div class="pb-card-box" data-act="stay">
      <div class="pb-panel-head"><h3>${t('Rock ID card')}</h3><button class="pb-close" data-act="card-close" aria-label="${t('Close')}">✕</button></div>
      <div class="pb-card-main">
        <div class="pb-photo">${rigHTML()}</div>
        <dl class="pb-facts">
          <dt>${t('Name')}</dt>
          <dd class="pb-name-row"><input class="pb-name-input" type="text" maxlength="20" autocomplete="off" aria-label="${t('Name')}"><button class="pb-ok" data-act="save-name">${t('OK')}</button></dd>
          <dt>${t('Days together')}</dt><dd>${state.days}</dd>
          <dt>${t('Species')}</dt><dd>${t('Rock')}</dd>
          <dt>${t('Favorite food')}</dt><dd>${t('None')}</dd>
        </dl>
      </div>
      <div class="pb-meters">${METERS().map(([id, label, full, note]) =>
        `<div class="pb-meter" data-meter="${id}"><span class="pb-meter-label">${label}</span><span class="pb-bar-track"><span class="pb-fill" style="width:${full}%"></span></span><span class="pb-meter-note">${note}</span></div>`).join('')}</div>
    </div>`;
    const photo = card.querySelector('.pb-rig');
    photo.dataset.eyes = 'happy';
    showWear(photo);
    const input = card.querySelector('.pb-name-input');
    input.value = rockName();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveName(); } }, { signal: controller.signal });
    card.hidden = false;
  }
  function closeCard() {
    const card = app.querySelector('.pb-card');
    card.hidden = true;
    card.innerHTML = '';
  }
  function saveName() {
    const input = app.querySelector('.pb-name-input');
    if (!input) return;
    const name = input.value.trim().slice(0, 20);
    if (name) {
      state.name = name;
      save();
      showTag();
      say('heart', t('I like it!'));
    }
    input.value = rockName();
  }

  /* ---- Input ---- */
  // A second press of the same button within 400 ms is a holdover (research): ignore it
  function pressed(btn) {
    const d = btn.dataset;
    const key = d.act + ':' + (d.trick || d.item || d.game || d.hand || d.pile || '');
    if (!guards.has(key)) guards.set(key, core.guard(400));
    return guards.get(key)(performance.now());
  }
  // A button at night wakes the rock with no bubble
  function wakeQuietly() {
    awake = true;
    sleeping = false;
    app.classList.remove('pb-sleep');
    restFace();
    hush();
    touched();
  }
  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || !state || !pressed(btn)) return;
    tones.unlock();
    touched();
    const act = btn.dataset.act;
    if (sleeping && act !== 'sound') wakeQuietly();
    if (act === 'sound') { state.muted = !state.muted; save(); showSound(); }
    else if (act === 'games' && game) endGame();
    else if (act === 'tricks' || act === 'dress' || act === 'games') { endGame(); openPanel(act); }
    else if (act === 'close') closePanel();
    else if (act === 'trick') runTrick(btn.dataset.trick);
    else if (act === 'wear') putOn(btn.dataset.item);
    else if (act === 'game') { closePanel(); startGame(btn.dataset.game); }
    else if (act === 'hand') rpsRound(btn.dataset.hand);
    else if (act === 'pile') pickPile(Number(btn.dataset.pile));
    else if (act === 'card') openCard();
    else if (act === 'card-close') closeCard();
    else if (act === 'save-name') saveName();
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
    get taps() { return taps; },
    get panel() { return panelName; },
    get card() { return !!app && !app.querySelector('.pb-card').hidden; },
    get game() { return game; },
    get rounds() { return rounds; },
    get hidden() { return hidden; },
    get busy() { return busy; },
    set _wakeMs(ms) { wakeMs = ms; },
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
