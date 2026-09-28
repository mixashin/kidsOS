/* ===== Breakout: one player, bricks, 5 levels =====
   Two styles, as in Pong:
   classic  the old game: ball, paddle, bricks, nothing else
   plus     trick shots with spin, and power-ups that fall from broken bricks

   The ball physics, the screen, the sound, the effects, the pictures, and the panels are the
   ones of Pong (js/lib/paddle.js). This file keeps the rules of Breakout only. */
// All app files share one scope for a top-level const. The block keeps `t` inside this file.
// `var` puts BreakoutApp into the shared scope: the tests and the test pages read it.
{
const t = OS.texts('breakout');

var BreakoutApp = (() => {
  const STORE_KEY = 'kidsOS_breakout';

  // All text in one place. Each entry gets its text from the language layer.
  const T = {
    title: t('Breakout'),
    classic: t('Classic'),
    plus: t('Breakout+'),
    play: t('Play'),
    playAgain: t('Play again'),
    menu: t('Menu'),
    resume: t('Play'),
    paused: t('Pause'),
    sound: t('Sound'),
    won: t('You win!'),
    lost: t('Game over'),
    level: n => t('Level {n}', { n }),
    score: n => t('Score: {n}', { n }),
    best: n => t('Best: {n}', { n }),
    // Lines in the list of the bank
    coinsWin: t('Breakout: cleared all bricks!'),
    coinsScore: n => t('Breakout: scored {n}', { n }),
  };

  /* ---- Simulation ----
     Pure and deterministic, as the simulation of Pong: the same seed and the same inputs give
     the same game. The court has the axes of Pong: x is the forward direction, y goes across.
     The paddle defends x = 0, the bricks stand near the far end x = W, which is a wall.
     The screen always shows the court turned, so the paddle is at the bottom.
     Speeds are in units per step. One step is 1/120 s. */
  const sim = (() => {
    const P = Paddle.physics;
    const W = 1000, H = 800;
    const HZ = 120;
    const BALL_R = 14;
    const PADDLE_X = 50;
    const PADDLE_HALF = 75;
    const PADDLE_THICK = 22;
    const PADDLE_SPEED = 1500 / HZ;
    const SPEED_START = 430 / HZ;
    const SPEED_UP = 1.015;         // at each paddle hit, up to 2 times the start speed of the level
    const LEVEL_UP = 0.1;           // each level starts 10 percent faster
    const MIN_FORWARD = 0.3;        // part of the speed that stays forward after a wall or a brick
    const SERVE_STEPS = HZ;         // the ball waits on the paddle for 1 second
    const CLEAR_STEPS = HZ;         // pause after the last brick of a level
    const LIVES = 3;
    // Same values as Pong+
    const K = { SPIN_SLOW: 0.55, SPIN_CURVE: 0.012, KICK: 1.7, KICK_SLOPE: 0.3, FIRE: 1.5, GUARD: 4800 / HZ, SLICE_MIN: 8, PADDLE_SPEED };
    const SUB_STEP = 10;            // a fast ball moves in parts of this length, so it cannot jump over a brick

    // Bricks: 8 across, 5 rows. Row 0 is the far row. The rows stand in front of a free band at the far end.
    const COLS = 8, ROWS = 5, GAP = 8, DEPTH = 32;
    const ACROSS = (H - (COLS + 1) * GAP) / COLS;
    const FAR = W - 120;
    const LEVELS = [
      ['11111111', '11111111', '11111111', '11111111', '11111111'], // full wall
      ['00011000', '00111100', '01111110', '11111111', '11111111'], // pyramid
      ['10101010', '01010101', '10101010', '01010101', '10101010'], // checker board
      ['01100110', '11111111', '01111110', '00111100', '00011000'], // heart
      ['11111111', '00000000', '11111111', '00000000', '11111111'], // stripes
    ];

    // Power-ups (Breakout+). A broken brick drops one with a chance of 1 in 8.
    //   fire   held: the next shot goes through bricks, 1.5 times faster
    //   zap    held: the next brick breaks with each brick next to it
    //   split  at once: each ball becomes two
    //   wall   at once: a row of bricks behind the paddle saves missed balls
    //   wide   at once: a longer paddle.  short: a shorter paddle (a debuff)
    const DROP_CHANCE = 1 / 8;
    const DROPS = [['fire', 2], ['zap', 2], ['split', 2], ['wall', 2], ['wide', 2], ['short', 1]];
    const DROP_WEIGHT = DROPS.reduce((n, d) => n + d[1], 0);
    const DROP_MAX = 2;
    const DROP_SPEED = 360 / HZ;
    const ITEM_R = 32;
    const BALL_MAX = 8;
    const WALL_LIFE = 20 * HZ;
    const SIZE = { wide: [1.5, 15 * HZ], short: [0.6, 10 * HZ] };

    const random = P.random;
    const say = (state, name, b, extra) => state.events.push(b ? [name, b.x, b.y, extra] : [name]);

    function newBall(state, values) {
      return {
        id: ++state.ballId, x: PADDLE_X + PADDLE_THICK / 2 + BALL_R, y: state.paddle, vx: 0, vy: 0, speed: state.base,
        spin: 0, kick: false, fire: false, zap: false,
        ...values,
      };
    }

    function layout(level) {
      const bricks = [];
      LEVELS[level - 1].forEach((line, row) => {
        for (let col = 0; col < COLS; col++) {
          if (line[col] !== '1') continue;
          const x1 = FAR - row * (DEPTH + GAP), y0 = GAP + col * (ACROSS + GAP);
          bricks.push({ x0: x1 - DEPTH, y0, x1, y1: y0 + ACROSS, row, col });
        }
      });
      return bricks;
    }

    // Row of bricks behind the paddle (power-up Wall)
    function floorRow() {
      const bricks = [];
      for (let col = 0; col < COLS; col++) {
        const y0 = GAP + col * (ACROSS + GAP);
        bricks.push({ x0: 6, y0, x1: 24, y1: y0 + ACROSS, row: 4, col });
      }
      return bricks;
    }

    function create(seed, style = 'classic', level = 1) {
      const base = SPEED_START * (1 + LEVEL_UP * (level - 1));
      const state = {
        seed: seed | 0, tick: 0, style,
        phase: 'serve',           // 'serve' | 'play' | 'clear' | 'over'
        level, lives: LIVES, score: 0, won: false,
        base, max: base * 2,
        serveIn: SERVE_STEPS, clearIn: 0,
        balls: [], ballId: 0,
        paddle: H / 2, vel: 0,    // center of the paddle and its smoothed speed
        half: PADDLE_HALF,        // half of the paddle length: Wide and Short change it
        size: null,               // { kind, until } of Wide or Short
        held: null,               // 'fire' or 'zap' that the paddle holds for the next hit
        bricks: layout(level),
        floor: [], floorUntil: 0, // row behind the paddle (power-up Wall)
        drops: [],                // falling power-ups: [{ type, x, y }]
        dropChance: style === 'plus' ? DROP_CHANCE : 0,
        events: [],               // what happened in the last step, for sound and effects: [name, x, y, extra]
      };
      state.balls = [newBall(state)];
      return state;
    }

    const speedOf = b => P.speedOf(b, K);
    const aim = (b, dx, dy) => P.aim(b, dx, dy, K);

    // A ball keeps a part of its speed forward, so it cannot move across the court for a long time
    function keepForward(b) {
      const v = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const min = v * MIN_FORWARD;
      if ((b.vx < 0 ? -b.vx : b.vx) >= min) return;
      const vy = Math.sqrt(v * v - min * min);
      b.vx = b.vx < 0 ? -min : min;
      b.vy = b.vy < 0 ? -vy : vy;
    }

    function dropType(state) {
      let n = random(state) * DROP_WEIGHT;
      for (const [type, weight] of DROPS) { if (n < weight) return type; n -= weight; }
      return DROPS[0][0];
    }

    function breakBrick(state, k) {
      state.bricks.splice(state.bricks.indexOf(k), 1);
      state.score += 10;
      state.events.push(['brick', (k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, k.row]);
      if (state.style === 'plus' && state.drops.length < DROP_MAX && random(state) < state.dropChance) {
        state.drops.push({ type: dropType(state), x: (k.x0 + k.x1) / 2, y: (k.y0 + k.y1) / 2 });
        say(state, 'item');
      }
    }

    function hit(state, b, yHit, face) {
      b.speed = Math.min(state.max, b.speed * SPEED_UP);
      b.spin = 0; b.kick = false; b.fire = false; b.zap = false; // effects of the last shot end here
      b.x = face + BALL_R;
      let slope = P.slope(yHit, state.paddle, state.half, BALL_R);
      b.y = Math.max(BALL_R, Math.min(H - BALL_R, yHit));
      if (state.style === 'plus') {
        if (state.held === 'fire') { b.fire = true; say(state, 'fire', b); }
        if (state.held === 'zap') { b.zap = true; say(state, 'zap', b); }
        state.held = null;
        const spin = P.slice(state.vel, K);
        if (spin !== 0) {
          b.spin = spin;
          slope += spin * 0.35;
          say(state, 'spin', b);
        }
      }
      aim(b, 1, slope);
      say(state, 'hit', b);
    }

    function catchDrop(state, d) {
      say(state, 'pickup', d);
      if (d.type === 'fire' || d.type === 'zap') state.held = d.type;
      else if (d.type === 'split') {
        // The new ball is the mirror of the old ball across the court. It moves from the next step on.
        for (const b of state.balls.slice()) {
          if (state.balls.length >= BALL_MAX) break;
          state.balls.push(newBall(state, { ...b, id: state.ballId + 1, vy: -b.vy, spin: -b.spin }));
        }
        say(state, 'split', d);
      } else if (d.type === 'wall') {
        state.floor = floorRow();
        state.floorUntil = state.tick + WALL_LIFE;
        say(state, 'wallup');
      } else {
        const [factor, life] = SIZE[d.type];
        state.size = { kind: d.type, until: state.tick + life };
        state.half = PADDLE_HALF * factor;
        say(state, d.type, d);
      }
    }

    // All effects end: after a lost life and at a new level
    function calm(state) {
      state.held = null;
      state.size = null;
      state.half = PADDLE_HALF;
      state.floor = [];
      state.drops = [];
    }

    // Moves one ball by one step. Returns true when the ball left the court behind the paddle.
    function move(state, b) {
      if (state.style === 'plus' && b.spin !== 0) P.bend(b, K);
      const parts = P.parts(b, SUB_STEP);
      for (let part = 0; part < parts; part++) {
        const px = b.x, py = b.y;
        b.x += b.vx / parts;
        b.y += b.vy / parts;

        // Side walls (with the kick of a ball with spin) and the far wall
        let wall = P.sideWalls(b, H, BALL_R, K);
        if (b.x > W - BALL_R) { b.x = 2 * (W - BALL_R) - b.x; b.vx = -b.vx; wall = wall || 'wall'; }
        if (wall) {
          if (wall !== 'kick') keepForward(b);
          say(state, wall, b);
        }

        if (b.vx < 0) {
          const m = P.meet(b, px, py, 0, PADDLE_X, PADDLE_THICK, BALL_R);
          const reach = state.half + BALL_R;
          if (m && m.y >= state.paddle - reach && m.y <= state.paddle + reach) hit(state, b, m.y, m.face);
        }

        const n = P.touch(state.bricks, b, BALL_R);
        if (n >= 0) {
          const k = state.bricks[n];
          if (b.fire) breakBrick(state, k); // a fireball goes through
          else {
            P.bounce(b, k, px, py);
            keepForward(b);
            if (b.zap) {
              // Lightning: the bricks next to this one break too
              b.zap = false;
              say(state, 'blast', b);
              for (const o of state.bricks.filter(o => o !== k && Math.abs(o.row - k.row) <= 1 && Math.abs(o.col - k.col) <= 1)) breakBrick(state, o);
            }
            breakBrick(state, k);
          }
          if (state.bricks.length === 0) return false;
        }

        const f = P.touch(state.floor, b, BALL_R);
        if (f >= 0) {
          const k = state.floor[f];
          P.bounce(b, k, px, py);
          state.floor.splice(f, 1);
          state.events.push(['brick', (k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, k.row]);
        }

        if (b.x < -BALL_R) return true;
      }
      return false;
    }

    // target: y of the place where the child wants the paddle, or null
    function step(state, target) {
      state.events.length = 0;
      state.tick++;
      if (state.phase === 'over') return state;

      let moved = 0;
      if (target !== null && target !== undefined) {
        const want = Math.max(state.half, Math.min(H - state.half, Math.round(target)));
        moved = Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, want - state.paddle));
        state.paddle += moved;
      }
      // A longer paddle does not go into a wall
      state.paddle = Math.max(state.half, Math.min(H - state.half, state.paddle));
      state.vel = state.vel * 0.6 + moved * 0.4;

      if (state.phase === 'clear') {
        if (--state.clearIn <= 0) {
          state.level++;
          state.base = SPEED_START * (1 + LEVEL_UP * (state.level - 1));
          state.max = state.base * 2;
          state.bricks = layout(state.level);
          serveNew(state);
        }
        return state;
      }

      if (state.phase === 'serve') {
        const b = state.balls[0];
        b.y = state.paddle;
        if (--state.serveIn <= 0) {
          aim(b, 1, (random(state) - 0.5) * 0.8);
          state.phase = 'play';
          say(state, 'serve', b);
        }
        return state;
      }

      // Timers of the effects
      if (state.size && state.tick >= state.size.until) { state.size = null; state.half = PADDLE_HALF; }
      if (state.floor.length && state.tick >= state.floorUntil) { state.floor = []; say(state, 'walldown'); }

      // Falling power-ups. The paddle catches a power-up that meets it.
      for (const d of state.drops.slice()) {
        d.x -= DROP_SPEED;
        const near = d.x - ITEM_R <= PADDLE_X + PADDLE_THICK / 2 && d.x + ITEM_R >= PADDLE_X - PADDLE_THICK / 2;
        if (near && d.y >= state.paddle - state.half - ITEM_R && d.y <= state.paddle + state.half + ITEM_R) {
          state.drops.splice(state.drops.indexOf(d), 1);
          catchDrop(state, d);
        } else if (d.x < -ITEM_R) state.drops.splice(state.drops.indexOf(d), 1);
      }

      // A split adds balls in this loop. The new balls move from the next step on.
      // The level ends in the step that breaks its last brick.
      const had = state.bricks.length;
      const count = state.balls.length;
      for (let n = 0; n < count; n++) {
        const b = state.balls[n];
        if (move(state, b)) b.out = true;
        if (had && state.bricks.length === 0) break;
      }
      state.balls = state.balls.filter(b => !b.out);

      if (had && state.bricks.length === 0) {
        state.balls = [];
        calm(state);
        if (state.level >= LEVELS.length) {
          state.phase = 'over';
          state.won = true;
          say(state, 'over');
        } else {
          state.phase = 'clear';
          state.clearIn = CLEAR_STEPS;
          say(state, 'level');
        }
      } else if (state.balls.length === 0) {
        state.lives--;
        calm(state);
        say(state, 'lose');
        if (state.lives <= 0) {
          state.phase = 'over';
          say(state, 'over');
        } else serveNew(state);
      }
      return state;
    }

    function serveNew(state) {
      state.phase = 'serve';
      state.serveIn = SERVE_STEPS;
      state.balls = [newBall(state)];
    }

    // The numbers of a state, for the checks of the tests
    function values(s) {
      return [
        s.tick, s.seed, s.level, s.lives, s.score, s.paddle, s.half, s.bricks.length, s.floor.length, s.drops.length,
        s.balls.length, ...s.balls.flatMap(b => [b.id, b.x, b.y, b.vx, b.vy, b.speed, b.spin]),
      ];
    }

    return {
      W, H, HZ, BALL_R, PADDLE_X, PADDLE_HALF, PADDLE_THICK, PADDLE_SPEED, ITEM_R, LEVELS, LIVES, SPEED_START, K,
      create, step, newBall, values, dropType, speedOf,
    };
  })();

  /* ---- App ---- */
  const COLOR = '#4fc3f7';
  const POWER = Paddle.POWER;
  let root = null, kit = null, canvas = null, ctx = null, view = null;
  let loop = null, observer = null, controller = null;
  let state = null;
  let before = null;       // positions one step back, for smooth drawing between two steps
  let style = 'plus';      // 'classic' | 'plus'
  let paused = false;
  let muted = false;
  let best = 0;
  let target = null;       // place across the court where the child wants the paddle
  let key = 0, held = 0;   // key direction: -1, 0, 1, and the steps it is down
  const fingers = new Set();

  const getHTML = () => Paddle.html(T, ' pg-breakout');

  // The old Breakout stored the best score as a plain number
  function loadStore() {
    muted = false; style = 'plus'; best = 0;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (typeof saved === 'number') best = saved;
      else if (saved && typeof saved === 'object') {
        muted = !!saved.muted;
        style = saved.style === 'classic' ? 'classic' : 'plus';
        best = saved.best;
      }
    } catch (e) { /* a broken value: start new */ }
    best = Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  }

  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ muted, style, best })); } catch (e) {}
  }

  function init(winId) {
    root = document.getElementById('win-body-' + winId).querySelector('.pg-wrap');
    kit = Paddle.kit(root, sim.W, sim.H, 'always');
    ({ canvas, ctx, view } = kit);
    Paddle.loadPictures();
    loadStore();

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
    if (kit) kit.destroy();
    fingers.clear();
    root = kit = canvas = ctx = view = loop = observer = controller = state = before = null;
    paused = false;
  }

  function resize() {
    if (!kit || !kit.fit()) return;
    if (!loop || !loop.running) render(1);
  }

  /* ---- Input ----
     A finger anywhere on the court moves the paddle to its place. A mouse moves it with no press. */
  function onPointerDown(e) {
    if (!state) return;
    fingers.add(e.pointerId);
    target = kit.court(e).y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer is gone already */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!state) return;
    if (fingers.has(e.pointerId) || e.pointerType === 'mouse') target = kit.court(e).y;
  }

  function onPointerUp(e) {
    fingers.delete(e.pointerId);
  }

  // Physical keys, so the letters work on each keyboard layout. On the screen, left is a lower y.
  const KEYS = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };

  function onKey(e, down) {
    const win = root && root.closest('.window');
    if (!win || !win.classList.contains('focused') || win.classList.contains('minimized')) return;
    if (down && e.code === 'Space' && state) { e.preventDefault(); if (canPause() || paused) setPaused(!paused); return; }
    const dir = KEYS[e.code];
    if (!dir || !state) return;
    e.preventDefault();
    if (down) {
      if (key !== dir) held = 0;
      key = dir;
      target = null;
    } else if (key === dir) { key = 0; held = 0; }
  }

  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    kit.sound.unlock();
    const act = btn.dataset.act;
    if (act === 'play' || act === 'again') start();
    else if (act === 'menu') showMenu();
    else if (act === 'pause') { if (canPause()) setPaused(true); }
    else if (act === 'resume') setPaused(false);
    else if (act === 'sound') setMuted(!muted);
    else if (act === 'classic' || act === 'plus') { style = act; saveStore(); showMenu(); }
  }

  /* ---- Game flow ---- */
  const newSeed = () => (Date.now() ^ (Math.random() * 0x7fffffff)) | 0;
  const canPause = () => !!state && state.phase !== 'over' && !paused;

  function start() {
    state = sim.create(newSeed(), style);
    before = snapshot();
    target = null; key = 0; held = 0;
    fingers.clear();
    kit.clear();
    paused = false;
    kit.hide();
    root.classList.add('pg-playing');
    root.classList.toggle('pg-classic', style === 'classic');
    loop.start();
  }

  function showMenu() {
    if (loop) loop.stop();
    state = null;
    paused = false;
    kit.clear();
    root.classList.remove('pg-playing');
    root.classList.toggle('pg-classic', style === 'classic');
    kit.show(`
      <div class="pg-panel pg-wide">
        <div class="pg-title">🧱 ${T.title}</div>
        <div class="pg-picks">${Paddle.pick('classic', style === 'classic', '🕹️', T.classic)}${Paddle.pick('plus', style === 'plus', '🔥', T.plus)}</div>
        ${Paddle.button('play', '▶', T.play, COLOR)}
        ${best ? `<div class="pg-note">${T.best(best)}</div>` : ''}
      </div>`);
    setMuted(muted);
    render(1);
  }

  function setPaused(value) {
    if (!state) return;
    paused = value;
    if (paused) {
      loop.stop();
      kit.pausePanel('⏸', T, COLOR);
    } else {
      kit.hide();
      loop.start();
    }
  }

  function gameOver() {
    loop.stop();
    render(1);
    const score = state.score;
    if (score > best) { best = score; saveStore(); }
    kit.endPanel(state.won ? '🏆' : '🎈', state.won ? T.won : T.lost, COLOR, `${T.score(score)}<div class="pg-note">${T.best(best)}</div>`, T);
    root.classList.remove('pg-playing');
    if (score > 0) OS.awardCoins(Math.max(1, Math.floor(score / 10)), 'breakout', '🧱', state.won ? T.coinsWin : T.coinsScore(score));
  }

  function snapshot() {
    return { paddle: state.paddle, balls: new Map(state.balls.map(b => [b.id, [b.x, b.y]])) };
  }

  function step() {
    before = snapshot();
    let want = target;
    if (key !== 0) { held++; want = Paddle.keyTarget(state.paddle, key, held, sim.PADDLE_SPEED); }
    sim.step(state, want);
    for (const ev of state.events) {
      if (ev[0] === 'over') gameOver();
      else kit.effect(ev);
    }
  }

  /* ---- Drawing ---- */
  function render(alpha) {
    if (!ctx) return;
    const classic = style === 'classic';
    const s = state;
    const mix = (a, b) => a + (b - a) * alpha;
    const blink = until => until - s.tick < 2 * sim.HZ && Math.floor(s.tick / 12) % 2 === 0;

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = classic ? '#000' : '#0d1b33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (classic) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, 4 * view.scale);
      ctx.strokeRect(view.left, view.top, view.width, view.height);
    } else {
      ctx.fillStyle = '#12284a';
      ctx.beginPath();
      ctx.roundRect(view.left, view.top, view.width, view.height, 18 * view.scale);
      ctx.fill();
    }
    if (!s) return;

    // Band at the far end: lives at one side, level at the other
    const bandX = sim.W - 60;
    for (let n = 0; n < sim.LIVES; n++) {
      const [sx, sy] = kit.at(bandX, 40 + n * 44);
      const r = 14 * view.scale;
      ctx.globalAlpha = n < s.lives ? 1 : 0.2;
      ctx.fillStyle = '#fff';
      if (classic) ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      else kit.body(sx, sy, r);
    }
    ctx.globalAlpha = 1;
    if (classic) {
      // Score in blocks, digit by digit, from the right
      ctx.fillStyle = '#fff';
      String(s.score).split('').reverse().forEach((d, n) => kit.blockNumber(+d, bandX, sim.H - 40 - n * 56, 9));
    } else {
      const [sx, sy] = kit.at(bandX, sim.H - 30);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${36 * view.scale}px Nunito, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(T.level(s.level), sx, sy);
      // Score: a large number in the court, as in Pong+
      const [cx, cy] = kit.at(sim.W * 0.4, sim.H / 2);
      ctx.textAlign = 'center';
      ctx.font = `700 ${150 * view.scale}px system-ui, sans-serif`;
      ctx.fillStyle = COLOR + '30';
      ctx.fillText(String(s.score), cx, cy);
    }

    for (const k of s.bricks) kit.brick(k, k.row, classic);
    if (s.floor.length && !blink(s.floorUntil)) for (const k of s.floor) kit.brick(k, k.row, classic);
    for (const d of s.drops) kit.item(d.type, d.x, d.y, sim.ITEM_R, s.tick);

    // Paddle. A held power-up gives it the color and the mark of that power-up.
    const y = before ? mix(before.paddle, s.paddle) : s.paddle;
    const sizeEnds = s.size && blink(s.size.until);
    ctx.shadowColor = s.held ? POWER[s.held].color : s.size ? POWER[s.size.kind].color : '#000';
    ctx.shadowBlur = !classic && (s.held || (s.size && !sizeEnds)) ? 26 * view.scale : 0;
    ctx.fillStyle = classic ? '#fff' : s.held ? POWER[s.held].color : COLOR;
    kit.rect(sim.PADDLE_X, y, sim.PADDLE_THICK / 2, s.half, classic ? 0 : 10);
    ctx.shadowBlur = 0;
    if (s.held) {
      const [sx, sy] = kit.at(sim.PADDLE_X - 30, y);
      kit.icon(s.held, sx, sy, 22 * view.scale);
    }

    kit.drawSparks();
    if (s.phase === 'over' || s.phase === 'clear') { kit.frame([]); return; }

    if (s.phase === 'serve') {
      // The ball pulses on the paddle before it goes
      const b = s.balls[0];
      const [sx, sy] = kit.at(b.x, y);
      const r = sim.BALL_R * view.scale * (1 + 0.25 * Math.abs(((s.serveIn % 40) / 20) - 1));
      ctx.fillStyle = '#fff';
      if (classic) ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      else kit.body(sx, sy, r);
      kit.frame([]);
      return;
    }

    kit.frame(s.balls);
    for (const b of s.balls) {
      const old = before && before.balls.get(b.id);
      const x = old ? mix(old[0], b.x) : b.x, by = old ? mix(old[1], b.y) : b.y;
      if (classic) {
        const [sx, sy] = kit.at(x, by);
        const r = sim.BALL_R * view.scale;
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      } else kit.ball(b, x, by, sim.BALL_R);
    }
  }

  function setMuted(value) {
    muted = value;
    kit.setMuted(value);
    saveStore();
  }

  return {
    getHTML, init, destroy, sim,
    pause() { if (canPause()) setPaused(true); },
    // For the tests
    get state() { return state; },
    get running() { return !!(loop && loop.running); },
    get style() { return style; },
    get best() { return best; },
    get paused() { return paused; },
  };
})();

OS.registerApp('breakout', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'breakout',
      title: t('Breakout'),
      icon: '🧱',
      stage: false, // Breakout fits its court to the window
      width: 520,
      height: 640,
      content: BreakoutApp.getHTML(),
    };
  },

  onOpen(id) { BreakoutApp.init(id); },
  onClose() { BreakoutApp.destroy(); },
  // Home button: the game waits in the dock
  onMinimize() { BreakoutApp.pause(); },
});
}
