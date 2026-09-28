/* ===== KidsOS Core ===== */
const OS = (() => {
  // version.json is the only place the version number lives. Loaded at boot.
  let version = 'dev';

  let zCounter = 100;
  // Texts of the shell. The Serbian table is js/lang/sr/os.js.
  const t = Lang.texts('os');
  let windowMap = {};     // id -> { el, taskbarBtn, app }
  let focusHistory = [];  // ordered list of window ids, most recent last
  // Values of a new device
  const DEFAULTS = {
    username: 'KidsUser',
    wallpaper: 'meadow',
    theme: 'light',
    accentColor: '#4F8FC0',
    language: 'en',      // 'en' or 'sr'. A change needs a new start of the app
    timeOffset: 0,       // minutes offset from real time
    dateOverride: null,
  };
  let settings = { ...DEFAULTS };
  let clockInterval = null;

  /* ---- Standalone / PWA detection ---- */
  function isStandalone() {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
  }

  /* ---- Modes ---- */
  // touch: home screen, apps in full screen. mouse: desktop with windows.
  // The mode comes from the device: a finger as main pointer, or a small screen, gives touch.
  const coarse = window.matchMedia('(pointer: coarse)');
  function mode() {
    return coarse.matches || window.innerWidth < 700 || window.innerHeight < 500 ? 'touch' : 'mouse';
  }

  // Runs at start and at each change of pointer or screen size. Open apps stay open.
  function applyMode() {
    document.documentElement.dataset.mode = mode();
    updateFront();
    fitHome();
    Object.values(windowMap).forEach(fitStage);
  }

  // front is 'app' when a window is in view, and 'home' when not
  function updateFront() {
    const front = Object.values(windowMap).some(w => !w.el.classList.contains('minimized')) ? 'app' : 'home';
    document.documentElement.dataset.front = front;
    if (front === 'home') updateCoins(); // an app can change the balance
  }

  /* ---- Home (touch mode) ---- */
  const ICON_MAX = 124, ICON_MIN = 64, ICON_SCROLL = 68;
  const ICON_FILE = 256; // pixels of a picture file in art/icons/

  // Number of columns with the largest picture size that shows each app with no scroll.
  // Below ICON_MIN the grid scrolls.
  function homeFit(count, width, height, label) {
    const limit = Math.min(ICON_MAX, Math.floor(ICON_FILE / (window.devicePixelRatio || 1)));
    let best = { icon: 0 };
    for (let cols = 3; cols <= 10; cols++) {
      const rows = Math.ceil(count / cols);
      const size = Math.floor(Math.min(width / cols - 34, height / rows - label - 10, limit));
      if (size > best.icon) best = { icon: size, cols, rows };
    }
    if (best.icon >= ICON_MIN) return best;
    return { icon: ICON_SCROLL, cols: Math.max(3, Math.floor(width / (ICON_SCROLL + 18))), scroll: true };
  }

  function fitHome() {
    const grid = document.getElementById('desktop-icons');
    grid.removeAttribute('style');
    grid.classList.remove('small-labels');
    if (mode() !== 'touch') return;
    const narrow = window.innerWidth < 600;
    const label = narrow ? 24 : 30;
    const width = grid.clientWidth - (narrow ? 16 : 56), height = grid.clientHeight - 8;
    const f = homeFit(APPS.length, width, height, label);
    grid.style.setProperty('--app-icon', f.icon + 'px');
    grid.style.gridTemplateColumns = `repeat(${f.cols}, minmax(0, 1fr))`;
    grid.style.rowGap = f.scroll ? '10px' : Math.max(4, Math.floor((height - f.rows * (f.icon + label)) / (f.rows + 1))) + 'px';
    grid.classList.toggle('small-labels', f.icon < 90); // before the measurement below: it changes the height of a tile
    if (f.scroll) {
      grid.style.alignContent = 'start';
      // The row at the lower edge shows half of its pictures, so the child sees that more apps are below
      // Sizes come from the page: a row is as high as its highest tile
      const tiles = grid.querySelectorAll('.desktop-icon');
      if (tiles.length > f.cols) {
        const pic = tiles[0].querySelector('img').getBoundingClientRect();
        const row = tiles[f.cols].getBoundingClientRect().top - tiles[0].getBoundingClientRect().top - 10;
        const space = grid.clientHeight - (pic.top - grid.getBoundingClientRect().top + grid.scrollTop) - pic.height / 2;
        const rows = Math.floor(space / (row + 10)); // rows in full view
        if (row > 0 && rows >= 1 && rows < Math.ceil(APPS.length / f.cols)) grid.style.rowGap = (space - rows * row) / rows + 'px';
      }
    }
  }

  /* ---- Stage (touch mode) ---- */
  // An app has a design for a small window. In full screen its body keeps about that size
  // and gets a scale, so each text and each control of the app is larger.
  // The stage needs a browser that gives the size of a part with zoom in screen pixels.
  // A browser that does not: the app fills the screen with no scale, and each pointer position stays correct.
  let zoomOk = null;
  function zoomWorks() {
    if (zoomOk === null) {
      const probe = document.createElement('div');
      probe.dataset.probe = 'zoom';
      probe.style.cssText = 'position:absolute;visibility:hidden;width:10px;height:10px;zoom:2';
      document.body.appendChild(probe);
      zoomOk = Math.round(probe.getBoundingClientRect().width) === 20;
      probe.remove();
    }
    return zoomOk;
  }

  function fitStage(w) {
    const body = w.el.querySelector('.win-body');
    const on = mode() === 'touch' && w.stage && zoomWorks();
    body.classList.toggle('staged', on);
    if (!on) {
      body.style.width = body.style.height = body.style.zoom = '';
      return;
    }
    const frameW = w.el.clientWidth;
    const frameH = w.el.clientHeight - w.el.querySelector('.win-titlebar').offsetHeight;
    if (frameW <= 0 || frameH <= 0) return; // app is in the dock: it gets its size when it comes back
    const k = Math.max(1, Math.min(2, frameW / w.design.width, frameH / w.design.height));
    body.style.width = Math.min(frameW / k, w.design.width * 1.25) + 'px';
    body.style.height = frameH / k + 'px';
    body.style.zoom = k;
  }

  /* ---- Coin counter ---- */
  function coinBalance() {
    try {
      const n = JSON.parse(localStorage.getItem('kidsOS_tinybank')).balance;
      return Number.isFinite(n) ? n : 50;
    } catch (e) { return 50; } // no bank data yet: start balance of TinyBank
  }

  function updateCoins() {
    const n = coinBalance();
    document.querySelectorAll('.k-coin-count').forEach(el => { el.textContent = n; });
  }

  // Home button: each app in view goes to the dock and stays open
  function goHome() {
    Object.keys(windowMap).forEach(id => {
      if (!windowMap[id].el.classList.contains('minimized')) minimizeWindow(id);
    });
  }

  /* ---- Boot ---- */
  function boot() {
    loadSettings();
    applyTheme();
    applyWallpaper();
    // A language file that does not load: the shell shows English texts
    loadLanguage('os').then(start);
  }

  function start() {
    shellTexts();
    updateMenuUsername();
    renderLauncher();
    applyMode();
    coarse.addEventListener('change', applyMode);
    window.addEventListener('resize', applyMode);
    document.querySelectorAll('[data-coins]').forEach(el => el.addEventListener('click', () => launch('tinybank')));
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
    { id: 'penguin', title: '🐧 Penguin Express Delivery!', body: 'A shiny new version of KidsOS just waddled in! The penguin will wait until you are ready.' },
    { id: 'rocket', title: '🚀 Houston, We Have an Update!', body: 'Mission Control has detected a newer version of KidsOS orbiting nearby. Initiate download sequence?' },
    { id: 'cookies', title: '🍪 Fresh Cookies from the Oven!', body: 'A fresh batch of KidsOS improvements just came out of the oven. They stay warm until you are ready!' },
    { id: 'unicorn', title: '🦄 Unicorn Update Available!', body: 'A magical unicorn galloped by and dropped off a new version of KidsOS. The sparkles will wait for you!' },
    { id: 'parcel', title: '🎁 Surprise Package!', body: 'The KidsOS elves have been working overtime! A brand new update is wrapped up and ready for you!' },
    { id: 'wizard', title: '🧙 Wizard Update Detected!', body: 'The update wizard has conjured a new spell — er, version! Wave your wand (click the button) to apply it!' },
    { id: 'frog', title: '🐸 Ribbit! New Version!', body: 'A little frog just hopped in with a new KidsOS update on its back. Kiss the button to transform your OS!' },
    { id: 'rock', title: '🎸 Rock & Roll Update!', body: 'KidsOS just dropped a new album — wait, we mean VERSION. Turn it up to 11 when you are ready!' },
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
    const messages = t.list('os.updates', UPDATE_MESSAGES);
    const msg = messages[Math.floor(Math.random() * messages.length)];

    const overlay = document.createElement('div');
    overlay.className = 'update-popup-overlay';
    overlay.innerHTML = `
      <div class="update-popup">
        <div class="update-popup-icon"><img src="art/mascot/parcel.webp" alt="" draggable="false"></div>
        <div class="update-popup-title">${msg.title}</div>
        <div class="update-popup-body">${msg.body}</div>
        <div class="update-popup-version">${newVer && newVer !== version ? `v${esc(version)} → v${esc(newVer)}${build ? ' ' + t('(build {build})', { build: esc(build) }) : ''}` : ''}</div>
        <div class="update-popup-buttons">
          <button class="update-popup-btn update-popup-later" id="update-later-btn">${t('Later')}</button>
          <button class="update-popup-btn update-popup-go" id="update-go-btn">🚀 ${t('Update Now!')}</button>
        </div>
        <div class="update-popup-note">${t("Your files & data won't be touched!")}</div>
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
      btn.textContent = '⏳ ' + t('Updating...');
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

      // Close the window in front. An app in the dock stays open: the child does not see it,
      // so a back press must not end it
      const topId = [...focusHistory].reverse().find(id => windowMap[id] && !windowMap[id].el.classList.contains('minimized'));
      if (topId) {
        closeWindow(topId);
        return;
      }

      // No windows open: with a mouse, a second back in a short time leaves the app
      if (mode() === 'mouse') {
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
    // The top bar and the taskbar have a clock each
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const english = Lang.code === 'en';
    // English: format of the device, as in each release before. Other language: format of that language
    const time = now.toLocaleTimeString(english ? [] : Lang.locale, {hour:'2-digit',minute:'2-digit'});
    const date = english
      ? `${days[now.getDay()]} ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]}`
      : new Intl.DateTimeFormat(Lang.locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    document.querySelectorAll('.clock-time').forEach(el => { el.textContent = time; });
    document.querySelectorAll('.clock-date').forEach(el => { el.textContent = date; });
  }

  /* ---- App Menu ---- */
  function toggleAppMenu() {
    const m = document.getElementById('app-menu');
    m.classList.toggle('hidden');
  }

  /* ---- Window Manager ---- */
  function createWindow(opts) {
    // opts: { id, title, icon, content, width, height, x, y, app, appId, stage }
    //   stage: false  the body fills the screen in touch mode with no scale (for an app that scales itself)
    const id = opts.id || ('win_' + Date.now());
    if (windowMap[id]) { focusWindow(id); return id; }
    // A window of an app shows the picture of the app. Each other window shows the text of its options.
    const picture = opts.appId ? icon(opts.appId) : '';

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
        <button class="win-btn home" title="${t('Home')}" aria-label="${t('Home')}" onclick="OS.goHome()"></button>
        <div class="win-title">
          <span class="win-title-icon">${picture || opts.icon || '🪟'}</span> ${opts.title || t('Window')}
        </div>
        <div class="win-controls">
          <button class="win-btn minimize" title="${t('Minimize')}" onclick="OS.minimizeWindow('${id}')">─</button>
          <button class="win-btn maximize" title="${t('Maximize')}" onclick="OS.toggleMaximize('${id}')">□</button>
          <button class="win-btn close" title="${t('Close')}" onclick="OS.closeWindow('${id}')">✕</button>
        </div>
      </div>
      <div class="win-body" id="win-body-${id}">${opts.content||''}</div>
      <div class="win-resize" title="${t('Resize')}"></div>
    `;

    document.getElementById('windows-container').appendChild(win);
    makeDraggable(win, id);
    makeResizable(win, id);
    win.addEventListener('mousedown', () => focusWindow(id), true);
    win.addEventListener('touchstart', () => focusWindow(id), { capture: true, passive: true });

    // Taskbar button
    const btn = document.createElement('button');
    btn.className = 'taskbar-app-btn active';
    btn.innerHTML = `<span class="tbtn-icon">${picture || opts.icon || ''}</span><span class="tbtn-title">${opts.title || t('App')}</span>`;
    btn.id = 'tbtn_' + id;
    btn.setAttribute('aria-label', opts.title || t('App')); // a narrow screen hides the title text
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

    windowMap[id] = {
      el: win, taskbarBtn: btn, app: opts.app, maximized: false, prevRect: null,
      stage: opts.stage !== false,
      // The title bar of a window in mouse mode has 36 px
      design: { width: opts.width || 480, height: (opts.height || 360) - 36 },
    };
    focusWindow(id);
    updateFront();
    fitStage(windowMap[id]); // before the app starts, so the app sees its final size

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
    // The window below gets the focus. An app in the dock stays in the dock.
    const below = [...focusHistory].reverse().find(wid => !windowMap[wid].el.classList.contains('minimized'));
    if (below) focusWindow(below);
    updateFront();
  }

  function minimizeWindow(id) {
    const w = windowMap[id];
    if (!w) return;
    w.el.classList.add('minimized');
    w.taskbarBtn.classList.add('minimized');
    w.taskbarBtn.classList.remove('active');
    updateFront();
    // A hidden app must stop its work: game loop, camera, animation
    w.el.querySelectorAll('video, audio').forEach(m => m.pause());
    if (w.app && w.app.onMinimize) w.app.onMinimize(id);
  }

  function restoreWindow(id) {
    const w = windowMap[id];
    if (!w) return;
    w.el.classList.remove('minimized');
    focusWindow(id);
    updateFront();
    fitStage(w);
    if (w.app && w.app.onRestore) w.app.onRestore(id);
  }

  function toggleMaximize(id) {
    const w = windowMap[id];
    if (!w || mode() === 'touch') return; // touch mode: each app fills the screen
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
      if ((w && w.maximized) || mode() === 'touch') return;
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
      if (mode() === 'touch') return;
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
  // The picture of an app is art/icons/<id>.webp.
  //   short: label for the desktop icon when the full label is too long
  //   needs: apps whose code this app calls directly
  //   libs: shared code in js/lib/ that loads before the code of the app
  const APPS = [
    { id: 'filemanager',    label: 'Files', needs: ['notepad', 'paint'] },
    { id: 'notepad',        label: 'Notepad', needs: ['filemanager'] },
    { id: 'calculator',     label: 'Calculator' },
    { id: 'paint',          label: 'Paint', needs: ['filemanager'] },
    { id: 'snake',          label: 'Snake' },
    { id: 'memory',         label: 'Memory' },
    { id: 'kidstagram',     label: 'Kidstagram' },
    { id: 'chat',           label: 'KidsChat' },
    { id: 'minesweeper',    label: 'Minesweeper' },
    { id: 'ejob',           label: 'eJob' },
    { id: 'kidflix',        label: 'Kidflix' },
    { id: 'tinybank',       label: 'TinyBank' },
    { id: 'chorequest',     label: 'Chores' },
    { id: 'treasuremapper', label: 'Maps' },
    { id: 'snackdash',      label: 'SnackDash' },
    { id: 'zoomer',         label: 'Zoomer' },
    { id: 'soundboard',     label: 'Sounds' },
    { id: 'tinyscanner',    label: 'Scanner' },
    { id: 'sillyskies',     label: 'SillySkies' },
    { id: 'breakout',       label: 'Breakout', libs: ['paddle'] },
    { id: 'pong',           label: 'Pong', libs: ['paddle'] },
    { id: 'captaincardio',  label: 'Captain Cardio', short: 'Cardio' },
    { id: 'pebbles',        label: 'Pebbles' },
    { id: 'pocketpal',      label: 'Pocket Pal' },
    { id: 'settings',       label: 'Settings' },
  ];

  // Name of an app in the language of the device. tile: the short name for the tile on the home.
  // The keys are literals here, so the tool for the language work finds them. label in APPS is the English name.
  let names = null;
  function appName(id, tile) {
    names = names || {
      full: {
        filemanager: t('Files'), notepad: t('Notepad'), calculator: t('Calculator'), paint: t('Paint'),
        snake: t('Snake'), memory: t('Memory'), kidstagram: t('Kidstagram'), chat: t('KidsChat'),
        minesweeper: t('Minesweeper'), ejob: t('eJob'), kidflix: t('Kidflix'), tinybank: t('TinyBank'),
        chorequest: t('Chores'), treasuremapper: t('Maps'), snackdash: t('SnackDash'), zoomer: t('Zoomer'),
        soundboard: t('Sounds'), tinyscanner: t('Scanner'), sillyskies: t('SillySkies'), breakout: t('Breakout'),
        pong: t('Pong'), captaincardio: t('Captain Cardio'), pebbles: t('Pebbles'), pocketpal: t('Pocket Pal'),
        settings: t('Settings'),
      },
      tile: { captaincardio: t('Cardio'), sillyskies: t('tile|SillySkies'), pocketpal: t('tile|Pocket Pal') },
    };
    return (tile && names.tile[id]) || names.full[id] || id;
  }

  // The label next to the picture names the app, so alt stays empty
  function icon(id) {
    return `<img class="app-icon" src="art/icons/${id}.webp" alt="" draggable="false">`;
  }

  function renderLauncher() {
    const icons = document.getElementById('desktop-icons');
    const menu = document.getElementById('app-menu-grid');
    icons.innerHTML = APPS.map(a => `
      <div class="desktop-icon" data-app="${a.id}" role="button" tabindex="0">
        <div class="icon-img">${icon(a.id)}</div>
        <span>${appName(a.id, true)}</span>
      </div>`).join('');
    menu.innerHTML = APPS.map(a => `
      <div class="menu-app-item" data-app="${a.id}" role="button" tabindex="0">
        ${icon(a.id)} ${appName(a.id)}
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

  // dir 'apps': code of an app. dir 'lib': shared code that an app loads when it needs it (OS.loadLib).
  function loadScript(id, dir = 'apps') {
    const key = `${dir}/${id}`;
    return scriptLoads[key] ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      // data-build comes from the build and exists at the start. version comes from version.json a moment later
      s.src = `js/${key}.js?v=${document.documentElement.dataset.build || version}`;
      s.onload = resolve;
      s.onerror = () => {
        delete scriptLoads[key]; // a later tap tries again
        s.remove();
        reject(new Error('could not load ' + id));
      };
      document.head.appendChild(s);
    });
  }

  // Language file of the shell ('os') or of an app. English needs no file.
  // The promise never fails: with no file the texts are English.
  function loadLanguage(id) {
    if (Lang.code === 'en') return Promise.resolve();
    return loadScript(`${Lang.code}/${id}`, 'lang').catch(() => console.warn('KidsOS: no language file for', id));
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
    // The texts and the shared code of an app load before its code: the code can use them at the time it loads
    const libs = id => (APPS.find(a => a.id === id) || {}).libs || [];
    Promise.all(ids.map(id => loadLanguage(id).then(() => Promise.all(libs(id).map(n => loadScript(n, 'lib')))).then(() => loadScript(id))))
      .then(() => openApp(name))
      .catch(() => alert(t('{app} could not open. Try again.', { app: appName(name) })));
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
    opts.appId = name; // the window id of some apps is not the app id
    return createWindow(opts);
  }

  /* ---- Settings Persistence ---- */
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('kidsOS_settings') || '{}');
      if (s && typeof s === 'object') Object.assign(settings, s);
    } catch(e) {}
    // The storage can hold values of an older release, or values that are not valid
    if (!WALLPAPERS.some(w => w.id === settings.wallpaper)) settings.wallpaper = DEFAULTS.wallpaper;
    const color = String(settings.accentColor).toLowerCase();
    const old = OLD_ACCENTS.indexOf(color);
    const now = ACCENT_COLORS.find(c => c.hex.toLowerCase() === color);
    settings.accentColor = old >= 0 ? ACCENT_COLORS[old].hex : now ? now.hex : DEFAULTS.accentColor;
    if (settings.theme !== 'dark') settings.theme = 'light';
    if (typeof settings.username !== 'string' || !settings.username.trim()) settings.username = DEFAULTS.username;
    settings.language = Lang.valid(settings.language);
    Lang.set(settings.language);
    document.documentElement.lang = settings.language === 'sr' ? 'sr-Cyrl' : 'en';
  }

  function saveSettings(newSettings) {
    Object.assign(settings, newSettings);
    if (!WALLPAPERS.some(w => w.id === settings.wallpaper)) settings.wallpaper = DEFAULTS.wallpaper;
    settings.language = Lang.valid(settings.language);
    localStorage.setItem('kidsOS_settings', JSON.stringify(settings));
    applyTheme();
    applyWallpaper();
    updateMenuUsername();
  }

  function getSettings() { return settings; }

  // The texts of the open screens are in the old language, so the app starts again
  function setLanguage(code) {
    saveSettings({ language: code });
    location.reload();
  }

  // look: value for the CSS property background-image
  const WALLPAPERS = [
    { id: 'meadow',  name: 'Meadow',  look: "url('art/wallpapers/meadow.webp')" },
    { id: 'forest',  name: 'Forest',  look: "url('art/wallpapers/forest.webp')" },
    { id: 'seaside', name: 'Seaside', look: "url('art/wallpapers/seaside.webp')" },
    { id: 'sunset',  name: 'Sunset',  look: "url('art/wallpapers/sunset.webp')" },
    { id: 'night',   name: 'Night',   look: "url('art/wallpapers/night.webp')" },
    { id: 'rain',    name: 'Rain',    look: "url('art/wallpapers/rain.webp')" },
  ];
  // The night theme puts this layer over the wallpaper
  const NIGHT_LAYER = 'linear-gradient(rgba(34, 44, 92, 0.8), rgba(24, 28, 66, 0.88))';

  // Each color has a contrast to white text of 3.49 or more
  const ACCENT_COLORS = [
    { name: 'Sky',       hex: '#4F8FC0' },
    { name: 'Leaf',      hex: '#4E8B5A' },
    { name: 'Plum',      hex: '#8466B5' },
    { name: 'Persimmon', hex: '#D95F43' },
    { name: 'Rose',      hex: '#C9587C' },
    { name: 'Amber',     hex: '#B9770E' },
  ];
  // Colors of the releases before 0.30.0. A stored color changes to the new color at the same position.
  const OLD_ACCENTS = ['#5b8cff', '#4caf50', '#9c27b0', '#ff9800', '#e91e8c', '#009688'];

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }

  function applyWallpaper(id) {
    const paper = WALLPAPERS.find(w => w.id === (id !== undefined ? id : settings.wallpaper)) || WALLPAPERS[0];
    settings.wallpaper = paper.id;
    document.getElementById('desktop').style.backgroundImage = (settings.theme === 'dark' ? NIGHT_LAYER + ', ' : '') + paper.look;
  }

  // name: in the language of the device
  function getWallpapers() {
    const names = { meadow: t('Meadow'), forest: t('Forest'), seaside: t('Seaside'), sunset: t('Sunset'), night: t('Night'), rain: t('Rain') };
    return WALLPAPERS.map(w => ({ ...w, name: names[w.id] }));
  }

  function accentColors() {
    const names = { Sky: t('Sky'), Leaf: t('Leaf'), Plum: t('Plum'), Persimmon: t('Persimmon'), Rose: t('Rose'), Amber: t('Amber') };
    return ACCENT_COLORS.map(c => ({ ...c, name: names[c.name] }));
  }

  // Name of the child for a text. A new device has the name KidsUser: the app shows it in the language of the device
  function userName() {
    return settings.username === DEFAULTS.username ? t('KidsUser') : settings.username;
  }

  function updateMenuUsername() {
    const name = userName();
    const el = document.getElementById('menu-username');
    if (el) el.textContent = '👤 ' + name;
    // KidsUser is the name of a new device: no name in the greeting
    const hello = document.getElementById('hello-text');
    if (hello) hello.textContent = settings.username === DEFAULTS.username ? t('Hello!') : t('Hello, {name}!', { name });
  }

  // Texts of the markup in index.html
  function shellTexts() {
    const set = (selector, text) => document.querySelectorAll(selector).forEach(el => { el.textContent = text; });
    const label = (selector, text) => document.querySelectorAll(selector).forEach(el => el.setAttribute('aria-label', text));
    document.getElementById('app-menu-btn').lastChild.textContent = ' ' + t('Apps');
    set('.app-menu-footer button', '⏻ ' + t('Shutdown'));
    set('#boot-subtitle', t('Learning Computing the Fun Way!'));
    label('#home-btn', t('Home'));
    label('[data-coins]', t('Giggle Coins'));
  }

  /* ---- Shutdown ---- */
  function shutdown() {
    let overlay = document.getElementById('shutdown-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'shutdown-overlay';
      overlay.textContent = t('Shutting down KidsOS...');
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
    setTimeout(() => {
      // Installed fullscreen app has no refresh button, so a tap must restart
      overlay.innerHTML = '<div><img src="art/mascot/sleep.webp" alt="" draggable="false">' + t('Goodbye!') + '<br><small>' + t('Tap to restart') + '</small></div>';
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
    Object.assign(settings, DEFAULTS);
    applyTheme();
    applyWallpaper();
    updateMenuUsername();
    updateCoins();
  }

  /* ---- Game loop helper ---- */
  // Fixed timestep: game speed does not depend on the screen refresh rate (60, 90, 120 Hz).
  // step() runs hz times per second of game time. render(alpha) runs one time per frame,
  // alpha (0 to 1) is the position between the last two steps.
  // The browser stops animation frames while the page is hidden, so a hidden game stops too.
  function createLoop(step, render, hz = 120) {
    const dt = 1000 / hz;
    let frame = null, last = 0, acc = 0;
    function tick(now) {
      frame = requestAnimationFrame(tick);
      acc += Math.min(now - last, 250); // after a long stop, do not run all missed steps
      last = now;
      while (acc >= dt) {
        step();
        acc -= dt;
        if (frame === null) return; // step() stopped the loop
      }
      render(acc / dt);
    }
    return {
      start() {
        if (frame !== null) return;
        last = performance.now();
        acc = 0;
        frame = requestAnimationFrame(tick);
      },
      stop() {
        if (frame === null) return;
        cancelAnimationFrame(frame);
        frame = null;
      },
      get running() { return frame !== null; },
    };
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
    const dateStr = d.toLocaleDateString(Lang.code === 'en' ? undefined : Lang.locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    tb.history = tb.history || [];
    tb.history.unshift({ emoji: emoji || '🪙', text: description || (source + ': +' + amount), amount: amount, date: dateStr });
    if (tb.history.length > 30) tb.history.pop();
    localStorage.setItem('kidsOS_tinybank', JSON.stringify(tb));
    updateCoins();
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
      + '<div class="gc-toast-title">' + t('+{n} {coins}!', { n: amount, coins: t.plural(amount, 'Giggle Coin', 'Giggle Coins') }) + '</div>'
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
    boot, launch, registerApp, APPS, appName, icon, mode, goHome,
    texts: Lang.texts, lang: () => Lang.code, setLanguage, missingTexts: () => Lang.missing,
    // First parameter for the date and number functions. English gives undefined: the device decides the form, as in each release before
    locale: () => Lang.code === 'en' ? undefined : Lang.locale,
    // For a number or a day name that was a fixed English text before release 0.31.0: English does not depend on the device
    textLocale: () => Lang.code === 'en' ? 'en-US' : Lang.locale,
    // Search in a text that the child sees. Serbian: Latin letters find a Cyrillic text
    holds: (text, typed) => Lang.holds(text, typed),
    createWindow, closeWindow, minimizeWindow, restoreWindow, toggleMaximize, focusWindow,
    toggleAppMenu, shutdown,
    saveSettings, loadSettings, getSettings, applyWallpaper, getWallpapers,
    showContextMenu, removeContextMenu,
    updateMenuUsername, userName,
    getStorageUsage, factoryReset, isStandalone,
    applyTheme, ACCENT_COLORS, accentColors,
    get VERSION() { return version; },
    checkForUpdate, applyUpdate, _nukeAndReload,
    awardCoins, esc, createLoop,
    loadLib: name => loadScript(name, 'lib'),
  };
})();
