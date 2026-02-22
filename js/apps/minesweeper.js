/* ===== Minesweeper (Kids Edition) ===== */
OS.registerApp('minesweeper', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'minesweeper',
      title: 'Minesweeper',
      icon: '💣',
      width: 430,
      height: 530,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div style="display:flex;flex-direction:column;align-items:center;height:100%;
                padding:12px 10px;gap:8px;background:#d4d0c8;overflow-y:auto;font-family:sans-serif;">

      <!-- Header: mine counter | restart | timer -->
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;
                  background:#d4d0c8;border:3px solid;border-color:#808080 #fff #fff #808080;padding:6px 10px;border-radius:3px;">
        <div id="ms-mines" style="font-size:20px;font-weight:700;color:#cc0000;
             background:#000;padding:3px 10px;border-radius:3px;min-width:64px;text-align:center;
             font-family:'Courier New',monospace;">💣 8</div>
        <button id="ms-face" onclick="MS.restart()"
                style="font-size:26px;width:42px;height:42px;background:#d4d0c8;cursor:pointer;
                       border:3px solid;border-color:#fff #808080 #808080 #fff;border-radius:3px;">😊</button>
        <div id="ms-time" style="font-size:20px;font-weight:700;color:#cc0000;
             background:#000;padding:3px 10px;border-radius:3px;min-width:64px;text-align:center;
             font-family:'Courier New',monospace;">⏱ 0</div>
      </div>

      <!-- Difficulty -->
      <div style="display:flex;gap:6px;">
        <button class="ms-dbtn active" onclick="MS.setDiff('easy',this)">🌱 Easy</button>
        <button class="ms-dbtn"        onclick="MS.setDiff('medium',this)">🌿 Medium</button>
        <button class="ms-dbtn"        onclick="MS.setDiff('hard',this)">🌳 Hard</button>
      </div>

      <!-- Flag mode -->
      <div style="display:flex;align-items:center;gap:10px;">
        <button id="ms-mode-btn" onclick="MS.toggleMode()"
                style="padding:5px 14px;border-radius:20px;border:none;background:#5b8cff;
                       color:#fff;cursor:pointer;font-size:13px;font-weight:600;">🔍 Reveal Mode</button>
        <span style="font-size:11px;color:#555;">Right-click = flag</span>
      </div>

      <!-- Board -->
      <div id="ms-board-wrap"
           style="border:3px solid;border-color:#808080 #fff #fff #808080;background:#bdbdbd;padding:3px;"></div>

      <!-- Status message -->
      <div id="ms-msg" style="font-size:16px;font-weight:700;color:#333;min-height:22px;text-align:center;"></div>
    </div>`;
  },

  onOpen() { MS.init(); },
  onClose() { MS.destroy(); },
});

/* ===================== Game Logic ===================== */
const MS = (() => {
  const CONFIGS = {
    easy:   { cols: 9,  rows: 9,  mines: 10, cell: 36 },
    medium: { cols: 12, rows: 10, mines: 18, cell: 32 },
    hard:   { cols: 15, rows: 10, mines: 28, cell: 28 },
  };
  const COLORS = ['','#1565c0','#2e7d32','#c62828','#1a237e','#6a1b9a','#00695c','#212121','#757575'];

  let cfg, grid, deathCell;
  let minesLeft, elapsed, timerID, firstClick, gameOver;
  let flagMode = false;
  let diff = 'easy';

  /* ---------- lifecycle ---------- */

  function init() {
    setTimeout(() => { flagMode = false; newGame(); }, 40);
  }

  function destroy() {
    clearInterval(timerID);
  }

  function restart() { newGame(); }

  function setDiff(d, btn) {
    diff = d;
    document.querySelectorAll('.ms-dbtn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    newGame();
  }

  function toggleMode() {
    flagMode = !flagMode;
    const btn = document.getElementById('ms-mode-btn');
    if (btn) {
      btn.textContent   = flagMode ? '🚩 Flag Mode' : '🔍 Reveal Mode';
      btn.style.background = flagMode ? '#ff7c5b' : '#5b8cff';
    }
  }

  /* ---------- new game ---------- */

  function newGame() {
    clearInterval(timerID);
    cfg = CONFIGS[diff];
    elapsed = 0; firstClick = true; gameOver = false;
    minesLeft = cfg.mines; deathCell = null;
    flagMode = false;

    // reset flag button
    const modeBtn = document.getElementById('ms-mode-btn');
    if (modeBtn) { modeBtn.textContent = '🔍 Reveal Mode'; modeBtn.style.background = '#5b8cff'; }

    // Build empty grid
    grid = [];
    for (let r = 0; r < cfg.rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cfg.cols; c++) {
        grid[r][c] = { mine: false, revealed: false, flagged: false, adj: 0 };
      }
    }

    setFace('😊');
    setMsg('');
    setMines(cfg.mines);
    setTime(0);
    buildTable();
  }

  /* ---------- mine placement ---------- */

  function placeMines(skipR, skipC) {
    // Safe zone: clicked cell + all 8 neighbours
    const safe = new Set();
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = skipR+dr, nc = skipC+dc;
        if (inBounds(nr,nc)) safe.add(nr+','+nc);
      }

    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      if (!grid[r][c].mine && !safe.has(r+','+c)) {
        grid[r][c].mine = true;
        placed++;
      }
    }

    // Calc adjacency numbers
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        if (!grid[r][c].mine)
          grid[r][c].adj = countAdj(r, c);
  }

  function countAdj(r, c) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if ((dr||dc) && inBounds(r+dr,c+dc) && grid[r+dr][c+dc].mine) n++;
    return n;
  }

  function inBounds(r, c) {
    return r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols;
  }

  /* ---------- actions ---------- */

  function clickCell(r, c) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      startTimer();
    }

    if (cell.mine) {
      cell.revealed = true;
      deathCell = {r, c};
      endGame(false);
      return;
    }

    floodReveal(r, c);
    renderAll();
    if (checkWin()) endGame(true);
  }

  function flagCell(r, c) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    minesLeft += cell.flagged ? -1 : 1;
    setMines(minesLeft);
    renderCell(r, c);
  }

  function chordCell(r, c) {
    const cell = grid[r][c];
    if (!cell.revealed || cell.adj === 0) return;
    // Count flags around
    let flags = 0;
    for (let dr=-1;dr<=1;dr++)
      for (let dc=-1;dc<=1;dc++)
        if ((dr||dc) && inBounds(r+dr,c+dc) && grid[r+dr][c+dc].flagged) flags++;
    if (flags !== cell.adj) return;
    // Reveal all unflagged neighbours
    let hitMine = false;
    for (let dr=-1;dr<=1;dr++) {
      for (let dc=-1;dc<=1;dc++) {
        if (!(dr||dc)) continue;
        const nr=r+dr, nc=c+dc;
        if (!inBounds(nr,nc)) continue;
        const n = grid[nr][nc];
        if (!n.flagged && !n.revealed) {
          if (n.mine) { n.revealed=true; deathCell={r:nr,c:nc}; hitMine=true; }
          else floodReveal(nr,nc);
        }
      }
    }
    renderAll();
    if (hitMine) endGame(false);
    else if (checkWin()) endGame(true);
  }

  function floodReveal(r, c) {
    if (!inBounds(r,c)) return;
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged || cell.mine) return;
    cell.revealed = true;
    if (cell.adj === 0)
      for (let dr=-1;dr<=1;dr++)
        for (let dc=-1;dc<=1;dc++)
          if (dr||dc) floodReveal(r+dr, c+dc);
  }

  /* ---------- win / lose ---------- */

  function checkWin() {
    for (let r=0;r<cfg.rows;r++)
      for (let c=0;c<cfg.cols;c++)
        if (!grid[r][c].mine && !grid[r][c].revealed) return false;
    return true;
  }

  function endGame(won) {
    gameOver = true;
    clearInterval(timerID);
    if (won) {
      setFace('🥳');
      // Auto-flag all mines
      for (let r=0;r<cfg.rows;r++)
        for (let c=0;c<cfg.cols;c++)
          if (grid[r][c].mine) grid[r][c].flagged = true;
      setMines(0);
      setMsg('🎉 You won in ' + elapsed + 's! Great job!');
    } else {
      setFace('😵');
      // Reveal all mines
      for (let r=0;r<cfg.rows;r++)
        for (let c=0;c<cfg.cols;c++)
          if (grid[r][c].mine) grid[r][c].revealed = true;
      setMsg('💥 Boom! Try again! Click 😊 to restart.');
    }
    renderAll();
  }

  /* ---------- rendering ---------- */

  function buildTable() {
    const wrap = document.getElementById('ms-board-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:separate;border-spacing:2px;';

    // Event delegation — one handler on the whole table
    table.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      const r = +td.dataset.r, c = +td.dataset.c;
      if (flagMode) flagCell(r, c);
      else clickCell(r, c);
    });

    // Double-click chord (mouse)
    table.addEventListener('dblclick', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      chordCell(+td.dataset.r, +td.dataset.c);
    });

    // Long-press chord (touch)
    let chordTimer = null;
    table.addEventListener('touchstart', (e) => {
      const td = e.target.closest('td');
      if (!td || flagMode) return;
      chordTimer = setTimeout(() => {
        chordTimer = null;
        chordCell(+td.dataset.r, +td.dataset.c);
      }, 500);
    }, { passive: true });
    table.addEventListener('touchend', () => { clearTimeout(chordTimer); chordTimer = null; });
    table.addEventListener('touchcancel', () => { clearTimeout(chordTimer); chordTimer = null; });

    table.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const td = e.target.closest('td');
      if (!td) return;
      flagCell(+td.dataset.r, +td.dataset.c);
    });

    const tbody = document.createElement('tbody');
    for (let r = 0; r < cfg.rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cfg.cols; c++) {
        const td = document.createElement('td');
        td.dataset.r = r;
        td.dataset.c = c;
        td.id = `ms-${r}-${c}`;
        styleCell(td, r, c);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function styleCell(td, r, c) {
    const cell = grid[r][c];
    const sz = cfg.cell;
    const isDeath = deathCell && deathCell.r===r && deathCell.c===c;

    let bg, border, text = '', color = '#333';

    if (!cell.revealed) {
      // Hidden or flagged
      bg = '#d4d0c8';
      border = '3px solid; border-color:#ffffff #808080 #808080 #ffffff';
      if (cell.flagged) { text = '🚩'; }
    } else {
      // Revealed
      bg = isDeath ? '#ff4444' : '#c0c0c0';
      border = '1px solid #999';
      if (cell.mine) {
        text = isDeath ? '💥' : '💣';
      } else if (cell.adj > 0) {
        text = String(cell.adj);
        color = COLORS[cell.adj] || '#333';
      }
    }

    td.style.cssText = `
      width:${sz}px; height:${sz}px; min-width:${sz}px;
      text-align:center; vertical-align:middle;
      font-size:${Math.round(sz*0.52)}px; font-weight:700;
      cursor:pointer; user-select:none;
      background:${bg}; color:${color};
      border:${border};
      border-radius:2px;
    `;
    td.textContent = text;
  }

  function renderCell(r, c) {
    const td = document.getElementById(`ms-${r}-${c}`);
    if (td) styleCell(td, r, c);
  }

  function renderAll() {
    for (let r=0;r<cfg.rows;r++)
      for (let c=0;c<cfg.cols;c++)
        renderCell(r, c);
  }

  /* ---------- timer ---------- */

  function startTimer() {
    clearInterval(timerID);
    timerID = setInterval(() => { elapsed++; setTime(elapsed); }, 1000);
  }

  /* ---------- UI helpers ---------- */

  function setFace(e) { const el=document.getElementById('ms-face'); if(el) el.textContent=e; }
  function setMsg(m)  { const el=document.getElementById('ms-msg');  if(el) el.textContent=m; }
  function setMines(n){ const el=document.getElementById('ms-mines'); if(el) el.textContent='💣 '+n; }
  function setTime(s) { const el=document.getElementById('ms-time');  if(el) el.textContent='⏱ '+s; }

  return { init, destroy, restart, setDiff, toggleMode };
})();
