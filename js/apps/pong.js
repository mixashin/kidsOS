/* ===== Pong — one or two players on one device ===== */
const PongApp = (() => {
  const STORE_KEY = 'kidsOS_pong';

  // All text in one place, ready for translation
  const T = {
    title: 'Pong',
    onePlayer: '1 Player',
    twoPlayers: '2 Players',
    playAgain: 'Play again',
    menu: 'Menu',
    resume: 'Play',
    paused: 'Pause',
    wins: 'wins!',
    players: ['Blue', 'Orange'],
    computer: 'Computer',
    coinsSolo: 'Pong: you beat the computer!',
    coinsDuo: 'Pong: a game for two!',
  };

  /* ---- Simulation ----
     Pure and deterministic: the same seed and the same inputs give the same game on every
     device. It uses + - * / and Math.sqrt only, no sin or cos. Network play needs this.
     The court is 1000 x 600 units. Player 0 defends x = 0, player 1 defends x = 1000.
     The screen can show it turned (see toScreen), the simulation does not know. */
  const sim = (() => {
    const W = 1000, H = 600;
    const HZ = 120;
    const BALL_R = 14;
    const PADDLE_X = [50, W - 50];
    const PADDLE_HALF = 75;        // half of the paddle length: large on purpose
    const PADDLE_THICK = 22;
    const PADDLE_SPEED = 1500 / HZ; // units per step
    const SPEED_START = 430 / HZ;
    const SPEED_MAX = 900 / HZ;     // stays below PADDLE_THICK per step, so the ball cannot pass through
    const SPEED_UP = 1.06;
    const SERVE_STEPS = HZ;         // one second before each serve
    const WIN_SCORE = 5;

    // mulberry32: small seeded random number generator
    function random(state) {
      state.seed = (state.seed + 0x6D2B79F5) | 0;
      let t = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function create(seed) {
      const state = {
        seed: seed | 0, tick: 0,
        phase: 'serve',           // 'serve' | 'play' | 'over'
        rally: 0,                 // paddle hits since the last serve
        serveIn: SERVE_STEPS, serveTo: 0,
        ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: SPEED_START },
        paddles: [H / 2, H / 2],  // center of each paddle
        score: [0, 0], winner: -1,
        events: [],               // what happened in the last step: 'hit' | 'wall' | 'point' | 'serve' | 'over'
      };
      state.serveTo = random(state) < 0.5 ? 0 : 1;
      return state;
    }

    function serve(state) {
      const b = state.ball;
      const slope = (random(state) - 0.5) * 1.2;      // -0.6 to 0.6
      const dx = state.serveTo === 0 ? -1 : 1;
      const len = Math.sqrt(1 + slope * slope);
      b.speed = SPEED_START;
      b.vx = dx / len * b.speed;
      b.vy = slope / len * b.speed;
      state.phase = 'play';
      state.rally = 0;
      state.events.push('serve');
    }

    // targets: [y or null, y or null]. Each paddle moves toward its target at a limited speed.
    function step(state, targets) {
      state.events.length = 0;
      state.tick++;
      if (state.phase === 'over') return state;

      for (let i = 0; i < 2; i++) {
        if (targets[i] === null || targets[i] === undefined) continue;
        const want = Math.max(PADDLE_HALF, Math.min(H - PADDLE_HALF, Math.round(targets[i])));
        const delta = want - state.paddles[i];
        state.paddles[i] += Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, delta));
      }

      if (state.phase === 'serve') {
        if (--state.serveIn <= 0) serve(state);
        return state;
      }

      const b = state.ball;
      b.x += b.vx;
      b.y += b.vy;

      if (b.y < BALL_R) { b.y = 2 * BALL_R - b.y; b.vy = -b.vy; state.events.push('wall'); }
      if (b.y > H - BALL_R) { b.y = 2 * (H - BALL_R) - b.y; b.vy = -b.vy; state.events.push('wall'); }

      for (let i = 0; i < 2; i++) {
        const toward = i === 0 ? b.vx < 0 : b.vx > 0;
        if (!toward) continue;
        const face = PADDLE_X[i] + (i === 0 ? PADDLE_THICK / 2 : -PADDLE_THICK / 2);
        const reached = i === 0 ? b.x - BALL_R <= face : b.x + BALL_R >= face;
        const behind = i === 0 ? b.x < PADDLE_X[i] - PADDLE_THICK : b.x > PADDLE_X[i] + PADDLE_THICK;
        const offset = (b.y - state.paddles[i]) / (PADDLE_HALF + BALL_R);
        if (reached && !behind && offset >= -1 && offset <= 1) {
          // Where the ball meets the paddle sets the new direction
          const dy = offset * 0.9;
          const len = Math.sqrt(1 + dy * dy);
          b.speed = Math.min(SPEED_MAX, b.speed * SPEED_UP);
          b.vx = (i === 0 ? 1 : -1) / len * b.speed;
          b.vy = dy / len * b.speed;
          b.x = face + (i === 0 ? BALL_R : -BALL_R);
          state.rally++;
          state.events.push('hit');
        }
      }

      const out = b.x < -BALL_R ? 1 : b.x > W + BALL_R ? 0 : -1; // index of the player who scores
      if (out >= 0) {
        state.score[out]++;
        state.events.push('point');
        b.x = W / 2; b.y = H / 2; b.vx = 0; b.vy = 0;
        if (state.score[out] >= WIN_SCORE) {
          state.phase = 'over';
          state.winner = out;
          state.events.push('over');
        } else {
          state.phase = 'serve';
          state.serveIn = SERVE_STEPS;
          state.serveTo = 1 - out; // the player who lost the point gets the ball
        }
      }
      return state;
    }

    // Computer player. A child must be able to win. So the computer moves slowly, follows
    // the ball only in its own half, and aims a little wrong, in a different way at each hit.
    // Tuned with a model of a slow child (wins about half) and a fast child (wins all).
    const AI_STEP = 2;  // units per step: 240 units per second
    const AI_MISS = [-60, 35, 0, -25, 70, 15, -45];
    function computerTarget(state, player) {
      const b = state.ball;
      const toward = player === 0 ? b.vx < 0 : b.vx > 0;
      const near = player === 0 ? b.x < W * 0.45 : b.x > W * 0.55;
      const miss = AI_MISS[(state.rally + state.score[0] * 3 + state.score[1]) % AI_MISS.length];
      const want = toward && near ? b.y + miss : H / 2;
      const delta = want - state.paddles[player];
      return state.paddles[player] + Math.max(-AI_STEP, Math.min(AI_STEP, delta));
    }

    return { W, H, HZ, BALL_R, PADDLE_X, PADDLE_HALF, PADDLE_THICK, WIN_SCORE, create, step, computerTarget };
  })();

  /* ---- App ---- */
  const COLORS = ['#4fc3f7', '#ffb74d'];
  let root = null, canvas = null, ctx = null, overlay = null;
  let loop = null, observer = null, controller = null;
  let state = null, previous = null;
  let mode = 0;            // 1 or 2 players, 0 = menu
  let paused = false;
  let turned = false;      // true: window is taller than wide, players are at the bottom and at the top
  let view = { scale: 1, left: 0, top: 0, width: 0, height: 0 };
  const pointers = new Map(); // pointerId -> player
  const targets = [null, null];
  const keys = [0, 0];     // direction per player from the keyboard: -1, 0, 1
  let muted = false, audio = null;

  function getHTML() {
    return `
    <div class="pg-wrap">
      <canvas class="pg-canvas"></canvas>
      <div class="pg-hud">
        <button class="pg-round-btn" data-act="pause" aria-label="${T.paused}">⏸</button>
        <button class="pg-round-btn" data-act="sound" aria-label="Sound">🔊</button>
      </div>
      <div class="pg-overlay"></div>
    </div>`;
  }

  function init(winId) {
    root = document.getElementById('win-body-' + winId).querySelector('.pg-wrap');
    canvas = root.querySelector('.pg-canvas');
    ctx = canvas.getContext('2d');
    overlay = root.querySelector('.pg-overlay');
    try { muted = !!JSON.parse(localStorage.getItem(STORE_KEY) || '{}').muted; } catch (e) { muted = false; }

    controller = new AbortController();
    const on = (target, type, fn, opts) => target.addEventListener(type, fn, { signal: controller.signal, ...opts });
    on(root, 'click', onClick);
    on(canvas, 'pointerdown', onPointerDown);
    on(canvas, 'pointermove', onPointerMove);
    on(canvas, 'pointerup', onPointerUp);
    on(canvas, 'pointercancel', onPointerUp);
    on(document, 'keydown', e => onKey(e, true));
    on(document, 'keyup', e => onKey(e, false));

    observer = new ResizeObserver(resize);
    observer.observe(root);
    loop = OS.createLoop(step, render, sim.HZ);
    resize();
    showMenu();
  }

  function destroy() {
    if (loop) loop.stop();
    if (observer) observer.disconnect();
    if (controller) controller.abort();
    if (audio) { audio.close(); audio = null; }
    pointers.clear();
    root = canvas = ctx = overlay = loop = observer = controller = state = previous = null;
    mode = 0;
    paused = false;
  }

  /* ---- Screen and court ---- */
  function resize() {
    if (!canvas) return;
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    turned = box.height > box.width;
    const long = turned ? canvas.height : canvas.width;
    const short = turned ? canvas.width : canvas.height;
    const scale = Math.min(long / sim.W, short / sim.H);
    view = {
      scale, ratio,
      width: (turned ? sim.H : sim.W) * scale,
      height: (turned ? sim.W : sim.H) * scale,
    };
    view.left = (canvas.width - view.width) / 2;
    view.top = (canvas.height - view.height) / 2;
    root.classList.toggle('pg-turned', turned);
    if (!loop || !loop.running) render(1);
  }

  // Court units to canvas pixels. Turned: player 0 is at the bottom, player 1 at the top.
  function toScreen(x, y) {
    return turned
      ? [view.left + y * view.scale, view.top + (sim.W - x) * view.scale]
      : [view.left + x * view.scale, view.top + y * view.scale];
  }

  // Pointer position to court units. Positions outside the court count too: the whole half is a touch zone.
  function toCourt(e) {
    const box = canvas.getBoundingClientRect();
    const px = (e.clientX - box.left) * view.ratio - view.left;
    const py = (e.clientY - box.top) * view.ratio - view.top;
    return turned
      ? { x: sim.W - py / view.scale, y: px / view.scale }
      : { x: px / view.scale, y: py / view.scale };
  }

  /* ---- Input ---- */
  function onPointerDown(e) {
    if (!state || mode === 0) return;
    const p = toCourt(e);
    const player = mode === 1 ? 0 : (p.x < sim.W / 2 ? 0 : 1);
    pointers.set(e.pointerId, player);
    targets[player] = p.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer is gone already */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    const player = pointers.get(e.pointerId);
    if (player === undefined) return;
    targets[player] = toCourt(e).y;
  }

  function onPointerUp(e) {
    const player = pointers.get(e.pointerId);
    if (player === undefined) return;
    pointers.delete(e.pointerId);
    // Another finger of the same player can still be down
    if (![...pointers.values()].includes(player)) targets[player] = null;
  }

  // Physical keys, so the letters work on every keyboard layout
  const KEYS = {
    KeyW: [0, -1], KeyA: [0, -1], KeyS: [0, 1], KeyD: [0, 1],
    ArrowUp: [1, -1], ArrowLeft: [1, -1], ArrowDown: [1, 1], ArrowRight: [1, 1],
  };

  function onKey(e, down) {
    const win = root && root.closest('.window');
    if (!win || !win.classList.contains('focused') || win.classList.contains('minimized')) return;
    if (down && e.code === 'Space' && mode !== 0 && state.phase !== 'over') { e.preventDefault(); setPaused(!paused); return; }
    const key = KEYS[e.code];
    if (!key || mode === 0) return;
    e.preventDefault();
    const player = mode === 1 ? 0 : key[0]; // one player: both key sets move the same paddle
    // Turned court: "left" on screen is a lower y in court units, same as "up" when not turned
    if (down) keys[player] = key[1];
    else if (keys[player] === key[1]) keys[player] = 0;
  }

  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    unlockAudio();
    const act = btn.dataset.act;
    if (act === 'one') start(1);
    else if (act === 'two') start(2);
    else if (act === 'again') start(mode);
    else if (act === 'menu') showMenu();
    else if (act === 'pause') { if (mode !== 0 && state.phase !== 'over') setPaused(!paused); }
    else if (act === 'resume') setPaused(false);
    else if (act === 'sound') setMuted(!muted);
  }

  /* ---- Game flow ---- */
  function start(players) {
    mode = players;
    state = sim.create((Date.now() ^ (Math.random() * 0x7fffffff)) | 0);
    previous = snapshot();
    targets[0] = targets[1] = null;
    keys[0] = keys[1] = 0;
    pointers.clear();
    paused = false;
    overlay.innerHTML = '';
    overlay.classList.remove('pg-show');
    root.classList.add('pg-playing');
    loop.start();
  }

  function showMenu() {
    if (loop) loop.stop();
    mode = 0;
    state = null;
    paused = false;
    root.classList.remove('pg-playing');
    overlay.innerHTML = `
      <div class="pg-panel">
        <div class="pg-logo">🏓</div>
        <div class="pg-title">${T.title}</div>
        <button class="pg-btn" data-act="one" style="--pg-c:${COLORS[0]}"><span>🧒 🤖</span>${T.onePlayer}</button>
        <button class="pg-btn" data-act="two" style="--pg-c:${COLORS[1]}"><span>🧒 🧒</span>${T.twoPlayers}</button>
      </div>`;
    overlay.classList.add('pg-show');
    setMuted(muted);
    render(1);
  }

  function setPaused(value) {
    paused = value;
    if (paused) {
      loop.stop();
      overlay.innerHTML = `
        <div class="pg-panel">
          <div class="pg-logo">⏸</div>
          <button class="pg-btn" data-act="resume" style="--pg-c:${COLORS[0]}"><span>▶</span>${T.resume}</button>
          <button class="pg-btn pg-btn-plain" data-act="menu"><span>🏠</span>${T.menu}</button>
        </div>`;
      overlay.classList.add('pg-show');
    } else {
      overlay.innerHTML = '';
      overlay.classList.remove('pg-show');
      loop.start();
    }
  }

  function gameOver() {
    loop.stop();
    render(1); // show the final score behind the end screen
    const w = state.winner;
    const name = mode === 1 && w === 1 ? T.computer : T.players[w];
    overlay.innerHTML = `
      <div class="pg-panel">
        <div class="pg-logo">${mode === 1 && w === 1 ? '🤖' : '🏆'}</div>
        <div class="pg-title" style="color:${COLORS[w]}">${name} ${T.wins}</div>
        <div class="pg-final">${state.score[0]} : ${state.score[1]}</div>
        <button class="pg-btn" data-act="again" style="--pg-c:${COLORS[w]}"><span>🔁</span>${T.playAgain}</button>
        <button class="pg-btn pg-btn-plain" data-act="menu"><span>🏠</span>${T.menu}</button>
      </div>`;
    overlay.classList.add('pg-show');
    root.classList.remove('pg-playing');
    if (mode === 2) OS.awardCoins(2, 'pong', '🏓', T.coinsDuo);
    else if (w === 0) OS.awardCoins(3, 'pong', '🏓', T.coinsSolo);
  }

  function snapshot() {
    return { bx: state.ball.x, by: state.ball.y, p0: state.paddles[0], p1: state.paddles[1] };
  }

  function step() {
    previous = snapshot();
    const input = [targets[0], targets[1]];
    for (let i = 0; i < 2; i++) {
      if (keys[i] !== 0) input[i] = state.paddles[i] + keys[i] * 1000;
    }
    if (mode === 1) input[1] = sim.computerTarget(state, 1);
    sim.step(state, input);
    for (const ev of state.events) {
      if (ev === 'hit') beep(520, 0.05);
      else if (ev === 'wall') beep(330, 0.04);
      else if (ev === 'point') beep(200, 0.25);
      else if (ev === 'over') gameOver();
    }
  }

  /* ---- Drawing ---- */
  function rect(x, y, halfW, halfH, radius) {
    // Court units. Turned court swaps the two axes.
    const [sx, sy] = toScreen(x, y);
    const w = (turned ? halfH : halfW) * view.scale;
    const h = (turned ? halfW : halfH) * view.scale;
    ctx.beginPath();
    ctx.roundRect(sx - w, sy - h, w * 2, h * 2, radius * view.scale);
    ctx.fill();
  }

  function render(alpha) {
    if (!ctx) return;
    ctx.fillStyle = '#0d1b33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Court
    ctx.fillStyle = '#12284a';
    ctx.beginPath();
    ctx.roundRect(view.left, view.top, view.width, view.height, 18 * view.scale);
    ctx.fill();

    // Center line
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let y = 20; y < sim.H; y += 60) rect(sim.W / 2, y + 15, 4, 15, 3);

    const s = state;
    const score = s ? s.score : [0, 0];

    // Score: large numbers, one in each half
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${150 * view.scale}px system-ui, sans-serif`;
    for (let i = 0; i < 2; i++) {
      const [sx, sy] = toScreen(i === 0 ? sim.W * 0.27 : sim.W * 0.73, sim.H / 2);
      ctx.fillStyle = COLORS[i] + '40';
      ctx.fillText(String(score[i]), sx, sy);
    }

    // Win marks: 5 dots per player, filled for each point
    for (let i = 0; i < 2; i++) {
      for (let n = 0; n < sim.WIN_SCORE; n++) {
        // Start away from the center: the pause and sound buttons sit there
        const x = i === 0 ? sim.W / 2 - 110 - n * 34 : sim.W / 2 + 110 + n * 34;
        const [sx, sy] = toScreen(x, 30);
        ctx.beginPath();
        ctx.arc(sx, sy, 10 * view.scale, 0, Math.PI * 2);
        ctx.fillStyle = n < score[i] ? COLORS[i] : 'rgba(255,255,255,0.15)';
        ctx.fill();
      }
    }

    if (!s) return;
    const mix = (a, b) => a + (b - a) * alpha;
    const p0 = previous ? mix(previous.p0, s.paddles[0]) : s.paddles[0];
    const p1 = previous ? mix(previous.p1, s.paddles[1]) : s.paddles[1];

    ctx.fillStyle = COLORS[0];
    rect(sim.PADDLE_X[0], p0, sim.PADDLE_THICK / 2, sim.PADDLE_HALF, 10);
    ctx.fillStyle = COLORS[1];
    rect(sim.PADDLE_X[1], p1, sim.PADDLE_THICK / 2, sim.PADDLE_HALF, 10);

    if (s.phase !== 'over') {
      // No blend across the jump back to the center after a point
      const jump = previous && Math.abs(previous.bx - s.ball.x) > 100;
      const bx = previous && !jump ? mix(previous.bx, s.ball.x) : s.ball.x;
      const by = previous && !jump ? mix(previous.by, s.ball.y) : s.ball.y;
      const [sx, sy] = toScreen(bx, by);
      // Before a serve the ball pulses, so the children see that it starts soon
      const pulse = s.phase === 'serve' ? 1 + 0.25 * Math.abs(((s.serveIn % 40) / 20) - 1) : 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sim.BALL_R * view.scale * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  }

  /* ---- Sound: short tones, no audio files ---- */
  function unlockAudio() {
    if (audio || muted) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audio = new Ctx();
  }

  function beep(freq, seconds) {
    if (muted || !audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  }

  function setMuted(value) {
    muted = value;
    const btn = root && root.querySelector('[data-act="sound"]');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ muted })); } catch (e) {}
    if (!muted) unlockAudio();
  }

  return {
    getHTML, init, destroy, sim,
    pause() { if (mode !== 0 && state && state.phase !== 'over' && !paused) setPaused(true); },
    // For the tests
    get state() { return state; },
    get running() { return !!(loop && loop.running); },
  };
})();

OS.registerApp('pong', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'pong',
      title: 'Pong',
      icon: '🏓',
      width: 760,
      height: 520,
      content: PongApp.getHTML(),
    };
  },

  onOpen(id) { PongApp.init(id); },
  onClose() { PongApp.destroy(); },
  onMinimize() { PongApp.pause(); },
});
