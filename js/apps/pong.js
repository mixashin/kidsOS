/* ===== Pong — one or two players on one device, or two players on two devices =====
   Two styles:
   classic  the old game: ball, two paddles, nothing else
   plus     trick shots with spin, and power-ups on the court

   Two devices: see connect(). Each device runs the same simulation with the same inputs
   (js/lib/lockstep.js). The connection is direct, with no server (js/lib/pairing.js). */
const PongApp = (() => {
  const STORE_KEY = 'kidsOS_pong';

  // All text in one place, ready for translation
  const T = {
    title: 'Pong',
    classic: 'Classic',
    plus: 'Pong+',
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
    twoDevices: '2 Devices',
    howTo: 'One tablet shows the code. The other tablet scans it.',
    showCode: 'Show code',
    scanCode: 'Scan code',
    scanMe: 'Scan this code with the other tablet',
    next: 'Next',
    scanOther: 'Point the camera at the code of the other tablet',
    nowOther: 'Now the other tablet scans this code',
    otherCamera: 'Camera',
    wrongCode: 'That is another code',
    linking: 'Connecting',
    tryAgain: 'Try again',
    failed: 'That did not work',
    noCamera: 'The camera is needed to scan the code',
    noReader: 'This device cannot scan codes',
    noNetwork: 'No Wi-Fi network',
    connected: 'Connected!',
    youWin: 'You win!',
    youLose: 'The other player wins',
    otherPaused: 'The other player takes a break',
    waiting: 'Wait for the other player',
    lost: 'The other player is gone',
    apart: 'Oops, the game got mixed up',
  };

  /* ---- Simulation ----
     Pure and deterministic: the same seed and the same inputs give the same game on every
     device. It uses + - * / and Math.sqrt only, no sin or cos. Network play needs this.
     The court is 1000 x 600 units. Player 0 defends x = 0, player 1 defends x = 1000.
     The screen can show it turned (see toScreen), the simulation does not know.
     Speeds are in units per step. One step is 1/120 s. */
  const sim = (() => {
    const W = 1000, H = 600;
    const HZ = 120;
    const BALL_R = 14;
    const PADDLE_X = [50, W - 50];
    const PADDLE_HALF = 75;         // half of the paddle length: large on purpose
    const PADDLE_THICK = 22;
    const PADDLE_SPEED = 1500 / HZ;
    const SPEED_START = 430 / HZ;
    const SPEED_UP = 1.05;          // at each paddle hit. No limit: each rally gets faster until a player misses
    const SPEED_GUARD = 4800 / HZ;  // guard for the numbers only. The ball crosses the court in 0.2 s at this speed
    const SERVE_STEPS = HZ;         // one second before each serve
    const WIN_SCORE = 5;

    // Pong+ trick shot: a paddle that moves fast at the hit gives the ball spin
    const SLICE_MIN = 8;            // paddle speed where a hit starts to count as a slice (960 units per second)
    const SPIN_SLOW = 0.55;         // a ball with spin moves slowly
    const SPIN_CURVE = 0.012;       // and bends toward the wall
    const KICK = 1.7;               // at the wall, spin changes into forward speed
    const KICK_SLOPE = 0.3;         // after the kick the ball goes nearly straight forward

    // Pong+ power-ups. The player who hit the ball last gets it, and uses it at the next hit.
    //   fire   fireball: the shot is faster
    //   zap    lightning: the paddle that returns this shot cannot move for a moment
    // Two power-ups act at once, for both players:
    //   split  the ball becomes two balls, one goes to each player
    //   wall   a wall of bricks comes up in the middle. A ball that hits a brick removes it.
    const ITEMS = ['fire', 'zap', 'split', 'wall'];
    const FIRE = 1.5;
    const STUN_STEPS = Math.round(1.2 * HZ);
    const WALL_COLS = 3, WALL_ROWS = 5;
    const BRICK_W = 36, BRICK_GAP = 4;
    const WALL_LIFE = 20 * HZ;      // bricks that are left go away, so the game cannot get stuck
    const SUB_STEP = 10;            // a fast ball moves in parts of this length, so it cannot jump over a brick
    const ITEM_R = 38;
    const ITEM_LIFE = 10 * HZ;      // a power-up that nobody takes goes away
    const ITEM_WAIT = [8 * HZ, 8 * HZ]; // a power-up appears after 8 to 16 s of play: [minimum, random part]

    // mulberry32: small seeded random number generator
    function random(state) {
      state.seed = (state.seed + 0x6D2B79F5) | 0;
      let t = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function newBall(state, values) {
      return {
        id: ++state.ballId, x: W / 2, y: H / 2, vx: 0, vy: 0, speed: SPEED_START,
        spin: 0, kick: false, fire: false, zap: false,
        owner: -1,                // player who hit this ball last, -1 after a serve
        ...values,
      };
    }

    function create(seed, style = 'classic') {
      const state = {
        seed: seed | 0, tick: 0, style,
        phase: 'serve',           // 'serve' | 'play' | 'over'
        rally: 0,                 // paddle hits since the last serve
        serveIn: SERVE_STEPS, serveTo: 0,
        balls: [], ballId: 0,
        paddles: [H / 2, H / 2],  // center of each paddle
        vel: [0, 0],              // speed of each paddle, smoothed
        stun: [0, 0],             // steps each paddle cannot move
        score: [0, 0], winner: -1,
        bricks: [],               // wall in the middle: [{ x0, y0, x1, y1, row }]
        wallUntil: 0,
        item: null,               // power-up on the court: { type, x, y, until }
        nextItem: 0,              // steps of play until the next power-up
        power: [null, null],      // power-up each player holds for the next hit
        events: [],               // what happened in the last step, for sound and effects: [name, x, y]
      };
      state.serveTo = random(state) < 0.5 ? 0 : 1;
      state.nextItem = ITEM_WAIT[0] + Math.floor(ITEM_WAIT[1] * random(state));
      return state;
    }

    // Speed of a ball with all effects
    function speedOf(b) {
      const v = b.speed * (b.spin !== 0 ? SPIN_SLOW : 1) * (b.kick ? KICK : 1) * (b.fire ? FIRE : 1);
      return Math.min(SPEED_GUARD, v);
    }

    function aim(b, dx, dy) {
      const v = speedOf(b) / Math.sqrt(dx * dx + dy * dy);
      b.vx = dx * v;
      b.vy = dy * v;
    }

    const say = (state, name, b) => state.events.push(b ? [name, b.x, b.y] : [name]);

    function serve(state) {
      const b = newBall(state);
      const slope = (random(state) - 0.5) * 1.2;      // -0.6 to 0.6
      aim(b, state.serveTo === 0 ? -1 : 1, slope);
      state.balls = [b];
      state.phase = 'play';
      state.rally = 0;
      say(state, 'serve', b);
    }

    function placeItem(state) {
      state.item = {
        type: ITEMS[Math.floor(random(state) * ITEMS.length)],
        x: Math.round(W * (0.3 + 0.4 * random(state))),
        y: Math.round(90 + (H - 180) * random(state)),
        until: state.tick + ITEM_LIFE,
      };
      say(state, 'item', state.item);
    }

    function nextItemIn(state) {
      state.item = null;
      state.nextItem = ITEM_WAIT[0] + Math.floor(ITEM_WAIT[1] * random(state));
    }

    function raiseWall(state) {
      const width = WALL_COLS * BRICK_W + (WALL_COLS - 1) * BRICK_GAP;
      const height = H / WALL_ROWS;
      const keepOut = BALL_R + 8;
      state.bricks = [];
      for (let col = 0; col < WALL_COLS; col++) {
        for (let row = 0; row < WALL_ROWS; row++) {
          const x0 = (W - width) / 2 + col * (BRICK_W + BRICK_GAP);
          const brick = { x0, y0: row * height + BRICK_GAP / 2, x1: x0 + BRICK_W, y1: (row + 1) * height - BRICK_GAP / 2, row };
          // No brick on top of a ball: the ball must not be shut in
          const free = state.balls.every(b => b.x < brick.x0 - keepOut || b.x > brick.x1 + keepOut || b.y < brick.y0 - keepOut || b.y > brick.y1 + keepOut);
          if (free) state.bricks.push(brick);
        }
      }
      state.wallUntil = state.tick + WALL_LIFE;
      say(state, 'wallup');
    }

    // Returns true when the ball met a brick. The brick goes away and the ball turns back.
    function hitBrick(state, b, px, py) {
      for (let n = 0; n < state.bricks.length; n++) {
        const k = state.bricks[n];
        const nx = b.x < k.x0 ? k.x0 : b.x > k.x1 ? k.x1 : b.x;
        const ny = b.y < k.y0 ? k.y0 : b.y > k.y1 ? k.y1 : b.y;
        const dx = b.x - nx, dy = b.y - ny;
        if (dx * dx + dy * dy > BALL_R * BALL_R) continue;
        // The ball came from the side where it was one part of a step before
        const fromSide = px < k.x0 || px > k.x1;
        const fromEnd = py < k.y0 || py > k.y1;
        if (fromSide || !fromEnd) b.vx = px < (k.x0 + k.x1) / 2 ? (b.vx < 0 ? b.vx : -b.vx) : (b.vx > 0 ? b.vx : -b.vx);
        else b.vy = py < (k.y0 + k.y1) / 2 ? (b.vy < 0 ? b.vy : -b.vy) : (b.vy > 0 ? b.vy : -b.vy);
        b.x = px; b.y = py;
        state.events.push(['brick', (k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, k.row]);
        state.bricks.splice(n, 1);
        return true;
      }
      return false;
    }

    function hit(state, b, i, yHit, face) {
      const offset = (yHit - state.paddles[i]) / (PADDLE_HALF + BALL_R);
      // Lightning ball of the other player: this paddle returns it, then it cannot move
      if (b.zap && b.owner !== i) {
        state.stun[i] = STUN_STEPS;
        state.vel[i] = 0;
        say(state, 'stun', b);
      }
      b.speed = Math.min(SPEED_GUARD, b.speed * SPEED_UP);
      b.spin = 0; b.kick = false; b.fire = false; b.zap = false; // effects of the last shot end here
      b.owner = i;
      b.x = face + (i === 0 ? BALL_R : -BALL_R);
      b.y = Math.max(BALL_R, Math.min(H - BALL_R, yHit));
      let slope = offset * 0.9;                     // where the ball meets the paddle sets the direction
      if (state.style === 'plus') {
        const power = state.power[i];
        state.power[i] = null;
        if (power === 'fire') { b.fire = true; say(state, 'fire', b); }
        if (power === 'zap') { b.zap = true; say(state, 'zap', b); }
        const v = state.stun[i] > 0 ? 0 : state.vel[i];
        const fast = v < 0 ? -v : v;
        if (fast >= SLICE_MIN) {
          const amount = Math.min(1, 0.5 + 0.5 * (fast - SLICE_MIN) / (PADDLE_SPEED - SLICE_MIN));
          b.spin = v < 0 ? -amount : amount;
          slope += b.spin * 0.35;
          say(state, 'spin', b);
        }
      }
      aim(b, i === 0 ? 1 : -1, slope);
      state.rally++;
      say(state, 'hit', b);
    }

    // Moves one ball by one step. Returns the player who scores with it, or -1.
    function move(state, b) {
      const plus = state.style === 'plus';
      if (plus && b.spin !== 0) {
        // The ball bends toward the wall, at the same speed. It keeps a part of its forward motion.
        const v = speedOf(b);
        let vy = b.vy + b.spin * SPIN_CURVE * v;
        const limit = v * 0.92;
        if (vy > limit) vy = limit; else if (vy < -limit) vy = -limit;
        const vx = Math.sqrt(v * v - vy * vy);
        b.vx = b.vx < 0 ? -vx : vx;
        b.vy = vy;
      }

      const fastest = Math.max(b.vx < 0 ? -b.vx : b.vx, b.vy < 0 ? -b.vy : b.vy);
      const parts = Math.max(1, Math.ceil(fastest / SUB_STEP));
      for (let part = 0; part < parts; part++) {
        const out = movePart(state, b, parts, plus);
        if (out >= 0) return out;
      }
      return -1;
    }

    function movePart(state, b, parts, plus) {
      const px = b.x, py = b.y;
      b.x += b.vx / parts;
      b.y += b.vy / parts;

      let wall = false;
      if (b.y < BALL_R) { b.y = 2 * BALL_R - b.y; b.vy = -b.vy; wall = true; }
      if (b.y > H - BALL_R) { b.y = 2 * (H - BALL_R) - b.y; b.vy = -b.vy; wall = true; }
      if (wall) {
        if (b.spin !== 0) {
          // The trick: at the wall, spin changes into forward speed
          b.spin = 0;
          b.kick = true;
          aim(b, b.vx < 0 ? -1 : 1, b.vy < 0 ? -KICK_SLOPE : KICK_SLOPE);
          say(state, 'kick', b);
        } else {
          say(state, 'wall', b);
        }
      }

      for (let i = 0; i < 2; i++) {
        const toward = i === 0 ? b.vx < 0 : b.vx > 0;
        if (!toward) continue;
        const face = PADDLE_X[i] + (i === 0 ? PADDLE_THICK / 2 : -PADDLE_THICK / 2);
        const edge = i === 0 ? -BALL_R : BALL_R;      // the side of the ball that meets the paddle
        const before = px + edge - face, after = b.x + edge - face;
        const crossed = i === 0 ? before > 0 && after <= 0 : before < 0 && after >= 0;
        // A paddle that arrives late still returns a ball that is next to it
        const beside = i === 0 ? after <= 0 && b.x >= PADDLE_X[0] - PADDLE_THICK : after >= 0 && b.x <= PADDLE_X[1] + PADDLE_THICK;
        if (!crossed && !beside) continue;
        // A fast ball moves more than one paddle width per step: use the point where its path meets the paddle
        const yHit = crossed ? py + (b.y - py) * (before / (before - after)) : b.y;
        const reach = PADDLE_HALF + BALL_R;
        if (yHit >= state.paddles[i] - reach && yHit <= state.paddles[i] + reach) hit(state, b, i, yHit, face);
      }

      if (plus && state.bricks.length) hitBrick(state, b, px, py);

      if (plus && state.item && b.owner >= 0) {
        const dx = b.x - state.item.x, dy = b.y - state.item.y;
        const reach = BALL_R + ITEM_R;
        if (dx * dx + dy * dy <= reach * reach) {
          const type = state.item.type;
          say(state, 'pickup', state.item);
          nextItemIn(state);
          if (type === 'wall') raiseWall(state);
          else if (type === 'split') {
            // The new ball is the mirror of this ball, so each player gets one. It moves from the next step on.
            state.balls.push(newBall(state, { ...b, id: state.ballId + 1, vx: -b.vx, vy: -b.vy, spin: -b.spin, zap: false, owner: 1 - b.owner }));
            say(state, 'split', b);
          } else state.power[b.owner] = type;
        }
      }

      return b.x < -BALL_R ? 1 : b.x > W + BALL_R ? 0 : -1;
    }

    // targets: [y or null, y or null]. Each paddle moves toward its target at a limited speed.
    function step(state, targets) {
      state.events.length = 0;
      state.tick++;
      if (state.phase === 'over') return state;

      for (let i = 0; i < 2; i++) {
        let moved = 0;
        if (state.stun[i] > 0) {
          if (--state.stun[i] === 0) say(state, 'free');
        } else if (targets[i] !== null && targets[i] !== undefined) {
          const want = Math.max(PADDLE_HALF, Math.min(H - PADDLE_HALF, Math.round(targets[i])));
          const delta = want - state.paddles[i];
          moved = Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, delta));
          state.paddles[i] += moved;
        }
        state.vel[i] = state.vel[i] * 0.6 + moved * 0.4;
      }

      if (state.phase === 'serve') {
        if (--state.serveIn <= 0) serve(state);
        return state;
      }

      if (state.style === 'plus') {
        if (state.bricks.length && state.tick >= state.wallUntil) { state.bricks = []; say(state, 'walldown'); }
        if (state.item && state.tick >= state.item.until) nextItemIn(state);
        if (!state.item && --state.nextItem <= 0) placeItem(state);
      }

      // A split adds a ball in this loop. The new ball moves from the next step on.
      const count = state.balls.length;
      let scorer = -1;
      for (let n = 0; n < count && state.phase !== 'over'; n++) {
        const b = state.balls[n];
        const out = move(state, b);
        if (out < 0) continue;
        b.out = true;
        scorer = out;
        state.score[out]++;
        say(state, 'point', b);
        if (state.score[out] >= WIN_SCORE) {
          state.phase = 'over';
          state.winner = out;
          say(state, 'over');
        }
      }
      if (scorer >= 0) {
        state.balls = state.phase === 'over' ? [] : state.balls.filter(b => !b.out);
        if (state.phase !== 'over' && state.balls.length === 0) {
          state.phase = 'serve';
          state.serveIn = SERVE_STEPS;
          state.serveTo = 1 - scorer; // the player who lost the point gets the ball
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
      // With two balls: the one that arrives first
      let ball = null, best = Infinity;
      for (const b of state.balls) {
        const toward = player === 0 ? b.vx < 0 : b.vx > 0;
        const near = player === 0 ? b.x < W * 0.45 : b.x > W * 0.55;
        if (!toward || !near) continue;
        const time = (PADDLE_X[player] - b.x) / b.vx;
        if (time < best) { best = time; ball = b; }
      }
      const miss = AI_MISS[(state.rally + state.score[0] * 3 + state.score[1]) % AI_MISS.length];
      const want = ball ? ball.y + miss : H / 2;
      const delta = want - state.paddles[player];
      return state.paddles[player] + Math.max(-AI_STEP, Math.min(AI_STEP, delta));
    }

    // The numbers of a state. Two devices compare a check value of them (Lockstep.hash).
    function values(s) {
      return [
        s.tick, s.seed, s.nextItem, s.item ? s.item.x : -1, s.bricks.length,
        s.paddles[0], s.paddles[1], s.stun[0], s.stun[1], s.score[0], s.score[1],
        s.balls.length, ...s.balls.flatMap(b => [b.id, b.x, b.y, b.vx, b.vy, b.speed, b.spin, b.owner]),
      ];
    }

    return {
      W, H, HZ, BALL_R, PADDLE_X, PADDLE_HALF, PADDLE_THICK, PADDLE_SPEED, WIN_SCORE, ITEM_R, ITEMS,
      SPEED_START, SPEED_UP, SLICE_MIN, SPIN_SLOW, KICK, FIRE, STUN_STEPS, ITEM_WAIT, ITEM_LIFE, WALL_LIFE,
      create, step, computerTarget, speedOf, newBall, values,
    };
  })();

  /* ---- App ---- */
  const COLORS = ['#4fc3f7', '#ffb74d'];
  const POWER = {
    fire: { icon: '🔥', color: '#ff7043', glow: 'rgba(255,112,67,' },
    zap: { icon: '⚡', color: '#ffee58', glow: 'rgba(255,238,88,' },
    split: { icon: '', color: '#80deea', glow: 'rgba(128,222,234,' },
    wall: { icon: '🧱', color: '#ff8a65', glow: 'rgba(255,138,101,' },
  };
  const BRICK_COLORS = ['#ff4757', '#ffa502', '#ffd32a', '#2ed573', '#1e90ff'];
  const KEY_SLOW = 5, KEY_GAIN = 0.3; // a held key starts slowly and gets faster: a long press is a slice
  let root = null, canvas = null, ctx = null, overlay = null;
  let loop = null, observer = null, controller = null;
  let state = null;
  let before = null;       // positions one step back, for smooth drawing between two steps
  let mode = 0;            // 1 or 2 players on this device, 3 = two devices, 0 = menu
  let style = 'plus';      // 'classic' | 'plus'
  let paused = false;
  let turned = false;      // true: window is taller than wide, players are at the bottom and at the top
  let flipped = false;     // true: the court is shown mirrored. Two devices: the own paddle is at the left on each.
  // Game on two devices: { link, player, lock, game, live, log, otherPaused, waitShown }
  let net = null;
  // Pairing of two devices, before the game: { role, session, scanner, code, accept, front, timer, hintTimer }
  let pair = null;
  const CHECK_EACH = 60;  // steps between two checks that both devices have the same game
  const WAIT_SHOW = 60;    // ticks with no step before the wait screen shows: 0.5 s
  let view = { scale: 1, ratio: 1, left: 0, top: 0, width: 0, height: 0 };
  const pointers = new Map(); // pointerId -> player
  const targets = [null, null];
  const keys = [0, 0];     // direction per player from the keyboard: -1, 0, 1
  const held = [0, 0];     // steps the key is down
  let muted = false, audio = null;
  // Effects are for the eye only. They are not part of the simulation.
  let trails = new Map(), sparks = [], turn = 0;

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

  function loadStore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      muted = !!saved.muted;
      style = saved.style === 'classic' ? 'classic' : 'plus';
    } catch (e) { muted = false; style = 'plus'; }
  }

  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ muted, style })); } catch (e) {}
  }

  function init(winId) {
    root = document.getElementById('win-body-' + winId).querySelector('.pg-wrap');
    canvas = root.querySelector('.pg-canvas');
    ctx = canvas.getContext('2d');
    overlay = root.querySelector('.pg-overlay');
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
    dropPair();
    dropNet();
    if (loop) loop.stop();
    if (observer) observer.disconnect();
    if (controller) controller.abort();
    if (audio) { audio.close(); audio = null; }
    pointers.clear();
    root = canvas = ctx = overlay = loop = observer = controller = state = before = null;
    trails = new Map(); sparks = [];
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
    trails = new Map();
    if (!loop || !loop.running) render(1);
  }

  // Court units to canvas pixels. Turned: player 0 is at the bottom, player 1 at the top.
  // Flipped: the two players change places on the screen.
  function toScreen(x, y) {
    if (flipped) x = sim.W - x;
    return turned
      ? [view.left + y * view.scale, view.top + (sim.W - x) * view.scale]
      : [view.left + x * view.scale, view.top + y * view.scale];
  }

  // Pointer position to court units. Positions outside the court count too: the whole half is a touch zone.
  function toCourt(e) {
    const box = canvas.getBoundingClientRect();
    const px = (e.clientX - box.left) * view.ratio - view.left;
    const py = (e.clientY - box.top) * view.ratio - view.top;
    const p = turned
      ? { x: sim.W - py / view.scale, y: px / view.scale }
      : { x: px / view.scale, y: py / view.scale };
    if (flipped) p.x = sim.W - p.x;
    return p;
  }

  // The paddle that an input moves, when the place of the input does not select it
  const ownPlayer = () => (mode === 3 ? net.player : 0);

  /* ---- Input ---- */
  function onPointerDown(e) {
    if (!state || mode === 0) return;
    const p = toCourt(e);
    const player = mode === 2 ? (p.x < sim.W / 2 ? 0 : 1) : ownPlayer();
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
    if (down && e.code === 'Space' && canPause()) { e.preventDefault(); setPaused(!paused); return; }
    const key = KEYS[e.code];
    if (!key || mode === 0 || !state) return;
    e.preventDefault();
    const player = mode === 2 ? key[0] : ownPlayer(); // one player on this device: both key sets move the same paddle
    // Turned court: "left" on screen is a lower y in court units, same as "up" when not turned
    if (down) {
      if (keys[player] !== key[1]) held[player] = 0;
      keys[player] = key[1];
    } else if (keys[player] === key[1]) {
      keys[player] = 0;
      held[player] = 0;
    }
  }

  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    unlockAudio();
    const act = btn.dataset.act;
    if (act === 'one') start(1);
    else if (act === 'two') start(2);
    else if (act === 'net') openPairing();
    else if (act === 'host') pairHost();
    else if (act === 'host-scan') pairHostScan();
    else if (act === 'join') pairJoin();
    else if (act === 'flip') { if (pair && pair.scanner) startScanner(pair.accept, !pair.front); }
    else if (act === 'go') requestStart();
    else if (act === 'again') { if (mode === 3) requestStart(); else start(mode); }
    else if (act === 'menu') showMenu();
    else if (act === 'pause') { if (canPause()) setPaused(!paused); }
    else if (act === 'resume') setPaused(false);
    else if (act === 'sound') setMuted(!muted);
    else if (act === 'classic' || act === 'plus') { style = act; saveStore(); showMenu(); }
  }

  /* ---- Game flow ---- */
  const newSeed = () => (Date.now() ^ (Math.random() * 0x7fffffff)) | 0;
  const canPause = () => mode !== 0 && !!state && state.phase !== 'over' && (mode !== 3 || net.live);

  function panel(logo, note, buttons) {
    overlay.innerHTML = `<div class="pg-panel"><div class="pg-logo">${logo}</div><div class="pg-note">${note}</div>${buttons}</div>`;
    overlay.classList.add('pg-show');
  }

  function noPanel() {
    overlay.innerHTML = '';
    overlay.classList.remove('pg-show');
  }

  const button = (act, icon, label, plain) => `<button class="pg-btn${plain ? ' pg-btn-plain' : ''}" data-act="${act}" style="--pg-c:${COLORS[0]}"><span>${icon}</span>${label}</button>`;
  const menuButton = () => button('menu', '🏠', T.menu, true);

  function start(players) {
    mode = players;
    begin(newSeed());
    // Two players: the game waits for a tap, so the two children are ready
    if (players === 2) { render(1); setPaused(true, '👆'); } else loop.start();
  }

  // A new game on this device. The loop does not run yet.
  function begin(seed) {
    state = sim.create(seed, style);
    before = snapshot();
    targets[0] = targets[1] = null;
    keys[0] = keys[1] = 0;
    held[0] = held[1] = 0;
    pointers.clear();
    trails = new Map(); sparks = [];
    paused = false;
    noPanel();
    root.classList.add('pg-playing');
    root.classList.toggle('pg-classic', style === 'classic');
  }

  function showMenu() {
    dropPair();
    dropNet();
    if (loop) loop.stop();
    mode = 0;
    state = null;
    paused = false;
    flipped = false;
    trails = new Map(); sparks = [];
    root.classList.remove('pg-playing');
    root.classList.toggle('pg-classic', style === 'classic');
    const pick = (id, icon, label) => `<button class="pg-pick${style === id ? ' pg-on' : ''}" data-act="${id}" aria-pressed="${style === id}"><span>${icon}</span>${label}</button>`;
    overlay.innerHTML = `
      <div class="pg-panel pg-wide">
        <div class="pg-title">🏓 ${T.title}</div>
        <div class="pg-picks">${pick('classic', '🕹️', T.classic)}${pick('plus', '🔥', T.plus)}</div>
        <div class="pg-modes">
          <button class="pg-btn" data-act="one" style="--pg-c:${COLORS[0]}"><span>🧒🤖</span>${T.onePlayer}</button>
          <button class="pg-btn" data-act="two" style="--pg-c:${COLORS[1]}"><span>🧒🧒</span>${T.twoPlayers}</button>
          <button class="pg-btn" data-act="net" style="--pg-c:#81c784"><span>📱📱</span>${T.twoDevices}</button>
        </div>
      </div>`;
    overlay.classList.add('pg-show');
    setMuted(muted);
    render(1);
  }

  // remote: the other device paused or continued (two devices only)
  function setPaused(value, logo = '⏸', remote = false) {
    if (remote) net.otherPaused = value;
    else {
      paused = value;
      if (mode === 3) net.link.talk({ t: 'pause', on: value });
    }
    if (mode === 3 && !paused && net.otherPaused) {
      // The child who paused is the one who continues
      loop.stop();
      panel('⏸', T.otherPaused, menuButton());
    } else if (paused) {
      loop.stop();
      overlay.innerHTML = `
        <div class="pg-panel">
          <div class="pg-logo">${logo}</div>
          <button class="pg-btn" data-act="resume" style="--pg-c:${COLORS[0]}"><span>▶</span>${T.resume}</button>
          <button class="pg-btn pg-btn-plain" data-act="menu"><span>🏠</span>${T.menu}</button>
        </div>`;
      overlay.classList.add('pg-show');
    } else {
      noPanel();
      if (net) net.waitShown = false; // the next step shows the wait screen again, if the game still waits
      loop.start();
    }
  }

  function gameOver() {
    // Two devices: the loop continues, so the other device gets the last inputs
    if (mode === 3) net.live = false; else loop.stop();
    render(1); // show the final score behind the end screen
    const w = state.winner;
    const lost = mode === 3 ? w !== net.player : mode === 1 && w === 1;
    const text = mode === 3 ? (lost ? T.youLose : T.youWin) : `${mode === 1 && w === 1 ? T.computer : T.players[w]} ${T.wins}`;
    overlay.innerHTML = `
      <div class="pg-panel">
        <div class="pg-logo">${lost ? (mode === 1 ? '🤖' : '🎈') : '🏆'}</div>
        <div class="pg-title pg-keep" style="color:${COLORS[w]}">${text}</div>
        <div class="pg-final">${state.score[0]} : ${state.score[1]}</div>
        <button class="pg-btn" data-act="again" style="--pg-c:${COLORS[w]}"><span>🔁</span>${T.playAgain}</button>
        <button class="pg-btn pg-btn-plain" data-act="menu"><span>🏠</span>${T.menu}</button>
      </div>`;
    overlay.classList.add('pg-show');
    root.classList.remove('pg-playing');
    if (mode !== 1) OS.awardCoins(2, 'pong', '🏓', T.coinsDuo);
    else if (w === 0) OS.awardCoins(3, 'pong', '🏓', T.coinsSolo);
  }

  /* ---- Two devices: pairing ----
     The first device shows a QR code. The second device scans it and shows its own code.
     The first device scans that code. Then the connection opens (js/lib/pairing.js). */
  function openPairing() {
    Promise.all(['pairing', 'lockstep', 'qr'].map(name => OS.loadLib(name))).then(
      () => { if (root && mode === 0) pairStart(); },
      () => { if (root) panel('😕', T.failed, menuButton()); },
    );
  }

  function pairStart() {
    dropPair();
    panel('📡', T.howTo, `<div class="pg-row">${button('host', '🔳', T.showCode)}${button('join', '📷', T.scanCode)}</div>${menuButton()}`);
  }

  // Ends a pairing that is not complete: camera off, connection closed
  function dropPair() {
    if (!pair) return;
    const { session, scanner, timer, hintTimer } = pair;
    pair = null;
    clearTimeout(timer);
    clearTimeout(hintTimer);
    if (scanner) scanner.stop();
    if (session) {
      session.link.onopen = session.link.onclose = null;
      session.link.close();
    }
  }

  function pairFailed(logo = '😕', note = T.failed) {
    dropPair();
    panel(logo, note, button('net', '🔁', T.tryAgain) + menuButton());
  }

  function watch(link) {
    link.onopen = () => {
      const role = pair.role;
      pair.session = null; // the game has the connection now
      dropPair();
      connect(link, role);
    };
    link.onclose = () => pairFailed();
  }

  // Screen with a picture (QR code or camera), a text, and buttons. The picture is as large as
  // the window permits. In a low and wide window it is at the left of the text.
  // ratio: width of the picture divided by its height. Returns the picture element.
  function pictureScreen(picture, ratio, note, buttons) {
    const w = root.clientWidth, h = root.clientHeight;
    const side = h < 420 && w > h * 1.4;
    overlay.innerHTML = `<div class="pg-panel pg-wide${side ? ' pg-side' : ''}">${picture}<div class="pg-note">${note}</div><div class="pg-row">${buttons}</div></div>`;
    overlay.classList.add('pg-show');
    const el = overlay.querySelector('.pg-panel').firstElementChild;
    const height = Math.max(140, Math.min(side ? h - 32 : h - 190, 460));
    const width = Math.min(height * ratio, side ? w * 0.5 : w - 40);
    el.style.width = Math.round(width) + 'px';
    el.style.height = Math.round(width / ratio) + 'px';
    return el;
  }

  function showCode(code, note, more = '') {
    const c = pictureScreen('<canvas class="pg-qr"></canvas>', 1, note, more + menuButton());
    c.width = c.height = Math.round(parseInt(c.style.width, 10) * Math.min(window.devicePixelRatio || 1, 3));
    QR.draw(c, code);
  }

  // accept(text): true when the text is the code that this device waits for
  function showScanner(note, accept) {
    pictureScreen('<video class="pg-cam" playsinline muted></video>', 4 / 3, note, button('flip', '🔄', T.otherCamera, true) + menuButton());
    startScanner(accept, false);
  }

  function startScanner(accept, front) {
    const mine = pair;
    if (mine.scanner) mine.scanner.stop();
    Object.assign(mine, { accept, front });
    // The camera can see more than one code. Each code is tried, one after the other.
    let queue = Promise.resolve(), done = false;
    mine.scanner = QR.scan(overlay.querySelector('.pg-cam'), text => {
      queue = queue.then(async () => {
        if (done || pair !== mine) return;
        if (await accept(text)) done = true;
        else if (pair === mine) hint(T.wrongCode);
      }).catch(() => {});
    }, front);
    mine.scanner.ready.then(result => {
      if (pair !== mine || result === 'ok') return;
      if (result === 'no-reader') pairFailed('🚫', T.noReader); else pairFailed('📷', T.noCamera);
    });
  }

  // Shows a text in place of the note for a moment
  function hint(text) {
    const note = overlay.querySelector('.pg-note');
    if (!note) return;
    note.dataset.text ||= note.textContent;
    note.textContent = text;
    clearTimeout(pair.hintTimer);
    pair.hintTimer = setTimeout(() => { note.textContent = note.dataset.text; }, 2000);
  }

  async function pairHost() {
    dropPair();
    const mine = pair = { role: 0, session: null, scanner: null, code: '' };
    panel('⏳', T.linking, menuButton());
    const session = await Pairing.host();
    if (pair !== mine) { if (session) session.link.close(); return; } // the child left this screen
    if (!session) return pairFailed('📵', T.noNetwork);
    Object.assign(mine, { session, code: session.code });
    watch(session.link);
    showCode(session.code, T.scanMe, button('host-scan', '📷', T.next));
  }

  function pairHostScan() {
    const mine = pair;
    if (!mine || mine.role !== 0 || !mine.session) return;
    showScanner(T.scanOther, async text => {
      if (Pairing.kind(text) !== 'answer' || !(await mine.session.accept(text))) return false;
      if (pair !== mine) return true;
      mine.scanner.stop();
      panel('⏳', T.linking, menuButton());
      mine.timer = setTimeout(() => { if (pair === mine) pairFailed(); }, 12000);
      return true;
    });
  }

  function pairJoin() {
    dropPair();
    const mine = pair = { role: 1, session: null, scanner: null, code: '' };
    showScanner(T.scanOther, async text => {
      if (Pairing.kind(text) !== 'offer') return false;
      mine.scanner.stop();
      const session = await Pairing.join(text);
      if (pair !== mine) { if (session) session.link.close(); return true; }
      if (!session) { pairFailed(); return true; }
      Object.assign(mine, { session, code: session.code });
      watch(session.link);
      showCode(session.code, T.nowOther);
      return true;
    });
  }

  /* ---- Two devices: game ----
     The devices send inputs only, never the game state. Messages of the other device are
     not trusted: each field is checked before use. */

  // link: open connection from Pairing. player: 0 on the device that made the first code, 1 on the other.
  function connect(link, player) {
    if (!root) { link.close(); return; } // the Pong window closed in the meantime
    dropNet();
    loop.stop();
    net = { link, player: player === 1 ? 1 : 0, lock: null, game: 0, live: false, log: [], otherPaused: false, waitShown: false };
    link.ontalk = onTalk;
    link.onfast = onFast;
    link.onclose = onLost;
    mode = 3;
    state = null;
    paused = false;
    flipped = net.player === 1;
    root.classList.remove('pg-playing');
    render(1);
    if (link.state !== 'open') return onLost();
    panel('🤝', T.connected, button('go', '▶', T.resume) + menuButton());
  }

  // Ends the network game on this device. The other device sees that the connection closed.
  function dropNet() {
    if (!net) return;
    const link = net.link;
    net = null;
    link.ontalk = link.onfast = link.onclose = null;
    link.close();
  }

  function onLost() {
    if (!net) return;
    dropNet();
    loop.stop();
    mode = 0; // no input moves a paddle now
    paused = false;
    root.classList.remove('pg-playing');
    panel('🔌', T.lost, menuButton());
  }

  // Each of the two children can ask for a game. The first device sets seed and style.
  function requestStart() {
    if (!net || net.live) return;
    if (net.player === 0) startNet(newSeed(), style, (net.game + 1) & 255);
    else net.link.talk({ t: 'again' });
  }

  function startNet(seed, look, game) {
    if (net.player === 0) net.link.talk({ t: 'start', seed, style: look, game });
    style = look;
    Object.assign(net, { game, live: true, log: [], otherPaused: false, waitShown: false });
    // The game number is the first byte of each input message. A late message of the game before is dropped.
    net.lock = Lockstep.create({
      player: net.player,
      send(buf) {
        const out = new Uint8Array(buf.byteLength + 1);
        out[0] = game;
        out.set(new Uint8Array(buf), 1);
        net.link.fast(out.buffer);
      },
    });
    begin(seed);
    loop.start();
  }

  function onFast(buf) {
    if (!net.lock || buf.byteLength < 2 || new Uint8Array(buf, 0, 1)[0] !== net.game) return;
    net.lock.receive(buf.slice(1));
  }

  function onTalk(v) {
    if (v.t === 'start' && net.player === 1) {
      const ok = Number.isInteger(v.seed) && (v.seed | 0) === v.seed && (v.style === 'classic' || v.style === 'plus') && Number.isInteger(v.game) && v.game >= 0 && v.game <= 255;
      if (ok) startNet(v.seed, v.style, v.game);
    } else if (v.t === 'again' && net.player === 0) requestStart();
    else if (v.t === 'pause' && typeof v.on === 'boolean' && net.live) setPaused(v.on, undefined, true);
    else if (v.t === 'apart' && net.live) apart(false);
  }

  // The two devices do not have the same game. This game cannot continue, a new one can start.
  function apart(tell) {
    net.live = false;
    loop.stop();
    if (tell) net.link.talk({ t: 'apart' });
    root.classList.remove('pg-playing');
    panel('🙈', T.apart, button('again', '🔁', T.playAgain) + menuButton());
  }

  function showWait(on) {
    net.waitShown = on;
    if (on) panel('⏳', T.waiting, menuButton()); else noPanel();
  }

  function netStep() {
    if (!net.live) { net.lock.tick(null); return; } // game is over: the other device can still need the last inputs
    for (const pair of net.lock.tick(ownInput(net.player))) {
      before = snapshot();
      sim.step(state, pair);
      effects();
      if (!net.live) return;
      if (state.tick % CHECK_EACH === 0) {
        const value = Lockstep.hash(sim.values(state));
        net.log.push([state.tick, value]);
        if (net.log.length > 40) net.log.shift();
        net.lock.check(state.tick, value);
      }
    }
    if (net.lock.apart) return apart(true);
    const wait = net.lock.waiting >= WAIT_SHOW;
    if (wait !== net.waitShown) showWait(wait);
  }

  function snapshot() {
    return { paddles: state.paddles.slice(), balls: new Map(state.balls.map(b => [b.id, [b.x, b.y]])) };
  }

  // Where the player wants the paddle: place of the finger, or a place from the keys
  function ownInput(i) {
    if (keys[i] === 0) return targets[i];
    held[i]++;
    return state.paddles[i] + keys[i] * Math.min(sim.PADDLE_SPEED, KEY_SLOW + held[i] * KEY_GAIN);
  }

  function step() {
    if (mode === 3) return netStep();
    before = snapshot();
    const input = [ownInput(0), ownInput(1)];
    if (mode === 1) input[1] = sim.computerTarget(state, 1);
    sim.step(state, input);
    effects();
  }

  // Sounds and sparks for what occurred in the last step
  function effects() {
    for (const [ev, x, y, extra] of state.events) {
      if (ev === 'hit') tone(520, 520, 0.05);
      else if (ev === 'wall') tone(330, 330, 0.04);
      else if (ev === 'point') tone(260, 140, 0.3);
      else if (ev === 'spin') tone(500, 900, 0.18);
      else if (ev === 'kick') { tone(300, 1200, 0.22); burst(x, y, '#7df9ff', 14); }
      else if (ev === 'fire') { tone(160, 80, 0.35, 'sawtooth'); burst(x, y, POWER.fire.color, 18); }
      else if (ev === 'zap') { tone(1400, 500, 0.2, 'square'); burst(x, y, POWER.zap.color, 18); }
      else if (ev === 'stun') { tone(90, 60, 0.5, 'sawtooth'); burst(x, y, POWER.zap.color, 26); }
      else if (ev === 'split') { tone(700, 700, 0.08); tone(1050, 1050, 0.16); burst(x, y, POWER.split.color, 18); }
      else if (ev === 'brick') { tone(880, 660, 0.07, 'square'); burst(x, y, BRICK_COLORS[extra], 10); }
      else if (ev === 'wallup') { tone(200, 400, 0.12, 'square'); tone(400, 800, 0.24, 'square'); }
      else if (ev === 'walldown') tone(500, 200, 0.25);
      else if (ev === 'item') tone(700, 1000, 0.12);
      else if (ev === 'pickup') { tone(600, 1200, 0.1); tone(900, 1500, 0.2); burst(x, y, '#ffd54f', 16); }
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

  function burst(x, y, color, count) {
    for (let n = 0; n < count; n++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
    }
  }

  function ballColor(b) {
    if (b.fire) return POWER.fire.color;
    if (b.zap) return POWER.zap.color;
    if (b.kick) return '#7df9ff';
    if (b.spin !== 0) return '#b388ff';
    return '#ffffff';
  }

  // Picture of a power-up, in a circle with radius r on the screen
  function powerIcon(type, sx, sy, r) {
    if (type === 'split') {
      // Two balls that leave to two sides
      ctx.fillStyle = '#fff';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(sx + side * r * 0.42, sy + side * r * 0.3, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${r * 1.25}px system-ui, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(POWER[type].icon, sx, sy + r * 0.06);
  }

  // Number from 3 x 5 blocks, like the first Pong machines. Always upright on the screen.
  const BLOCKS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111'];
  function blockNumber(n, x, y, size) {
    const [sx, sy] = toScreen(x, y);
    const cell = size * view.scale;
    const bits = BLOCKS[n] || BLOCKS[0];
    for (let i = 0; i < 15; i++) {
      if (bits[i] === '1') ctx.fillRect(Math.round(sx + ((i % 3) - 1.5) * cell), Math.round(sy + (Math.floor(i / 3) - 2.5) * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }

  function render(alpha) {
    if (!ctx) return;
    const classic = style === 'classic';
    const s = state;
    const score = s ? s.score : [0, 0];
    const mix = (a, b) => a + (b - a) * alpha;

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = classic ? '#000' : '#0d1b33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (classic) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, 4 * view.scale);
      ctx.strokeRect(view.left, view.top, view.width, view.height);
      ctx.fillStyle = '#fff';
      for (let y = 15; y < sim.H; y += 40) rect(sim.W / 2, y + 10, 5, 10, 0);
      blockNumber(score[0], sim.W * 0.3, 80, 16);
      blockNumber(score[1], sim.W * 0.7, 80, 16);
    } else {
      ctx.fillStyle = '#12284a';
      ctx.beginPath();
      ctx.roundRect(view.left, view.top, view.width, view.height, 18 * view.scale);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let y = 20; y < sim.H; y += 60) rect(sim.W / 2, y + 15, 4, 15, 3);

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
    }

    if (!s) return;

    // Wall of bricks. It blinks in its last 2 seconds.
    if (s.bricks.length && !(s.wallUntil - s.tick < 2 * sim.HZ && Math.floor(s.tick / 12) % 2 === 0)) {
      for (const k of s.bricks) {
        ctx.fillStyle = BRICK_COLORS[k.row];
        rect((k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, (k.x1 - k.x0) / 2, (k.y1 - k.y0) / 2, 6);
      }
    }

    // Power-up on the court
    if (s.item) {
      const [sx, sy] = toScreen(s.item.x, s.item.y);
      const beat = 1 + 0.08 * Math.sin(s.tick / 14);
      const r = sim.ITEM_R * view.scale * beat;
      const leaving = s.item.until - s.tick < 2 * sim.HZ && Math.floor(s.tick / 12) % 2 === 0; // it blinks before it goes
      if (!leaving) {
        const look = POWER[s.item.type];
        const glow = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.5);
        glow.addColorStop(0, look.glow + '0.9)');
        glow.addColorStop(1, look.glow + '0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
        powerIcon(s.item.type, sx, sy, r);
      }
    }

    // Paddles
    for (let i = 0; i < 2; i++) {
      const y = before ? mix(before.paddles[i], s.paddles[i]) : s.paddles[i];
      const stunned = s.stun[i] > 0;
      const power = s.power[i];
      // A paddle that cannot move shakes and flashes
      const shake = stunned ? (Math.floor(s.tick / 3) % 2 ? 3 : -3) : 0;
      ctx.shadowColor = stunned ? POWER.zap.color : power ? POWER[power].color : '#000';
      ctx.shadowBlur = stunned || power ? 26 * view.scale : 0;
      ctx.fillStyle = classic ? '#fff' : stunned ? (Math.floor(s.tick / 6) % 2 ? '#fff59d' : '#9e9e9e') : power ? POWER[power].color : COLORS[i];
      rect(sim.PADDLE_X[i] + shake, y, sim.PADDLE_THICK / 2, sim.PADDLE_HALF, classic ? 0 : 10);
      ctx.shadowBlur = 0;
      const mark = stunned ? 'zap' : power;
      if (mark) {
        const [sx, sy] = toScreen(sim.PADDLE_X[i] + (i === 0 ? -30 : 30), y);
        powerIcon(mark, sx, sy, 22 * view.scale);
      }
    }

    // Sparks
    sparks = sparks.filter(p => p.life > 0);
    for (const p of sparks) {
      p.x += p.vx; p.y += p.vy; p.life -= 0.04;
      const [sx, sy] = toScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 5 * view.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (s.phase === 'over') return;

    if (s.phase === 'serve') {
      // The ball pulses before a serve, so the children see that it starts soon
      const [sx, sy] = toScreen(sim.W / 2, sim.H / 2);
      const r = sim.BALL_R * view.scale * (1 + 0.25 * Math.abs(((s.serveIn % 40) / 20) - 1));
      ctx.fillStyle = '#fff';
      if (classic) ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      else { ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); }
      trails = new Map();
      return;
    }

    turn += 0.45;
    for (const id of trails.keys()) if (!s.balls.some(b => b.id === id)) trails.delete(id);
    for (const b of s.balls) {
      const old = before && before.balls.get(b.id);
      const [sx, sy] = toScreen(old ? mix(old[0], b.x) : b.x, old ? mix(old[1], b.y) : b.y);
      const r = sim.BALL_R * view.scale;

      if (classic) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        continue;
      }

      const color = ballColor(b);
      const special = b.fire || b.zap || b.kick || b.spin !== 0;
      const trail = trails.get(b.id) || [];
      trails.set(b.id, trail);
      trail.push([sx, sy]);
      const keep = b.fire || b.kick || b.zap ? 16 : b.spin !== 0 ? 12 : 6;
      while (trail.length > keep) trail.shift();
      for (let n = 0; n < trail.length - 1; n++) {
        const part = (n + 1) / trail.length;
        ctx.globalAlpha = part * 0.35;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(trail[n][0], trail[n][1], r * (0.4 + 0.6 * part), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.shadowColor = color;
      ctx.shadowBlur = special ? 22 * view.scale : 0;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (b.spin !== 0) {
        // Two marks that go round: the child sees that the ball spins
        const angle = turn * b.spin;
        ctx.strokeStyle = '#311b92';
        ctx.lineWidth = Math.max(2, 4 * view.scale);
        for (const from of [angle, angle + Math.PI]) {
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.62, from, from + 1.3);
          ctx.stroke();
        }
      }
      if (b.zap) {
        // Short flashes around a lightning ball
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(1.5, 3 * view.scale);
        for (let n = 0; n < 3; n++) {
          const a = Math.random() * Math.PI * 2, len = r * (1.4 + Math.random());
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
          ctx.lineTo(sx + Math.cos(a + 0.3) * len * 0.8, sy + Math.sin(a + 0.3) * len * 0.8);
          ctx.lineTo(sx + Math.cos(a) * len * 1.3, sy + Math.sin(a) * len * 1.3);
          ctx.stroke();
        }
      }
    }
  }

  /* ---- Sound: short tones, no audio files ---- */
  function unlockAudio() {
    if (audio || muted) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audio = new Ctx();
  }

  function tone(from, to, seconds, type = 'triangle') {
    if (muted || !audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, audio.currentTime);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, audio.currentTime + seconds);
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
    saveStore();
    if (!muted) unlockAudio();
  }

  return {
    getHTML, init, destroy, sim, connect,
    pause() { if (canPause() && !paused) setPaused(true); },
    // For the tests
    get state() { return state; },
    get pairing() { return pair && { role: pair.role, code: pair.code }; },
    get net() { return net && { player: net.player, game: net.game, live: net.live, log: net.log.slice(), waiting: net.waitShown, otherPaused: net.otherPaused }; },
    get running() { return !!(loop && loop.running); },
    get style() { return style; },
  };
})();

OS.registerApp('pong', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'pong',
      title: 'Pong',
      icon: '🏓',
      stage: false, // Pong fits its court to the window
      width: 760,
      height: 520,
      content: PongApp.getHTML(),
    };
  },

  onOpen(id) { PongApp.init(id); },
  onClose() { PongApp.destroy(); },
  onMinimize() { PongApp.pause(); },
});
