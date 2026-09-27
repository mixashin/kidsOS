/* ===== KidsOS Core ===== */
const OS = (() => {
  // version.json is the only place the version number lives. Loaded at boot.
  let version = 'dev';

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
           window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
  }

  /* ---- Boot ---- */
  function boot() {
    loadSettings();
    applyTheme();
    applyWallpaper();
    updateMenuUsername();
    renderLauncher();
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
    initBackButton();
    loadVersion();
    initServiceWorker();
  }

  function loadVersion() {
    return fetch('version.json').then(res => res.json()).then(v => { version = v.version; }).catch(() => {});
  }

  /* ---- Updates ---- */
  // The service worker downloads a new release in the background. When the download
  // is complete, a popup shows. "Update" switches to the new release and reloads.
  // No pressure wording here: children must not learn to press urgent prompts.
  const UPDATE_MESSAGES = [
    { title: '🐧 Penguin Express Delivery!', body: 'A shiny new version of KidsOS just waddled in! The penguin will wait until you are ready.' },
    { title: '🚀 Houston, We Have an Update!', body: 'Mission Control has detected a newer version of KidsOS orbiting nearby. Initiate download sequence?' },
    { title: '🍪 Fresh Cookies from the Oven!', body: 'A fresh batch of KidsOS improvements just came out of the oven. They stay warm until you are ready!' },
    { title: '🦄 Unicorn Update Available!', body: 'A magical unicorn galloped by and dropped off a new version of KidsOS. The sparkles will wait for you!' },
    { title: '🎁 Surprise Package!', body: 'The KidsOS elves have been working overtime! A brand new update is wrapped up and ready for you!' },
    { title: '🧙 Wizard Update Detected!', body: 'The update wizard has conjured a new spell — er, version! Wave your wand (click the button) to apply it!' },
    { title: '🐸 Ribbit! New Version!', body: 'A little frog just hopped in with a new KidsOS update on its back. Kiss the button to transform your OS!' },
    { title: '🎸 Rock & Roll Update!', body: 'KidsOS just dropped a new album — wait, we mean VERSION. Turn it up to 11 when you are ready!' },
  ];

  let swReg = null;
  let updateRequested = false;

  function initServiceWorker() {
    // build.mjs sets data-build. Source files served directly (development) run with no service worker.
    if (!('serviceWorker' in navigator) || !document.documentElement.dataset.build) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Also fires on first install. Reload only when the user asked for the update.
      if (updateRequested) location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(reg => {
      swReg = reg;
      if (reg.waiting) announceUpdate();
      if (reg.installing) watchInstall(reg.installing);
      reg.addEventListener('updatefound', () => watchInstall(reg.installing));
      setTimeout(() => reg.update().catch(() => {}), 4000);
    }).catch(err => console.warn('KidsOS: service worker registration failed', err));
  }

  function watchInstall(sw) {
    sw.addEventListener('statechange', () => {
      // A controller exists only when an older release runs this page. First install shows no popup.
      if (sw.state === 'installed' && navigator.serviceWorker.controller) announceUpdate();
    });
  }

  function announceUpdate() {
    if (document.querySelector('.update-popup-overlay')) return;
    fetchRemoteVersion()
      .then(remote => showUpdatePopup(remote.version, remote.build))
      .catch(() => showUpdatePopup());
  }

  // Resolves to { available, version, build } of the release on the server
  function checkForUpdate() {
    const swCheck = swReg
      ? swReg.update().then(() => !!(swReg.installing || swReg.waiting))
      : Promise.resolve(null);
    return Promise.all([swCheck, fetchRemoteVersion()]).then(([swHasUpdate, remote]) => ({
      available: swHasUpdate ?? _isNewer(remote.version, version),
      version: remote.version,
      build: remote.build,
    }));
  }

  function applyUpdate() {
    const sw = swReg && (swReg.waiting || swReg.installing);
    if (!sw) return _nukeAndReload(); // no service worker: load all files again from the network
    updateRequested = true;
    const activate = () => sw.postMessage({ type: 'SKIP_WAITING' });
    if (sw.state === 'installed') activate();
    else sw.addEventListener('statechange', () => { if (sw.state === 'installed') activate(); });
  }

  // Relative URL on purpose: KidsOS only ever contacts the origin it was loaded from
  function fetchRemoteVersion() {
    return fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* ---- HTML escape: use for any user-entered text that goes into innerHTML ---- */
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);
  }

  function _isNewer(remote, local) {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((r[i] || 0) > (l[i] || 0)) return true;
      if ((r[i] || 0) < (l[i] || 0)) return false;
    }
    return false;
  }

  function showUpdatePopup(newVer, build) {
    // Pick a random funny message
    const msg = UPDATE_MESSAGES[Math.floor(Math.random() * UPDATE_MESSAGES.length)];

    const overlay = document.createElement('div');
    overlay.className = 'update-popup-overlay';
    overlay.innerHTML = `
      <div class="update-popup">
        <div class="update-popup-icon">🐧</div>
        <div class="update-popup-title">${msg.title}</div>
        <div class="update-popup-body">${msg.body}</div>
        <div class="update-popup-version">${newVer && newVer !== version ? `v${esc(version)} → v${esc(newVer)}${build ? ' (build ' + esc(build) + ')' : ''}` : ''}</div>
        <div class="update-popup-buttons">
          <button class="update-popup-btn update-popup-later" id="update-later-btn">Later</button>
          <button class="update-popup-btn update-popup-go" id="update-go-btn">🚀 Update Now!</button>
        </div>
        <div class="update-popup-note">Your files & data won't be touched!</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    document.getElementById('update-later-btn').onclick = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('update-go-btn').onclick = () => {
      const btn = document.getElementById('update-go-btn');
      btn.textContent = '⏳ Updating...';
      btn.disabled = true;
      applyUpdate();
    };
  }

  // Repair tool (Settings > Force Reload): remove cached files and load all files again
  function _nukeAndReload() {
    const hardNav = () => {
      const base = window.location.href.split('?')[0].split('#')[0];
      window.location.replace(base + '?_update=' + Date.now());
    };
    // Only KidsOS caches and the KidsOS service worker: other sites can share this origin
    Promise.all([
      'caches' in window
        ? caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kidsOS-')).map(k => caches.delete(k))))
        : Promise.resolve(),
      'serviceWorker' in navigator
        ? navigator.serviceWorker.getRegistration().then(reg => reg && reg.unregister())
        : Promise.resolve(),
    ]).then(hardNav).catch(hardNav);
  }

  /* ---- Back Button Handling ---- */
  function pushBackState() {
    history.pushState({ kidsOS: true, depth: Date.now() }, '');
  }

  function initBackButton() {
    // Seed two history entries so first back press stays in-app
    history.replaceState({ kidsOS: true, depth: 0 }, '');
    pushBackState();

    let lastBackTime = 0;

    window.addEventListener('popstate', (e) => {
      // Re-push so back button keeps working next time
      pushBackState();

      // Close app menu if open
      const menu = document.getElementById('app-menu');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        return;
      }

      // Close context menu if open
      const ctx = document.querySelector('.context-menu');
      if (ctx) {
        removeContextMenu();
        return;
      }

      // Close topmost focused window
      if (focusHistory.length > 0) {
        const topId = focusHistory[focusHistory.length - 1];
        closeWindow(topId);
        return;
      }

      // No windows open — on desktop, double-back exits
      const isMobile = window.innerWidth <= 1024;
      if (!isMobile) {
        const now = Date.now();
        if (now - lastBackTime < 1500) {
          history.go(-(history.length));
          return;
        }
        lastBackTime = now;
      }
    });
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

  /* ---- App Registry ---- */
  // The one list of apps. Desktop icons, app menu, and the About panel come from it.
  // The code of an app is js/apps/<id>.js. It loads when the app opens for the first time.
  //   short: label for the desktop icon when the full label is too long
  //   needs: apps whose code this app calls directly
  const APPS = [
    { id: 'filemanager',    icon: '📁', label: 'Files', needs: ['notepad', 'paint'] },
    { id: 'notepad',        icon: '📝', label: 'Notepad', needs: ['filemanager'] },
    { id: 'calculator',     icon: '🔢', label: 'Calculator' },
    { id: 'paint',          icon: '🎨', label: 'Paint', needs: ['filemanager'] },
    { id: 'snake',          icon: '🐍', label: 'Snake' },
    { id: 'memory',         icon: '🃏', label: 'Memory' },
    { id: 'kidstagram',     icon: '📸', label: 'Kidstagram' },
    { id: 'chat',           icon: '💬', label: 'KidsChat' },
    { id: 'minesweeper',    icon: '💣', label: 'Minesweeper' },
    { id: 'ejob',           icon: '💼', label: 'eJob' },
    { id: 'kidflix',        icon: '🎬', label: 'Kidflix' },
    { id: 'tinybank',       icon: '🏦', label: 'TinyBank' },
    { id: 'chorequest',     icon: '✅', label: 'Chores' },
    { id: 'treasuremapper', icon: '🗺️', label: 'Maps' },
    { id: 'snackdash',      icon: '🛵', label: 'SnackDash' },
    { id: 'zoomer',         icon: '🚗', label: 'Zoomer' },
    { id: 'soundboard',     icon: '🔊', label: 'Sounds' },
    { id: 'tinyscanner',    icon: '🔍', label: 'Scanner' },
    { id: 'sillyskies',     icon: '🌈', label: 'SillySkies' },
    { id: 'breakout',       icon: '🧱', label: 'Breakout' },
    { id: 'captaincardio',  icon: '🚀', label: 'Captain Cardio', short: 'Cardio' },
    { id: 'pebbles',        icon: '🪨', label: 'Pebbles' },
    { id: 'pocketpal',      icon: '🐶', label: 'Pocket Pal' },
    { id: 'settings',       icon: '⚙️', label: 'Settings' },
  ];

  function renderLauncher() {
    const icons = document.getElementById('desktop-icons');
    const menu = document.getElementById('app-menu-grid');
    icons.innerHTML = APPS.map(a => `
      <div class="desktop-icon" data-app="${a.id}" role="button" tabindex="0">
        <div class="icon-img">${a.icon}</div>
        <span>${a.short || a.label}</span>
      </div>`).join('');
    menu.innerHTML = APPS.map(a => `
      <div class="menu-app-item" data-app="${a.id}" role="button" tabindex="0">
        <span>${a.icon}</span> ${a.label}
      </div>`).join('');

    const open = e => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('[data-app]');
      if (!el) return;
      e.preventDefault();
      launch(el.dataset.app);
      if (el.closest('#app-menu')) toggleAppMenu();
    };
    for (const box of [icons, menu]) {
      box.addEventListener('click', open);
      box.addEventListener('keydown', open);
    }
  }

  /* ---- App Launcher ---- */
  const apps = {};        // id -> app object, filled by registerApp when the app code loads
  const scriptLoads = {}; // id -> Promise

  function registerApp(name, appObj) {
    apps[name] = appObj;
  }

  function loadScript(id) {
    return scriptLoads[id] ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `js/apps/${id}.js?v=${version}`;
      s.onload = resolve;
      s.onerror = () => {
        delete scriptLoads[id]; // a later tap tries again
        s.remove();
        reject(new Error('could not load ' + id));
      };
      document.head.appendChild(s);
    });
  }

  // The app and every app it needs, directly or through another app
  function withNeeds(id, found = new Set()) {
    if (found.has(id)) return found;
    found.add(id);
    const entry = APPS.find(a => a.id === id);
    (entry && entry.needs || []).forEach(n => withNeeds(n, found));
    return found;
  }

  function launch(name) {
    const entry = APPS.find(a => a.id === name);
    if (!entry) { console.warn('Unknown app:', name); return; }
    const ids = [...withNeeds(name)];
    if (ids.every(id => apps[id])) return openApp(name);
    Promise.all(ids.map(loadScript))
      .then(() => openApp(name))
      .catch(() => alert(`${entry.icon} ${entry.label} could not open. Try again.`));
  }

  function openApp(name) {
    const app = apps[name];
    if (!app) { console.warn('App code did not register:', name); return; }

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
      // Installed fullscreen app has no refresh button, so a tap must restart
      overlay.innerHTML = '<div style="text-align:center">😴 Goodbye!<br><small style="font-size:18px;color:#888">Tap to restart</small></div>';
      overlay.onclick = () => location.reload();
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
  // Every app stores under the kidsOS_ prefix, so no list to keep in sync
  function storageKeys() {
    return Object.keys(localStorage).filter(key => key.startsWith('kidsOS_')).sort();
  }

  function getStorageUsage() {
    let total = 0;
    const breakdown = {};
    storageKeys().forEach(key => {
      const val = localStorage.getItem(key);
      const bytes = val ? new Blob([val]).size : 0;
      breakdown[key] = bytes;
      total += bytes;
    });
    return { total, breakdown };
  }

  function factoryReset() {
    // Close windows first: some apps save their state in onClose
    Object.keys(windowMap).forEach(closeWindow);
    storageKeys().forEach(key => localStorage.removeItem(key));
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

  /* ---- Giggle Coins — cross-app reward API ---- */
  function awardCoins(amount, source, emoji, description) {
    if (!amount || amount <= 0) return;
    let tb;
    try {
      const raw = localStorage.getItem('kidsOS_tinybank');
      tb = raw ? JSON.parse(raw) : null;
    } catch (e) { tb = null; }
    if (!tb) {
      tb = {
        balance: 50, jars: {}, goals: [
          { id: 'castle', saved: 0 }, { id: 'rocket', saved: 0 },
          { id: 'unicorn', saved: 0 }, { id: 'pizza', saved: 0 }, { id: 'robot', saved: 0 },
        ],
        history: [], earnedToday: [], lastEarnDate: new Date().toISOString().slice(0, 10),
        badges: [], cardSkin: 0, cardFrozen: false, givenTotal: 0, totalEarned: 0, fraudsHandled: 0,
        dailyMissions: null,
      };
    }
    tb.balance = (tb.balance || 0) + amount;
    tb.totalEarned = (tb.totalEarned || 0) + amount;
    const d = new Date();
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    tb.history = tb.history || [];
    tb.history.unshift({ emoji: emoji || '🪙', text: description || (source + ': +' + amount), amount: amount, date: dateStr });
    if (tb.history.length > 30) tb.history.pop();
    localStorage.setItem('kidsOS_tinybank', JSON.stringify(tb));
    if (typeof window._tbExternalDeposit === 'function') window._tbExternalDeposit();
    showCoinToast(amount, emoji, description);
  }

  function showCoinToast(amount, emoji, description) {
    const existing = document.querySelector('.gc-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'gc-toast';
    toast.innerHTML = '<div class="gc-toast-icon">' + (emoji || '🪙') + '</div>'
      + '<div class="gc-toast-body">'
      + '<div class="gc-toast-title">+' + amount + ' Giggle Coins!</div>'
      + (description ? '<div class="gc-toast-desc">' + esc(description) + '</div>' : '')
      + '</div>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('gc-toast-in'));
    setTimeout(() => {
      toast.classList.add('gc-toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  return {
    boot, launch, registerApp, APPS,
    createWindow, closeWindow, minimizeWindow, restoreWindow, toggleMaximize, focusWindow,
    toggleAppMenu, shutdown,
    saveSettings, loadSettings, getSettings, applyWallpaper, getWallpapers,
    showContextMenu, removeContextMenu,
    updateMenuUsername,
    getStorageUsage, factoryReset, isStandalone,
    applyTheme, ACCENT_COLORS,
    get VERSION() { return version; },
    checkForUpdate, applyUpdate, _nukeAndReload,
    awardCoins, esc,
  };
})();
