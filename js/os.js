/* ===== KidsOS Core ===== */
const OS = (() => {
  const VERSION = '0.6.2';
  const UPDATE_URL = (typeof KIDSOS_CONFIG !== 'undefined' && KIDSOS_CONFIG.updateURL) || 'http://localhost:5555';

  let zCounter = 100;
  let windowMap = {};     // id -> { el, taskbarBtn, app }
  let focusHistory = [];  // ordered list of window ids, most recent last
  let settings = {
    username: 'KidsUser',
    wallpaper: '0',
    theme: 'light',
    accentColor: '#5b8cff',
    timeOffset: 0,       // minutes offset from real time
    dateOverride: null,
  };
  let clockInterval = null;

  /* ---- Standalone / PWA detection ---- */
  function isStandalone() {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches;
  }

  /* ---- Boot ---- */
  function boot() {
    loadSettings();
    applyTheme();
    applyWallpaper();
    updateMenuUsername();
    // Add body class when running as installed PWA
    if (isStandalone()) document.body.classList.add('standalone');

    const bar = document.getElementById('boot-bar');
    const screen = document.getElementById('boot-screen');
    let w = 0;
    const iv = setInterval(() => {
      w += Math.random() * 15 + 5;
      if (w >= 100) { w = 100; clearInterval(iv); }
      bar.style.width = w + '%';
      if (w >= 100) {
        setTimeout(() => {
          screen.classList.add('fade-out');
          setTimeout(() => screen.style.display = 'none', 900);
        }, 400);
      }
    }, 120);

    startClock();
  }

  /* ---- Clock ---- */
  function startClock() {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + (settings.timeOffset || 0));
    if (settings.dateOverride) {
      const [y,m,d] = settings.dateOverride.split('-');
      now.setFullYear(+y, +m - 1, +d);
    }
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    if (dateEl) {
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      dateEl.textContent = `${days[now.getDay()]} ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]}`;
    }
  }

  /* ---- App Menu ---- */
  function toggleAppMenu() {
    const m = document.getElementById('app-menu');
    m.classList.toggle('hidden');
  }

  /* ---- Window Manager ---- */
  function createWindow(opts) {
    // opts: { id, title, icon, content, width, height, x, y, app }
    const id = opts.id || ('win_' + Date.now());
    if (windowMap[id]) { focusWindow(id); return id; }

    const win = document.createElement('div');
    win.className = 'window';
    win.id = 'window_' + id;
    win.style.cssText = `
      width:${opts.width||480}px; height:${opts.height||360}px;
      left:${opts.x || (80 + Object.keys(windowMap).length * 24)}px;
      top:${opts.y || (40 + Object.keys(windowMap).length * 24)}px;
      z-index:${++zCounter};
    `;

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <span class="win-title-icon">${opts.icon||'🪟'}</span> ${opts.title||'Window'}
        </div>
        <div class="win-controls">
          <button class="win-btn minimize" title="Minimize" onclick="OS.minimizeWindow('${id}')">─</button>
          <button class="win-btn maximize" title="Maximize" onclick="OS.toggleMaximize('${id}')">□</button>
          <button class="win-btn close" title="Close" onclick="OS.closeWindow('${id}')">✕</button>
        </div>
      </div>
      <div class="win-body" id="win-body-${id}">${opts.content||''}</div>
      <div class="win-resize" title="Resize"></div>
    `;

    document.getElementById('windows-container').appendChild(win);
    makeDraggable(win, id);
    makeResizable(win, id);
    win.addEventListener('mousedown', () => focusWindow(id), true);
    win.addEventListener('touchstart', () => focusWindow(id), { capture: true, passive: true });

    // Taskbar button
    const btn = document.createElement('button');
    btn.className = 'taskbar-app-btn active';
    btn.innerHTML = `<span class="tbtn-icon">${opts.icon||''}</span><span class="tbtn-title">${opts.title||'App'}</span>`;
    btn.id = 'tbtn_' + id;
    btn.onclick = () => {
      if (win.classList.contains('minimized')) {
        restoreWindow(id);
      } else if (isWindowFocused(id)) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    };
    document.getElementById('taskbar-center').appendChild(btn);

    windowMap[id] = { el: win, taskbarBtn: btn, app: opts.app, maximized: false, prevRect: null };
    focusWindow(id);

    // Auto-maximize on tablets and phones
    if (window.innerWidth <= 1024) toggleMaximize(id);

    if (opts.app && opts.app.onOpen) opts.app.onOpen(id);
    return id;
  }

  function focusWindow(id) {
    Object.keys(windowMap).forEach(wid => {
      const w = windowMap[wid];
      w.el.classList.remove('focused');
      w.taskbarBtn.classList.remove('active');
    });
    const w = windowMap[id];
    if (!w) return;
    w.el.classList.add('focused');
    w.el.style.zIndex = ++zCounter;
    w.taskbarBtn.classList.add('active');
    w.taskbarBtn.classList.remove('minimized');
    // Update focus history
    focusHistory = focusHistory.filter(wid => wid !== id);
    focusHistory.push(id);
  }

  function isWindowFocused(id) {
    return windowMap[id] && windowMap[id].el.classList.contains('focused');
  }

  function closeWindow(id) {
    const w = windowMap[id];
    if (!w) return;
    if (w.app && w.app.onClose) w.app.onClose(id);
    w.el.remove();
    w.taskbarBtn.remove();
    delete windowMap[id];
    focusHistory = focusHistory.filter(wid => wid !== id);
    // Auto-focus previous window in history
    if (focusHistory.length > 0) {
      focusWindow(focusHistory[focusHistory.length - 1]);
    }
  }

  function minimizeWindow(id) {
    const w = windowMap[id];
    if (!w) return;
    w.el.classList.add('minimized');
    w.taskbarBtn.classList.add('minimized');
    w.taskbarBtn.classList.remove('active');
  }

  function restoreWindow(id) {
    const w = windowMap[id];
    if (!w) return;
    w.el.classList.remove('minimized');
    focusWindow(id);
  }

  function toggleMaximize(id) {
    const w = windowMap[id];
    if (!w) return;
    if (w.maximized) {
      const r = w.prevRect;
      w.el.style.cssText += `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
      w.el.classList.remove('maximized');
      w.maximized = false;
    } else {
      w.prevRect = {
        left: parseInt(w.el.style.left),
        top: parseInt(w.el.style.top),
        width: parseInt(w.el.style.width),
        height: parseInt(w.el.style.height),
      };
      w.el.classList.add('maximized');
      w.maximized = true;
    }
  }

  /* ---- Drag ---- */
  function makeDraggable(win, id) {
    const bar = win.querySelector('.win-titlebar');
    let ox, oy, dragging = false;

    function startDrag(cx, cy) {
      const w = windowMap[id];
      if (w && w.maximized) return;
      dragging = true;
      ox = cx - win.offsetLeft;
      oy = cy - win.offsetTop;
    }
    function doDrag(cx, cy) {
      if (!dragging) return;
      const container = document.getElementById('windows-container');
      const maxX = container.clientWidth - win.offsetWidth;
      const maxY = container.clientHeight - win.offsetHeight;
      win.style.left = Math.max(0, Math.min(maxX, cx - ox)) + 'px';
      win.style.top  = Math.max(0, Math.min(maxY, cy - oy)) + 'px';
    }

    bar.addEventListener('mousedown', e => {
      if (e.target.closest('.win-btn')) return;
      startDrag(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => doDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { dragging = false; });

    bar.addEventListener('touchstart', e => {
      if (e.target.closest('.win-btn')) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      doDrag(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { dragging = false; });
  }

  /* ---- Resize ---- */
  function makeResizable(win, id) {
    const handle = win.querySelector('.win-resize');
    let resizing = false, startX, startY, startW, startH;

    function startResize(cx, cy) {
      resizing = true;
      startX = cx; startY = cy;
      startW = win.offsetWidth; startH = win.offsetHeight;
    }
    function doResize(cx, cy) {
      if (!resizing) return;
      win.style.width  = Math.max(300, startW + cx - startX) + 'px';
      win.style.height = Math.max(200, startH + cy - startY) + 'px';
    }

    handle.addEventListener('mousedown', e => {
      startResize(e.clientX, e.clientY);
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener('mousemove', e => doResize(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { resizing = false; });

    handle.addEventListener('touchstart', e => {
      const t = e.touches[0];
      startResize(t.clientX, t.clientY);
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
    document.addEventListener('touchmove', e => {
      if (!resizing) return;
      doResize(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { resizing = false; });
  }

  /* ---- App Launcher ---- */
  const apps = {};

  function registerApp(name, appObj) {
    apps[name] = appObj;
  }

  function launch(name) {
    const app = apps[name];
    if (!app) { console.warn('Unknown app:', name); return; }

    // Allow multiple instances for some apps
    const singleInstance = app.singleInstance !== false;
    if (singleInstance) {
      const existing = Object.values(windowMap).find(w => w.app === app);
      if (existing) {
        const wid = Object.keys(windowMap).find(k => windowMap[k] === existing);
        if (windowMap[wid].el.classList.contains('minimized')) {
          restoreWindow(wid);
        } else {
          focusWindow(wid);
        }
        return;
      }
    }

    const opts = app.getWindowOpts();
    opts.app = app;
    return createWindow(opts);
  }

  /* ---- Settings Persistence ---- */
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('kidsOS_settings') || '{}');
      Object.assign(settings, s);
    } catch(e) {}
  }

  function saveSettings(newSettings) {
    Object.assign(settings, newSettings);
    localStorage.setItem('kidsOS_settings', JSON.stringify(settings));
    applyTheme();
    applyWallpaper();
    updateMenuUsername();
  }

  function getSettings() { return settings; }

  const WALLPAPERS = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0d7377 0%, #14a085 50%, #0d7377 100%)',
    'linear-gradient(135deg, #4a0e8f 0%, #9b3dca 50%, #e040fb 100%)',
    'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #40916c 100%)',
    'linear-gradient(135deg, #7b2d8b 0%, #d63384 50%, #fd7e14 100%)',
    'linear-gradient(135deg, #003566 0%, #0077b6 50%, #00b4d8 100%)',
    'linear-gradient(135deg, #1b1b1b 0%, #3d3d3d 50%, #1b1b1b 100%)',
    'linear-gradient(135deg, #f72585 0%, #7209b7 30%, #3a0ca3 60%, #4361ee 100%)',
    'linear-gradient(135deg, #f77f00 0%, #fcbf49 50%, #eae2b7 100%)',
  ];

  const ACCENT_COLORS = [
    { name: 'Blue',   hex: '#5b8cff' },
    { name: 'Green',  hex: '#4caf50' },
    { name: 'Purple', hex: '#9c27b0' },
    { name: 'Orange', hex: '#ff9800' },
    { name: 'Pink',   hex: '#e91e8c' },
    { name: 'Teal',   hex: '#009688' },
  ];

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    document.documentElement.style.setProperty('--accent', settings.accentColor || '#5b8cff');
  }

  function applyWallpaper(idx) {
    const i = idx !== undefined ? idx : (settings.wallpaper || 0);
    document.getElementById('desktop').style.background = WALLPAPERS[i] || WALLPAPERS[0];
    settings.wallpaper = String(i);
  }

  function getWallpapers() { return WALLPAPERS; }

  function updateMenuUsername() {
    const el = document.getElementById('menu-username');
    if (el) el.textContent = '👤 ' + (settings.username || 'User');
  }

  /* ---- Shutdown ---- */
  function shutdown() {
    let overlay = document.getElementById('shutdown-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'shutdown-overlay';
      overlay.innerHTML = '⏻ Shutting down KidsOS...';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
    setTimeout(() => {
      overlay.innerHTML = '😴 Goodbye!<br><small style="font-size:18px;color:#888">Refresh the page to restart</small>';
    }, 1500);
  }

  /* ---- Context Menu utility ---- */
  function showContextMenu(items, x, y) {
    removeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.id = 'os-ctx-menu';
    menu.style.cssText = `left:${x}px;top:${y}px`;
    items.forEach(item => {
      if (item === 'sep') {
        const s = document.createElement('div');
        s.className = 'context-menu-sep';
        menu.appendChild(s);
      } else {
        const el = document.createElement('div');
        el.className = 'context-menu-item';
        el.innerHTML = `<span>${item.icon||''}</span> ${item.label}`;
        el.onclick = () => { removeContextMenu(); item.action(); };
        menu.appendChild(el);
      }
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', removeContextMenu, {once:true}), 10);
  }

  function removeContextMenu() {
    const m = document.getElementById('os-ctx-menu');
    if (m) m.remove();
  }

  /* ---- Close app menu on outside click ---- */
  document.addEventListener('click', e => {
    if (!e.target.closest('#app-menu') && !e.target.closest('#app-menu-btn')) {
      document.getElementById('app-menu').classList.add('hidden');
    }
  });

  /* ---- Factory Reset ---- */
  const STORAGE_KEYS = [
    'kidsOS_settings',
    'kidsOS_fs',
    'kidsOS_chat',
    'kidsOS_snakeHi',
    'kidsOS_kidstagram',
    'kidsOS_snackdash',
    'kidsOS_ejobHi',
  ];

  function getStorageUsage() {
    let total = 0;
    const breakdown = {};
    STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      const bytes = val ? new Blob([val]).size : 0;
      breakdown[key] = bytes;
      total += bytes;
    });
    return { total, breakdown };
  }

  function factoryReset() {
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    // Reset in-memory settings to defaults
    Object.assign(settings, {
      username: 'KidsUser',
      wallpaper: '0',
      theme: 'light',
      accentColor: '#5b8cff',
      timeOffset: 0,
      dateOverride: null,
    });
    applyTheme();
    applyWallpaper(0);
    updateMenuUsername();
  }

  return {
    boot, launch, registerApp,
    createWindow, closeWindow, minimizeWindow, restoreWindow, toggleMaximize, focusWindow,
    toggleAppMenu, shutdown,
    saveSettings, loadSettings, getSettings, applyWallpaper, getWallpapers,
    showContextMenu, removeContextMenu,
    updateMenuUsername,
    getStorageUsage, factoryReset, STORAGE_KEYS, isStandalone,
    applyTheme, ACCENT_COLORS,
    VERSION, UPDATE_URL,
  };
})();
