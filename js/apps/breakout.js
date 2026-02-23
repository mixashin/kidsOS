/* ===== Breakout Game ===== */
OS.registerApp('breakout', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'breakout',
      title: 'Breakout',
      icon: '🧱',
      width: 520,
      height: 600,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="bo-wrap">
      <div class="bo-score">
        Score: <span id="bo-score">0</span>
        &nbsp;&nbsp; Best: <span id="bo-hi">0</span>
        &nbsp;&nbsp; Lives: <span id="bo-lives">3</span>
      </div>
      <canvas id="bo-canvas" width="480" height="500"
              style="display:block;cursor:pointer;"></canvas>
      <div class="bo-controls">
        <button class="bo-btn bo-play-btn" onclick="BreakoutApp.handleClick()">&#9654; Play / Restart</button>
      </div>
    </div>`;
  },

  onOpen() { BreakoutApp.init(); },
  onClose() { BreakoutApp.destroy(); },
});

const BreakoutApp = (() => {
  const W = 480;
  const H = 500;

  // Paddle
  const PADDLE_W = 80;
  const PADDLE_H = 12;
  const PADDLE_Y = H - 30;

  // Ball
  const BALL_R = 6;
  const INIT_SPEED = 4;
  const MAX_SPEED = 7;
  const MIN_DY = 1.5; // prevent nearly-horizontal bouncing

  // Bricks
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const BRICK_W = 52;
  const BRICK_H = 18;
  const BRICK_PAD = 6;
  const BRICK_TOP = 50;
  const BRICK_LEFT = (W - (BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD)) / 2;

  const ROW_COLORS = ['#ff4757', '#ff6348', '#ffa502', '#2ed573', '#1e90ff'];

  let canvas, ctx;
  let state = 'idle'; // 'idle' | 'serving' | 'playing' | 'won' | 'dead'
  let paddleX;
  let ballX, ballY, ballDX, ballDY, speed;
  let bricks; // 2D array of { alive }
  let score, lives, hiScore;
  let animFrame = null;

  let _onMouseMove = null;
  let _onTouchMove = null;
  let _onCanvasClick = null;

  /* ---- Init / Destroy ---- */

  function init() {
    setTimeout(() => {
      canvas = document.getElementById('bo-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      hiScore = parseInt(localStorage.getItem('kidsOS_breakout') || '0');
      state = 'idle';
      paddleX = (W - PADDLE_W) / 2;
      drawIdleScreen();

      _onMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
      };

      _onTouchMove = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * scaleX;
        paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
      };

      _onCanvasClick = () => {
        if (state === 'idle' || state === 'won' || state === 'dead') {
          startGame();
        } else if (state === 'serving') {
          launchBall();
        }
      };

      canvas.addEventListener('mousemove', _onMouseMove);
      canvas.addEventListener('touchmove', _onTouchMove, { passive: false });
      canvas.addEventListener('click', _onCanvasClick);
    }, 50);
  }

  function destroy() {
    stopLoop();
    if (canvas) {
      if (_onMouseMove) canvas.removeEventListener('mousemove', _onMouseMove);
      if (_onTouchMove) canvas.removeEventListener('touchmove', _onTouchMove);
      if (_onCanvasClick) canvas.removeEventListener('click', _onCanvasClick);
    }
    _onMouseMove = null;
    _onTouchMove = null;
    _onCanvasClick = null;
    canvas = null;
    ctx = null;
  }

  /* ---- Public controls ---- */

  function handleClick() {
    if (state === 'idle' || state === 'won' || state === 'dead') {
      startGame();
    } else if (state === 'serving') {
      launchBall();
    }
  }

  /* ---- Game lifecycle ---- */

  function startGame() {
    stopLoop();
    score = 0;
    lives = 3;
    speed = INIT_SPEED;
    paddleX = (W - PADDLE_W) / 2;
    initBricks();
    serve();
    updateUI();
    loop();
  }

  function initBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = { alive: true };
      }
    }
  }

  // Ball sits on paddle, waiting for click to launch
  function serve() {
    state = 'serving';
    ballDX = 0;
    ballDY = 0;
  }

  function launchBall() {
    // Launch with slight random horizontal offset, always upward
    const offset = (Math.random() - 0.5) * 0.6; // small random angle
    ballDX = speed * Math.sin(offset);
    ballDY = -speed * Math.cos(offset);
    state = 'playing';
  }

  /* ---- Main loop ---- */

  function loop() {
    if (state !== 'playing' && state !== 'serving') return;
    update();
    draw();
    animFrame = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function update() {
    // In serving state, ball tracks paddle
    if (state === 'serving') {
      ballX = paddleX + PADDLE_W / 2;
      ballY = PADDLE_Y - BALL_R - 1;
      return;
    }

    // Sub-step to prevent tunneling through bricks/paddle
    const steps = Math.max(1, Math.ceil(speed / BALL_R));
    const stepDX = ballDX / steps;
    const stepDY = ballDY / steps;

    for (let s = 0; s < steps; s++) {
      ballX += stepDX;
      ballY += stepDY;

      // --- Wall collisions ---
      if (ballX - BALL_R <= 0) {
        ballX = BALL_R;
        ballDX = Math.abs(ballDX);
      } else if (ballX + BALL_R >= W) {
        ballX = W - BALL_R;
        ballDX = -Math.abs(ballDX);
      }
      if (ballY - BALL_R <= 0) {
        ballY = BALL_R;
        ballDY = Math.abs(ballDY);
      }

      // --- Paddle collision ---
      if (ballDY > 0 &&
          ballY + BALL_R >= PADDLE_Y &&
          ballY + BALL_R <= PADDLE_Y + PADDLE_H + 2 &&
          ballX + BALL_R > paddleX &&
          ballX - BALL_R < paddleX + PADDLE_W) {
        ballY = PADDLE_Y - BALL_R;

        // Classic Breakout: hit position on paddle controls angle
        // -1 = left edge, 0 = center, +1 = right edge
        const center = paddleX + PADDLE_W / 2;
        let hit = (ballX - center) / (PADDLE_W / 2);
        hit = Math.max(-1, Math.min(1, hit));

        // Max deflection 60° from vertical; center = straight up
        const maxAngle = Math.PI / 3;
        const angle = hit * maxAngle;
        ballDX = speed * Math.sin(angle);  // left edge → negative, right edge → positive
        ballDY = -speed * Math.cos(angle); // always upward
      }

      // --- Ball fell below paddle ---
      if (ballY - BALL_R > H) {
        lives--;
        updateUI();
        if (lives <= 0) {
          endGame(false);
          return;
        }
        serve();
        return;
      }

      // --- Brick collisions ---
      if (checkBrickCollisions()) {
        // If game won, stop
        if (state === 'won') return;
      }
    }
  }

  function checkBrickCollisions() {
    let hit = false;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks[r][c];
        if (!b.alive) continue;

        const bx = BRICK_LEFT + c * (BRICK_W + BRICK_PAD);
        const by = BRICK_TOP + r * (BRICK_H + BRICK_PAD);

        // AABB vs circle collision
        // Find closest point on brick to ball center
        const closestX = Math.max(bx, Math.min(ballX, bx + BRICK_W));
        const closestY = Math.max(by, Math.min(ballY, by + BRICK_H));
        const dx = ballX - closestX;
        const dy = ballY - closestY;

        if (dx * dx + dy * dy < BALL_R * BALL_R) {
          b.alive = false;
          score += 10;
          hit = true;

          // Speed up slightly
          speed = Math.min(MAX_SPEED, speed + 0.04);

          // Determine which face was hit for bounce direction
          // Use ball's previous position (before this sub-step) relative to brick
          const prevX = ballX - ballDX / Math.max(1, Math.ceil(speed / BALL_R));
          const prevY = ballY - ballDY / Math.max(1, Math.ceil(speed / BALL_R));

          const fromLeft   = prevX < bx;
          const fromRight  = prevX > bx + BRICK_W;
          const fromTop    = prevY < by;
          const fromBottom = prevY > by + BRICK_H;

          if (fromLeft || fromRight) {
            ballDX = -ballDX;
            // Push ball out
            ballX = fromLeft ? bx - BALL_R : bx + BRICK_W + BALL_R;
          } else if (fromTop || fromBottom) {
            ballDY = -ballDY;
            ballY = fromTop ? by - BALL_R : by + BRICK_H + BALL_R;
          } else {
            // Corner hit — reverse both
            ballDX = -ballDX;
            ballDY = -ballDY;
          }

          // Re-normalize speed after bounce
          const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
          if (mag > 0) {
            ballDX = (ballDX / mag) * speed;
            ballDY = (ballDY / mag) * speed;
          }

          // Enforce minimum vertical speed to prevent horizontal loops
          if (Math.abs(ballDY) < MIN_DY) {
            ballDY = ballDY < 0 ? -MIN_DY : MIN_DY;
            const hMag = Math.sqrt(speed * speed - MIN_DY * MIN_DY);
            ballDX = ballDX < 0 ? -hMag : hMag;
          }

          updateUI();

          if (allBricksCleared()) {
            endGame(true);
            return true;
          }

          // Only one brick per sub-step
          return true;
        }
      }
    }
    return hit;
  }

  function allBricksCleared() {
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        if (bricks[r][c].alive) return false;
      }
    }
    return true;
  }

  function endGame(won) {
    stopLoop();
    state = won ? 'won' : 'dead';
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem('kidsOS_breakout', hiScore);
    }
    updateUI();
    if (won) {
      drawWinScreen();
    } else {
      drawDeadScreen();
    }
  }

  /* ---- Drawing ---- */

  function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    drawBricks();
    drawPaddle();
    drawBall();

    // Serving hint
    if (state === 'serving') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click to launch!', W / 2, PADDLE_Y - 40);
    }
  }

  function drawBricks() {
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        if (!bricks[r][c].alive) continue;
        const bx = BRICK_LEFT + c * (BRICK_W + BRICK_PAD);
        const by = BRICK_TOP + r * (BRICK_H + BRICK_PAD);
        ctx.fillStyle = ROW_COLORS[r];
        roundRect(bx, by, BRICK_W, BRICK_H, 3);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(bx + 2, by + 2, BRICK_W - 4, 4);
      }
    }
  }

  function drawPaddle() {
    ctx.fillStyle = '#5b8cff';
    roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(paddleX + 4, PADDLE_Y + 2, PADDLE_W - 8, 3);
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ballX - 2, ballY - 2, BALL_R * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawIdleScreen() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#5b8cff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1f9f1} BREAKOUT', W / 2, H / 2 - 50);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Click Play to start', W / 2, H / 2 + 10);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Move mouse or drag to control paddle', W / 2, H / 2 + 40);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Best: ' + hiScore, W / 2, H / 2 + 70);
  }

  function drawDeadScreen() {
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e2a3a';
    roundRect(W / 2 - 140, H / 2 - 80, 280, 160, 12);
    ctx.fill();
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Game Over!', W / 2, H / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, W / 2, H / 2);

    ctx.fillStyle = '#ffbd2e';
    ctx.font = '14px sans-serif';
    ctx.fillText('Best: ' + hiScore, W / 2, H / 2 + 28);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click Play to try again', W / 2, H / 2 + 58);
  }

  function drawWinScreen() {
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e2a3a';
    roundRect(W / 2 - 140, H / 2 - 80, 280, 160, 12);
    ctx.fill();
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#2ed573';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('You Win!', W / 2, H / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, W / 2, H / 2);

    ctx.fillStyle = '#ffbd2e';
    ctx.font = '14px sans-serif';
    ctx.fillText('Best: ' + hiScore, W / 2, H / 2 + 28);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click Play to go again!', W / 2, H / 2 + 58);
  }

  /* ---- UI ---- */

  function updateUI() {
    const s = document.getElementById('bo-score');
    const h = document.getElementById('bo-hi');
    const l = document.getElementById('bo-lives');
    if (s) s.textContent = score;
    if (h) h.textContent = hiScore;
    if (l) l.textContent = lives;
  }

  return { init, destroy, handleClick };
})();
