/* ===== Snake Game ===== */
OS.registerApp('snake', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'snake',
      title: 'Snake',
      icon: '🐍',
      width: 440,
      height: 500,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="snake-wrap">
      <div class="snake-score">
        Score: <span id="snake-score">0</span>
        &nbsp;&nbsp; Best: <span id="snake-hi">0</span>
      </div>
      <canvas id="snake-canvas" width="400" height="400"
              style="display:block;cursor:pointer;"
              onclick="SnakeApp.handleClick()"></canvas>
      <div class="snake-instructions">Arrow Keys / WASD to move</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:4px">
        <button class="snake-btn" onclick="SnakeApp.handleClick()">▶ Play / Restart</button>
        <button class="snake-btn" onclick="SnakeApp.changeDir(0,-1)">▲</button>
        <button class="snake-btn" onclick="SnakeApp.changeDir(-1,0)">◀</button>
        <button class="snake-btn" onclick="SnakeApp.changeDir(0,1)">▼</button>
        <button class="snake-btn" onclick="SnakeApp.changeDir(1,0)">▶</button>
      </div>
    </div>`;
  },

  onOpen() { SnakeApp.init(); },
  onClose() { SnakeApp.destroy(); },
});

const SnakeApp = (() => {
  const CELL = 20;
  const COLS = 20;
  const ROWS = 20;

  let canvas, ctx;
  let state = 'idle'; // 'idle' | 'playing' | 'dead'
  let snake, food, dir, nextDir;
  let score, hiScore;
  let ticker = null;
  let _onKey = null;

  /* ---- Init / Destroy ---- */

  function init() {
    setTimeout(() => {
      canvas = document.getElementById('snake-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      hiScore = parseInt(localStorage.getItem('kidsOS_snakeHi') || '0');
      state = 'idle';
      drawIdleScreen();

      _onKey = (e) => {
        const map = {
          ArrowLeft: [-1,0], ArrowRight: [1,0],
          ArrowUp:   [0,-1], ArrowDown:  [0,1],
          a:[-1,0], d:[1,0], w:[0,-1], s:[0,1],
          A:[-1,0], D:[1,0], W:[0,-1], S:[0,1],
        };
        if (map[e.key]) {
          e.preventDefault();
          if (state === 'idle' || state === 'dead') {
            startGame();
          } else if (state === 'playing') {
            const [dx, dy] = map[e.key];
            if (dx !== -dir[0] || dy !== -dir[1]) nextDir = [dx, dy];
          }
        }
      };
      document.addEventListener('keydown', _onKey);
    }, 50);
  }

  function destroy() {
    stopTicker();
    if (_onKey) { document.removeEventListener('keydown', _onKey); _onKey = null; }
    canvas = null; ctx = null;
  }

  /* ---- Public controls ---- */

  function handleClick() {
    if (state === 'idle' || state === 'dead') startGame();
  }

  function changeDir(dx, dy) {
    if (state === 'idle' || state === 'dead') { startGame(); return; }
    if (state === 'playing' && (dx !== -dir[0] || dy !== -dir[1])) nextDir = [dx, dy];
  }

  /* ---- Game lifecycle ---- */

  function startGame() {
    stopTicker();
    score = 0;
    snake = [
      { x: 10, y: 10 },
      { x:  9, y: 10 },
      { x:  8, y: 10 },
    ];
    dir    = [1, 0];
    nextDir = [1, 0];
    placeFood();
    updateScoreUI();
    state = 'playing';
    ticker = setInterval(tick, 130);
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame(); return;
    }
    // Self collision (skip tail tip since it moves away)
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) { endGame(); return; }
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      updateScoreUI();
      placeFood();
    } else {
      snake.pop();
    }

    drawGame();
  }

  function endGame() {
    stopTicker();
    state = 'dead';
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem('kidsOS_snakeHi', hiScore);
      updateScoreUI();
    }
    drawDeadScreen();
  }

  /* ---- Food ---- */

  function placeFood() {
    let pos;
    let tries = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      tries++;
    } while (tries < 200 && snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  /* ---- Drawing ---- */

  function clearCanvas() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(canvas.width, y * CELL);
      ctx.stroke();
    }
  }

  function drawFood() {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const r  = CELL / 2 - 2;

    // Red circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3b3b';
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // Stem
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - r);
    ctx.lineTo(cx + 4, cy - r - 4);
    ctx.strokeStyle = '#4a7c2f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawSnake() {
    snake.forEach((seg, i) => {
      const x = seg.x * CELL + 1;
      const y = seg.y * CELL + 1;
      const w = CELL - 2;
      const h = CELL - 2;

      if (i === 0) {
        // Head — bright blue
        ctx.fillStyle = '#4fc3f7';
      } else {
        // Body — gradient from green to darker green
        const t = 1 - i / snake.length;
        const lightness = 30 + t * 20;
        ctx.fillStyle = `hsl(130, 70%, ${lightness}%)`;
      }

      roundRect(x, y, w, h, i === 0 ? 5 : 3);
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.fillStyle = '#fff';
        const [ex1, ey1, ex2, ey2] = eyePos(seg, dir);
        ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(ex1 + dir[0], ey1 + dir[1], 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2 + dir[0], ey2 + dir[1], 1.2, 0, Math.PI*2); ctx.fill();
      }
    });
  }

  function eyePos(seg, d) {
    const cx = seg.x * CELL + CELL / 2;
    const cy = seg.y * CELL + CELL / 2;
    const off = 3;
    if (d[0] === 1)  return [cx+3, cy-off, cx+3, cy+off]; // right
    if (d[0] === -1) return [cx-3, cy-off, cx-3, cy+off]; // left
    if (d[1] === -1) return [cx-off, cy-3, cx+off, cy-3]; // up
    return [cx-off, cy+3, cx+off, cy+3]; // down
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
  }

  function drawGame() {
    clearCanvas();
    drawGrid();
    drawFood();
    drawSnake();
  }

  function drawIdleScreen() {
    clearCanvas();
    drawGrid();

    // Title
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐍 SNAKE', canvas.width / 2, canvas.height / 2 - 50);

    // Play prompt
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Click Play or press any arrow key', canvas.width / 2, canvas.height / 2 + 10);

    // High score
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Best: ${hiScore}`, canvas.width / 2, canvas.height / 2 + 45);
  }

  function drawDeadScreen() {
    // Draw the last game state dimmed
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel
    ctx.fillStyle = '#1e2a3a';
    roundRect(canvas.width/2 - 140, canvas.height/2 - 80, 280, 160, 12);
    ctx.fill();
    ctx.strokeStyle = '#ff3b3b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#ffbd2e';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Best: ${hiScore}`, canvas.width / 2, canvas.height / 2 + 28);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click Play or press arrow to restart', canvas.width / 2, canvas.height / 2 + 58);
  }

  /* ---- Score UI ---- */

  function updateScoreUI() {
    const s = document.getElementById('snake-score');
    const h = document.getElementById('snake-hi');
    if (s) s.textContent = score;
    if (h) h.textContent = hiScore;
  }

  return { init, destroy, handleClick, changeDir };
})();
