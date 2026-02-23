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
      <div class="bo-hud">
        <span>Score: <b id="bo-score">0</b></span>
        <span>Best: <b id="bo-hi">0</b></span>
        <span>Lives: <b id="bo-lives">3</b></span>
        <button class="bo-play-btn" onclick="BreakoutApp.handleClick()">&#9654; Play</button>
      </div>
      <canvas id="bo-canvas" style="display:block;cursor:pointer;"></canvas>
    </div>`;
  },

  onOpen() { BreakoutApp.init(); },
  onClose() { BreakoutApp.destroy(); },
});

const BreakoutApp = (() => {
  // Game constants (fixed ratios, scaled to canvas)
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const ROW_COLORS = ['#ff4757', '#ff6348', '#ffa502', '#2ed573', '#1e90ff'];
  const INIT_SPEED = 4;
  const MAX_SPEED = 7;
  const MIN_DY = 1.5;

  // Dynamic dimensions — set on resize
  let W, H;
  let PADDLE_W, PADDLE_H, PADDLE_Y;
  let BALL_R;
  let BRICK_W, BRICK_H, BRICK_PAD, BRICK_TOP, BRICK_LEFT;

  let canvas, ctx;
  let state = 'idle'; // 'idle' | 'serving' | 'playing' | 'won' | 'dead'
  let paddleX;
  let ballX, ballY, ballDX, ballDY, speed;
  let bricks;
  let score, lives, hiScore;
  let animFrame = null;

  let _onMouseMove = null;
  let _onTouchMove = null;
  let _onCanvasClick = null;
  let _onResize = null;

  /* ---- Sizing ---- */

  function sizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    // Canvas fills all space below the HUD bar
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight - wrap.querySelector('.bo-hud').offsetHeight;
    canvas.width = cw;
    canvas.height = ch;
    computeDimensions();
  }

  function computeDimensions() {
    W = canvas.width;
    H = canvas.height;

    PADDLE_W = Math.round(W * 0.17);
    PADDLE_H = Math.round(H * 0.02);
    if (PADDLE_H < 10) PADDLE_H = 10;
    PADDLE_Y = H - PADDLE_H - 8; // almost at the very bottom

    BALL_R = Math.max(5, Math.round(W * 0.013));

    BRICK_PAD = Math.round(W * 0.012);
    BRICK_W = Math.floor((W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS);
    BRICK_H = Math.max(14, Math.round(H * 0.032));
    BRICK_TOP = Math.round(H * 0.06);
    BRICK_LEFT = Math.round((W - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_PAD)) / 2);
  }

  /* ---- Init / Destroy ---- */

  function init() {
    setTimeout(() => {
      canvas = document.getElementById('bo-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      hiScore = parseInt(localStorage.getItem('kidsOS_breakout') || '0');

      sizeCanvas();
      state = 'idle';
      paddleX = (W - PADDLE_W) / 2;
      drawIdleScreen();
      updateUI();

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

      _onResize = () => {
        sizeCanvas();
        // Clamp paddle into new bounds
        paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));
        // Redraw current state
        if (state === 'idle') drawIdleScreen();
        else if (state === 'dead') drawDeadScreen();
        else if (state === 'won') drawWinScreen();
        // playing/serving will redraw on next frame
      };

      canvas.addEventListener('mousemove', _onMouseMove);
      canvas.addEventListener('touchmove', _onTouchMove, { passive: false });
      canvas.addEventListener('click', _onCanvasClick);
      window.addEventListener('resize', _onResize);
    }, 50);
  }

  function destroy() {
    stopLoop();
    if (canvas) {
      if (_onMouseMove) canvas.removeEventListener('mousemove', _onMouseMove);
      if (_onTouchMove) canvas.removeEventListener('touchmove', _onTouchMove);
      if (_onCanvasClick) canvas.removeEventListener('click', _onCanvasClick);
    }
    if (_onResize) window.removeEventListener('resize', _onResize);
    _onMouseMove = null;
    _onTouchMove = null;
    _onCanvasClick = null;
    _onResize = null;
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

  function serve() {
    state = 'serving';
    ballDX = 0;
    ballDY = 0;
  }

  function launchBall() {
    const offset = (Math.random() - 0.5) * 0.6;
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
    if (state === 'serving') {
      ballX = paddleX + PADDLE_W / 2;
      ballY = PADDLE_Y - BALL_R - 1;
      return;
    }

    const steps = Math.max(1, Math.ceil(speed / BALL_R));
    const stepDX = ballDX / steps;
    const stepDY = ballDY / steps;

    for (let s = 0; s < steps; s++) {
      ballX += stepDX;
      ballY += stepDY;

      // Wall collisions
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

      // Paddle collision
      if (ballDY > 0 &&
          ballY + BALL_R >= PADDLE_Y &&
          ballY + BALL_R <= PADDLE_Y + PADDLE_H + 2 &&
          ballX + BALL_R > paddleX &&
          ballX - BALL_R < paddleX + PADDLE_W) {
        ballY = PADDLE_Y - BALL_R;

        const center = paddleX + PADDLE_W / 2;
        let hit = (ballX - center) / (PADDLE_W / 2);
        hit = Math.max(-1, Math.min(1, hit));

        const maxAngle = Math.PI / 3;
        const angle = hit * maxAngle;
        ballDX = speed * Math.sin(angle);
        ballDY = -speed * Math.cos(angle);
      }

      // Ball fell below paddle
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

      // Brick collisions
      if (checkBrickCollisions()) {
        if (state === 'won') return;
      }
    }
  }

  function checkBrickCollisions() {
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks[r][c];
        if (!b.alive) continue;

        const bx = BRICK_LEFT + c * (BRICK_W + BRICK_PAD);
        const by = BRICK_TOP + r * (BRICK_H + BRICK_PAD);

        const closestX = Math.max(bx, Math.min(ballX, bx + BRICK_W));
        const closestY = Math.max(by, Math.min(ballY, by + BRICK_H));
        const dx = ballX - closestX;
        const dy = ballY - closestY;

        if (dx * dx + dy * dy < BALL_R * BALL_R) {
          b.alive = false;
          score += 10;

          speed = Math.min(MAX_SPEED, speed + 0.04);

          const prevX = ballX - ballDX / Math.max(1, Math.ceil(speed / BALL_R));
          const prevY = ballY - ballDY / Math.max(1, Math.ceil(speed / BALL_R));

          const fromLeft   = prevX < bx;
          const fromRight  = prevX > bx + BRICK_W;
          const fromTop    = prevY < by;
          const fromBottom = prevY > by + BRICK_H;

          if (fromLeft || fromRight) {
            ballDX = -ballDX;
            ballX = fromLeft ? bx - BALL_R : bx + BRICK_W + BALL_R;
          } else if (fromTop || fromBottom) {
            ballDY = -ballDY;
            ballY = fromTop ? by - BALL_R : by + BRICK_H + BALL_R;
          } else {
            ballDX = -ballDX;
            ballDY = -ballDY;
          }

          const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
          if (mag > 0) {
            ballDX = (ballDX / mag) * speed;
            ballDY = (ballDY / mag) * speed;
          }

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
          return true;
        }
      }
    }
    return false;
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
    if (score > 0) {
      const label = won ? 'Breakout: cleared all bricks!' : 'Breakout: scored ' + score;
      OS.awardCoins(Math.max(1, Math.floor(score / 10)), 'breakout', '🧱', label);
    }
    updateUI();
    if (won) drawWinScreen();
    else drawDeadScreen();
  }

  /* ---- Drawing ---- */

  function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    drawBricks();
    drawPaddle();
    drawBall();

    if (state === 'serving') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click to launch!', W / 2, PADDLE_Y - 36);
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
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(bx + 2, by + 2, BRICK_W - 4, Math.max(2, BRICK_H * 0.2));
      }
    }
  }

  function drawPaddle() {
    ctx.fillStyle = '#5b8cff';
    roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(paddleX + 4, PADDLE_Y + 2, PADDLE_W - 8, Math.max(2, PADDLE_H * 0.25));
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

  function drawOverlayPanel(borderColor, titleColor, title) {
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e2a3a';
    roundRect(W / 2 - 140, H / 2 - 80, 280, 160, 12);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(title, W / 2, H / 2 - 40);

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

  function drawDeadScreen() { drawOverlayPanel('#ff4757', '#ff4757', 'Game Over!'); }
  function drawWinScreen()  { drawOverlayPanel('#2ed573', '#2ed573', 'You Win!'); }

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
