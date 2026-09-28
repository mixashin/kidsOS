/* ===== Shared code of the paddle games: Pong and Breakout =====
   physics  pure numbers. The same inputs give the same numbers on each device:
            only + - * / and Math.sqrt, no sin or cos. Pong on two devices needs this.
   kit      one per open game: canvas that fits a court, sound, effects, pictures, panels.
   Each game keeps its own rules. This file keeps no state of a game. The pictures are a
   read-only cache that both games use. */
// `var` puts Paddle into the shared scope of the app files.
var Paddle = (() => {
  /* ---- Physics ----
     A ball: { x, y, vx, vy, speed, spin, kick, fire, zap }. x is the forward direction of the
     court, y goes across. The side walls are at y = 0 and y = H.
     k: the constants of a game { SPIN_SLOW, SPIN_CURVE, KICK, KICK_SLOPE, FIRE, GUARD, SLICE_MIN, PADDLE_SPEED } */
  const physics = (() => {
    // mulberry32: small seeded random number generator. The state keeps the seed.
    function random(state) {
      state.seed = (state.seed + 0x6D2B79F5) | 0;
      let v = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
      v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
      return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
    }

    // Speed of a ball with all effects
    function speedOf(b, k) {
      const v = b.speed * (b.spin !== 0 ? k.SPIN_SLOW : 1) * (b.kick ? k.KICK : 1) * (b.fire ? k.FIRE : 1);
      return Math.min(k.GUARD, v);
    }

    function aim(b, dx, dy, k) {
      const v = speedOf(b, k) / Math.sqrt(dx * dx + dy * dy);
      b.vx = dx * v;
      b.vy = dy * v;
    }

    // A ball with spin bends toward a side wall, at the same speed. It keeps a part of its forward motion.
    function bend(b, k) {
      const v = speedOf(b, k);
      let vy = b.vy + b.spin * k.SPIN_CURVE * v;
      const limit = v * 0.92;
      if (vy > limit) vy = limit; else if (vy < -limit) vy = -limit;
      const vx = Math.sqrt(v * v - vy * vy);
      b.vx = b.vx < 0 ? -vx : vx;
      b.vy = vy;
    }

    // Side walls at y = R and y = H - R. Returns '' (no wall), 'wall', or 'kick'.
    // The trick of Pong+: at the wall, spin changes into forward speed.
    function sideWalls(b, H, R, k) {
      let wall = false;
      if (b.y < R) { b.y = 2 * R - b.y; b.vy = -b.vy; wall = true; }
      if (b.y > H - R) { b.y = 2 * (H - R) - b.y; b.vy = -b.vy; wall = true; }
      if (!wall) return '';
      if (b.spin === 0) return 'wall';
      b.spin = 0;
      b.kick = true;
      aim(b, b.vx < 0 ? -1 : 1, b.vy < 0 ? -k.KICK_SLOPE : k.KICK_SLOPE, k);
      return 'kick';
    }

    // Where the ball meets the face of a paddle in this part of a step: { face, y }, or null.
    // side 0: the paddle defends x = 0, its face looks to +x. side 1: it defends the far end.
    // px, py: the place of the ball one part of a step before. x: center of the paddle.
    function meet(b, px, py, side, x, thick, R) {
      const face = x + (side === 0 ? thick / 2 : -thick / 2);
      const edge = side === 0 ? -R : R;      // the side of the ball that meets the paddle
      const before = px + edge - face, after = b.x + edge - face;
      const crossed = side === 0 ? before > 0 && after <= 0 : before < 0 && after >= 0;
      // A paddle that arrives late still returns a ball that is next to it
      const beside = side === 0 ? after <= 0 && b.x >= x - thick : after >= 0 && b.x <= x + thick;
      if (!crossed && !beside) return null;
      // A fast ball moves more than one paddle width per step: use the point where its path meets the paddle
      return { face, y: crossed ? py + (b.y - py) * (before / (before - after)) : b.y };
    }

    // Direction of a return from the place of the hit: -0.9 at one end of the paddle, 0.9 at the other
    const slope = (yHit, center, half, R) => (yHit - center) / (half + R) * 0.9;

    // Spin from the speed of the paddle at the hit: 0, or 0.5 to 1 with the sign of the paddle motion
    function slice(v, k) {
      const fast = v < 0 ? -v : v;
      if (fast < k.SLICE_MIN) return 0;
      const amount = Math.min(1, 0.5 + 0.5 * (fast - k.SLICE_MIN) / (k.PADDLE_SPEED - k.SLICE_MIN));
      return v < 0 ? -amount : amount;
    }

    // Index of the first brick that the ball touches, or -1. A brick: { x0, y0, x1, y1 }
    function touch(bricks, b, R) {
      for (let n = 0; n < bricks.length; n++) {
        const k = bricks[n];
        const nx = b.x < k.x0 ? k.x0 : b.x > k.x1 ? k.x1 : b.x;
        const ny = b.y < k.y0 ? k.y0 : b.y > k.y1 ? k.y1 : b.y;
        const dx = b.x - nx, dy = b.y - ny;
        if (dx * dx + dy * dy <= R * R) return n;
      }
      return -1;
    }

    // The ball turns back from a brick. It came from the side where it was one part of a step before.
    function bounce(b, k, px, py) {
      const fromSide = px < k.x0 || px > k.x1;
      const fromEnd = py < k.y0 || py > k.y1;
      if (fromSide || !fromEnd) b.vx = px < (k.x0 + k.x1) / 2 ? (b.vx < 0 ? b.vx : -b.vx) : (b.vx > 0 ? b.vx : -b.vx);
      else b.vy = py < (k.y0 + k.y1) / 2 ? (b.vy < 0 ? b.vy : -b.vy) : (b.vy > 0 ? b.vy : -b.vy);
      b.x = px; b.y = py;
    }

    // A fast ball moves in parts of this length, so it cannot jump over a brick or a paddle
    function parts(b, sub) {
      const fastest = Math.max(b.vx < 0 ? -b.vx : b.vx, b.vy < 0 ? -b.vy : b.vy);
      return Math.max(1, Math.ceil(fastest / sub));
    }

    return { random, speedOf, aim, bend, sideWalls, meet, slope, slice, touch, bounce, parts };
  })();

  /* ---- Look: colors and pictures ---- */
  const POWER = {
    fire: { icon: '🔥', color: '#ff7043', glow: 'rgba(255,112,67,' },
    zap: { icon: '⚡', color: '#ffee58', glow: 'rgba(255,238,88,' },
    split: { icon: '', color: '#80deea', glow: 'rgba(128,222,234,' },
    wall: { icon: '🧱', color: '#ff8a65', glow: 'rgba(255,138,101,' },
    wide: { icon: '', color: '#81c784', glow: 'rgba(129,199,132,' },
    short: { icon: '', color: '#ef5350', glow: 'rgba(239,83,80,' },
  };
  const BRICK_COLORS = ['#ff4757', '#ffa502', '#ffd32a', '#2ed573', '#1e90ff'];
  const BRICK_PICTURES = ['brick-persimmon', 'brick-orange', 'brick-honey', 'brick-meadow', 'brick-sky'];
  const PICTURES = ['game-ball', 'game-ball-fire', 'power-fire', 'power-zap', 'power-split', 'power-wall', ...BRICK_PICTURES];
  // The ball of the fire picture: center and radius, parts of the picture size
  const FIRE_BALL = { x: 0.366, y: 0.5, r: 0.36 };
  const pictures = {};

  // Starts the load of the pictures. A game never waits: it draws shapes until a picture is ready.
  function loadPictures() {
    for (const name of PICTURES) {
      if (pictures[name]) continue;
      const im = new Image();
      im.decoding = 'async';
      im.src = `art/game/${name}.webp`;
      pictures[name] = im;
    }
  }
  const picture = name => { const im = pictures[name]; return im && im.complete && im.naturalWidth > 0 ? im : null; };

  function ballColor(b) {
    if (b.fire) return POWER.fire.color;
    if (b.zap) return POWER.zap.color;
    if (b.kick) return '#7df9ff';
    if (b.spin !== 0) return '#b388ff';
    return '#ffffff';
  }

  /* ---- Sound: short tones, no audio files ---- */
  function sound() {
    let audio = null, muted = false;
    const s = {
      get muted() { return muted; },
      set muted(value) { muted = value; if (!muted) s.unlock(); },
      // A browser starts audio only after a tap
      unlock() {
        if (audio || muted) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audio = new Ctx();
      },
      tone(from, to, seconds, type = 'triangle') {
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
      },
      close() { if (audio) { audio.close(); audio = null; } },
    };
    return s;
  }

  /* ---- Markup and panels (classes pg-*) ---- */
  function html(T, extra = '') {
    return `
    <div class="pg-wrap${extra}">
      <canvas class="pg-canvas"></canvas>
      <div class="pg-hud">
        <button class="pg-round-btn" data-act="pause" aria-label="${T.paused}">⏸</button>
        <button class="pg-round-btn" data-act="sound" aria-label="${T.sound}">🔊</button>
      </div>
      <div class="pg-overlay"></div>
    </div>`;
  }

  const button = (act, icon, label, color, plain) => `<button class="pg-btn${plain ? ' pg-btn-plain' : ''}" data-act="${act}" style="--pg-c:${color}"><span>${icon}</span>${label}</button>`;
  const pick = (id, on, icon, label) => `<button class="pg-pick${on ? ' pg-on' : ''}" data-act="${id}" aria-pressed="${on}"><span>${icon}</span>${label}</button>`;

  /* ---- Kit: all parts of one open game ----
     root: the element .pg-wrap. W x H: the court in units.
     turn: 'auto' turns the court when the frame is taller than wide (Pong), 'always' turns it always (Breakout).
     Turned: the side x = 0 of the court is at the bottom of the screen. */
  function kit(root, W, H, turn) {
    const canvas = root.querySelector('.pg-canvas');
    const ctx = canvas.getContext('2d');
    const overlay = root.querySelector('.pg-overlay');
    const view = { scale: 1, ratio: 1, left: 0, top: 0, width: 0, height: 0 };
    let turned = turn === 'always', flipped = false;
    let sparks = [], trails = new Map(), spinTurn = 0;
    const tones = sound();

    // Returns false while the frame has no size (the app is in the dock)
    function fit() {
      const box = root.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      turned = turn === 'always' || box.height > box.width;
      const long = turned ? canvas.height : canvas.width;
      const short = turned ? canvas.width : canvas.height;
      const scale = Math.min(long / W, short / H);
      Object.assign(view, {
        scale, ratio,
        width: (turned ? H : W) * scale,
        height: (turned ? W : H) * scale,
      });
      view.left = (canvas.width - view.width) / 2;
      view.top = (canvas.height - view.height) / 2;
      root.classList.toggle('pg-turned', turned);
      trails = new Map();
      return true;
    }

    // Court units to canvas pixels. Flipped: the two ends of the court change places on the screen.
    function at(x, y) {
      if (flipped) x = W - x;
      return turned
        ? [view.left + y * view.scale, view.top + (W - x) * view.scale]
        : [view.left + x * view.scale, view.top + y * view.scale];
    }

    // Pointer position to court units. Positions outside the court count too.
    function court(e) {
      const box = canvas.getBoundingClientRect();
      const px = (e.clientX - box.left) * view.ratio - view.left;
      const py = (e.clientY - box.top) * view.ratio - view.top;
      const p = turned
        ? { x: W - py / view.scale, y: px / view.scale }
        : { x: px / view.scale, y: py / view.scale };
      if (flipped) p.x = W - p.x;
      return p;
    }

    // A court direction as a screen direction
    function dir(vx, vy) {
      if (flipped) vx = -vx;
      return turned ? [vy, -vx] : [vx, vy];
    }

    // Size of a court rectangle on the screen: [width, height] in pixels
    function span(halfW, halfH) {
      const w = (turned ? halfH : halfW) * view.scale;
      const h = (turned ? halfW : halfH) * view.scale;
      return [w * 2, h * 2];
    }

    // Filled rectangle in court units, with the current fill style
    function rect(x, y, halfW, halfH, radius) {
      const [sx, sy] = at(x, y);
      const [w, h] = span(halfW, halfH);
      ctx.beginPath();
      ctx.roundRect(sx - w / 2, sy - h / 2, w, h, radius * view.scale);
      ctx.fill();
    }

    // A brick: the painted picture of its row, or a flat rectangle (Classic, or before the picture is loaded)
    function brick(k, row, flat) {
      const [sx, sy] = at((k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2);
      let [w, h] = span((k.x1 - k.x0) / 2, (k.y1 - k.y0) / 2);
      const pic = !flat && picture(BRICK_PICTURES[row]);
      if (!pic) {
        ctx.fillStyle = BRICK_COLORS[row];
        ctx.beginPath();
        ctx.roundRect(sx - w / 2, sy - h / 2, w, h, (flat ? 2 : 6) * view.scale);
        ctx.fill();
        return;
      }
      ctx.save();
      ctx.translate(sx, sy);
      // The picture is wide. A brick that is tall on the screen gets the picture turned.
      if (h > w) { ctx.rotate(Math.PI / 2); [w, h] = [h, w]; }
      ctx.drawImage(pic, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Picture of a power-up in a circle with radius r on the screen
    function icon(type, sx, sy, r) {
      const pic = picture('power-' + type);
      if (pic) { ctx.drawImage(pic, sx - r, sy - r, r * 2, r * 2); return; }
      ctx.fillStyle = '#fff';
      if (type === 'split') {
        // Two balls that leave to two sides
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(sx + side * r * 0.42, sy + side * r * 0.3, r * 0.34, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      if (type === 'wide' || type === 'short') {
        // A paddle with two arrows: out for wide, in for short
        const out = type === 'wide';
        const half = r * (out ? 0.42 : 0.26);
        ctx.beginPath();
        ctx.roundRect(sx - half, sy - r * 0.13, half * 2, r * 0.26, r * 0.12);
        ctx.fill();
        for (const side of [-1, 1]) {
          const tip = sx + side * (out ? r * 0.95 : r * 0.34);
          const back = tip - side * r * 0.3 * (out ? 1 : -1);
          ctx.beginPath();
          ctx.moveTo(tip, sy);
          ctx.lineTo(back, sy - r * 0.26);
          ctx.lineTo(back, sy + r * 0.26);
          ctx.closePath();
          ctx.fill();
        }
        return;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${r * 1.25}px system-ui, sans-serif`;
      ctx.fillText(POWER[type].icon, sx, sy + r * 0.06);
    }

    // A power-up on the court: glow and picture. It beats a little.
    function item(type, x, y, r, tick) {
      const [sx, sy] = at(x, y);
      const size = r * view.scale * (1 + 0.08 * Math.sin(tick / 14));
      const look = POWER[type];
      const glow = ctx.createRadialGradient(sx, sy, size * 0.2, sx, sy, size * 1.5);
      glow.addColorStop(0, look.glow + '0.9)');
      glow.addColorStop(1, look.glow + '0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      icon(type, sx, sy, size);
    }

    // The body of a ball at a screen place: picture, or a white circle
    function body(sx, sy, r, fireFrom) {
      if (fireFrom) {
        const pic = picture('game-ball-fire');
        if (pic) {
          // The flame points behind the ball. A ball that moves to the right uses the mirror picture, so the face stays upright.
          let [dx, dy] = fireFrom;
          const size = r / FIRE_BALL.r;
          ctx.save();
          ctx.translate(sx, sy);
          if (dx > 0) { ctx.scale(-1, 1); dx = -dx; }
          ctx.rotate(Math.atan2(dy, dx) - Math.PI);
          ctx.drawImage(pic, -FIRE_BALL.x * size, -FIRE_BALL.y * size, size, size);
          ctx.restore();
          return;
        }
      }
      const pic = picture('game-ball');
      if (pic) { ctx.drawImage(pic, sx - r, sy - r, r * 2, r * 2); return; }
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A ball in play: trail, glow, body, marks for spin and lightning. x, y: place to draw, in court units.
    function ball(b, x, y, R) {
      const [sx, sy] = at(x, y);
      const r = R * view.scale;
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
      body(sx, sy, r, b.fire && dir(b.vx, b.vy));
      ctx.shadowBlur = 0;

      if (b.spin !== 0) {
        // Two marks that go round: the child sees that the ball spins
        const angle = spinTurn * b.spin;
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

    // Once each frame, before the balls: the spin marks go round, trails of balls that are gone go away
    function frame(balls) {
      spinTurn += 0.45;
      for (const id of trails.keys()) if (!balls.some(b => b.id === id)) trails.delete(id);
    }

    function burst(x, y, color, count) {
      for (let n = 0; n < count; n++) {
        const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
      }
    }

    function drawSparks() {
      sparks = sparks.filter(p => p.life > 0);
      for (const p of sparks) {
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        const [sx, sy] = at(p.x, p.y);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 5 * view.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Number from 3 x 5 blocks, like the first Pong machines. Always upright on the screen.
    const BLOCKS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
    function blockNumber(n, x, y, size) {
      const [sx, sy] = at(x, y);
      const cell = size * view.scale;
      const bits = BLOCKS[n] || BLOCKS[0];
      for (let i = 0; i < 15; i++) {
        if (bits[i] === '1') ctx.fillRect(Math.round(sx + ((i % 3) - 1.5) * cell), Math.round(sy + (Math.floor(i / 3) - 2.5) * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }

    // Sound and sparks for one event of the simulation: [name, x, y, extra]
    function effect([ev, x, y, extra]) {
      const t = tones.tone;
      if (ev === 'hit') t(520, 520, 0.05);
      else if (ev === 'wall') t(330, 330, 0.04);
      else if (ev === 'point' || ev === 'lose') t(260, 140, 0.3);
      else if (ev === 'spin') t(500, 900, 0.18);
      else if (ev === 'kick') { t(300, 1200, 0.22); burst(x, y, '#7df9ff', 14); }
      else if (ev === 'fire') { t(160, 80, 0.35, 'sawtooth'); burst(x, y, POWER.fire.color, 18); }
      else if (ev === 'zap') { t(1400, 500, 0.2, 'square'); burst(x, y, POWER.zap.color, 18); }
      else if (ev === 'stun' || ev === 'blast') { t(90, 60, 0.5, 'sawtooth'); burst(x, y, POWER.zap.color, 26); }
      else if (ev === 'split') { t(700, 700, 0.08); t(1050, 1050, 0.16); burst(x, y, POWER.split.color, 18); }
      else if (ev === 'brick') { t(880, 660, 0.07, 'square'); burst(x, y, BRICK_COLORS[extra], 10); }
      else if (ev === 'wallup') { t(200, 400, 0.12, 'square'); t(400, 800, 0.24, 'square'); }
      else if (ev === 'walldown') t(500, 200, 0.25);
      else if (ev === 'item') t(700, 1000, 0.12);
      else if (ev === 'pickup') { t(600, 1200, 0.1); t(900, 1500, 0.2); burst(x, y, '#ffd54f', 16); }
      else if (ev === 'wide') { t(400, 900, 0.2); burst(x, y, POWER.wide.color, 16); }
      else if (ev === 'short') { t(500, 180, 0.3, 'sawtooth'); burst(x, y, POWER.short.color, 16); }
      else if (ev === 'level') { t(520, 520, 0.1); t(660, 660, 0.2); t(880, 880, 0.3); }
    }

    function show(content) {
      overlay.innerHTML = content;
      overlay.classList.add('pg-show');
    }

    function hide() {
      overlay.innerHTML = '';
      overlay.classList.remove('pg-show');
    }

    return {
      canvas, ctx, overlay, view, sound: tones,
      get turned() { return turned; },
      get flipped() { return flipped; },
      set flipped(value) { flipped = value; },
      fit, at, court, dir, span, rect, brick, icon, item, body, ball, frame, burst, drawSparks, blockNumber, effect, show, hide,
      clear() { sparks = []; trails = new Map(); },
      panel(logo, note, buttons) { show(`<div class="pg-panel"><div class="pg-logo">${logo}</div><div class="pg-note">${note}</div>${buttons}</div>`); },
      // Panel of a pause: the child continues or goes to the menu
      pausePanel(logo, T, color) {
        show(`
        <div class="pg-panel">
          <div class="pg-logo">${logo}</div>
          ${button('resume', '▶', T.resume, color)}
          ${button('menu', '🏠', T.menu, color, true)}
        </div>`);
      },
      // End of a game: logo, a large title, a line with the result, and 2 buttons
      endPanel(logo, title, color, result, T) {
        show(`
        <div class="pg-panel">
          <div class="pg-logo">${logo}</div>
          <div class="pg-title pg-keep" style="color:${color}">${title}</div>
          <div class="pg-final">${result}</div>
          ${button('again', '🔁', T.playAgain, color)}
          ${button('menu', '🏠', T.menu, color, true)}
        </div>`);
      },
      // The sound button shows the state
      setMuted(value) {
        tones.muted = value;
        const btn = root.querySelector('[data-act="sound"]');
        if (btn) btn.textContent = value ? '🔇' : '🔊';
      },
      destroy() { tones.close(); sparks = []; trails = new Map(); },
    };
  }

  // Physical keys, so the letters work on each keyboard layout. A held key starts slowly and gets faster:
  // a long press is a slice.
  const KEY_SLOW = 5, KEY_GAIN = 0.3;
  const keyTarget = (at, dir, held, max) => at + dir * Math.min(max, KEY_SLOW + held * KEY_GAIN);

  return { physics, kit, html, button, pick, loadPictures, POWER, BRICK_COLORS, keyTarget };
})();
