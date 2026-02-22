/* ===== Settings App ===== */
OS.registerApp('settings', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      width: 560,
      height: 420,
      content: this.getHTML(),
    };
  },

  getHTML() {
    const s = OS.getSettings();
    const wallpapers = OS.getWallpapers();
    const gradientPreviews = wallpapers.map((wp, i) => `
      <div class="wp-option ${s.wallpaper == i ? 'selected' : ''}"
           style="background:${wp}"
           onclick="SettingsApp.selectWallpaper(${i}, this)"
           title="Wallpaper ${i+1}"></div>`).join('');

    const now = new Date();
    const timeStr = now.toTimeString().slice(0,5);
    const dateStr = now.toISOString().slice(0,10);

    return `
    <div class="settings-wrap">
      <div class="settings-sidebar">
        <div class="settings-sidebar-item active" onclick="SettingsApp.showPanel('personalize', this)">
          🖼️ Appearance
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('datetime', this)">
          🕐 Date &amp; Time
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('account', this)">
          👤 Account
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('storage', this)">
          💾 Storage
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('updates', this)">
          🔄 Updates
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('about', this)">
          ℹ️ About
        </div>
      </div>

      <!-- Appearance Panel -->
      <div class="settings-panel active" id="panel-personalize">
        <h2>🖼️ Appearance</h2>
        <div class="settings-group">
          <label>Wallpaper</label>
          <div class="wallpaper-grid">${gradientPreviews}</div>
        </div>
      </div>

      <!-- Date & Time Panel -->
      <div class="settings-panel" id="panel-datetime">
        <h2>🕐 Date &amp; Time</h2>
        <div class="settings-group">
          <label>Set Time (HH:MM)</label>
          <input type="time" id="settings-time" value="${timeStr}">
        </div>
        <div class="settings-group">
          <label>Set Date</label>
          <input type="date" id="settings-date" value="${dateStr}">
        </div>
        <button class="settings-btn" onclick="SettingsApp.saveDateTime()">Apply Date &amp; Time</button>
        <br><br>
        <button class="settings-btn" style="background:#888" onclick="SettingsApp.resetDateTime()">Reset to Real Time</button>
      </div>

      <!-- Account Panel -->
      <div class="settings-panel" id="panel-account">
        <h2>👤 Account</h2>
        <div class="settings-group">
          <label>Username</label>
          <input type="text" id="settings-username" value="${s.username || 'KidsUser'}"
                 placeholder="Enter your name" maxlength="20">
        </div>
        <button class="settings-btn" onclick="SettingsApp.saveUsername()">Save Username</button>
        <div style="margin-top:20px;padding:12px;background:#f5f5f5;border-radius:8px">
          <strong>Current User:</strong> ${s.username || 'KidsUser'}
        </div>
      </div>

      <!-- Storage Panel -->
      <div class="settings-panel" id="panel-storage">
        <h2>💾 Storage</h2>
        <div class="settings-group">
          <label>Storage Usage</label>
          <div id="storage-usage-list" class="storage-usage-list"></div>
        </div>
        <div class="settings-group">
          <button class="settings-btn" onclick="SettingsApp.refreshStorage()">🔄 Refresh</button>
        </div>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
        <div class="settings-group">
          <label style="color:#c00">Factory Reset</label>
          <p style="font-size:13px;color:#666;margin-bottom:12px">
            This will erase <b>all</b> your saved data: files, settings, chat history, game scores, and Kidstagram data. This cannot be undone!
          </p>
          <button class="settings-btn settings-btn-danger" onclick="SettingsApp.factoryReset()">🗑️ Factory Reset</button>
        </div>
      </div>

      <!-- Updates Panel -->
      <div class="settings-panel" id="panel-updates">
        <h2>🔄 Updates</h2>
        <div class="settings-group">
          <p style="font-size:13px;color:#666;margin-bottom:12px">
            Check if a newer version of KidsOS is available. Requires an internet connection.
          </p>
          <div id="update-status" style="padding:12px;background:#f5f5f5;border-radius:8px;font-size:13px;color:#555;margin-bottom:12px">
            Status: Not checked yet
          </div>
          <button class="settings-btn" id="update-check-btn" onclick="SettingsApp.checkForUpdate()">🔍 Check for Updates</button>
          <button class="settings-btn" id="update-apply-btn" onclick="SettingsApp.applyUpdate()" style="display:none;margin-left:8px;background:#4caf50">⬇️ Update Now</button>
        </div>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
        <div class="settings-group">
          <label>Force Reload</label>
          <p style="font-size:13px;color:#666;margin-bottom:12px">
            Clear all cached files and reload KidsOS. Use this if the app feels stuck on an old version.
          </p>
          <button class="settings-btn" style="background:#ff9800" onclick="SettingsApp.forceReload()">🔁 Force Reload</button>
        </div>
      </div>

      <!-- About Panel -->
      <div class="settings-panel" id="panel-about">
        <h2>ℹ️ About KidsOS</h2>
        <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
          <div style="font-size:48px;text-align:center">🐧</div>
          <div style="text-align:center">
            <strong style="font-size:22px">KidsOS</strong><br>
            <span style="color:#666">Version 1.0.0</span>
          </div>
          <div style="background:#f5f5f5;border-radius:8px;padding:14px;font-size:14px;color:#444;line-height:1.8">
            <b>KidsOS</b> is a fun, educational operating system simulator designed to help children learn how to use computers!<br><br>
            🎯 <b>Apps included:</b><br>
            📁 File Manager · 📝 Notepad · 🔢 Calculator<br>
            🎨 Paint · 🐍 Snake · 🃏 Memory Match · ⚙️ Settings
          </div>
          <div style="text-align:center;color:#888;font-size:13px">Built with HTML, CSS &amp; JavaScript ❤️</div>
        </div>
      </div>
    </div>`;
  },

  onOpen() {},
  onClose() {},
});

const SettingsApp = {
  showPanel(name, sidebarEl) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.settings-sidebar-item').forEach(i => i.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('active');
    if (sidebarEl) sidebarEl.classList.add('active');
    if (name === 'storage') this.refreshStorage();
  },

  selectWallpaper(idx, el) {
    document.querySelectorAll('.wp-option').forEach(w => w.classList.remove('selected'));
    if (el) el.classList.add('selected');
    OS.applyWallpaper(idx);
    OS.saveSettings({ wallpaper: String(idx) });
  },

  saveDateTime() {
    const timeEl = document.getElementById('settings-time');
    const dateEl = document.getElementById('settings-date');
    if (!timeEl || !dateEl) return;

    const timeVal = timeEl.value;   // HH:MM
    const dateVal = dateEl.value;   // YYYY-MM-DD

    const now = new Date();
    const [th, tm] = timeVal.split(':').map(Number);
    const realMinutes = now.getHours() * 60 + now.getMinutes();
    const setMinutes = th * 60 + tm;
    const offset = setMinutes - realMinutes;

    OS.saveSettings({ timeOffset: offset, dateOverride: dateVal });
    alert('Date & Time updated! ✅');
  },

  resetDateTime() {
    OS.saveSettings({ timeOffset: 0, dateOverride: null });
    const now = new Date();
    const timeEl = document.getElementById('settings-time');
    const dateEl = document.getElementById('settings-date');
    if (timeEl) timeEl.value = now.toTimeString().slice(0,5);
    if (dateEl) dateEl.value = now.toISOString().slice(0,10);
    alert('Time reset to real time ✅');
  },

  refreshStorage() {
    const usage = OS.getStorageUsage();
    const labels = {
      'kidsOS_settings': '⚙️ Settings',
      'kidsOS_fs': '📁 Files',
      'kidsOS_chat': '💬 KidsChat',
      'kidsOS_snakeHi': '🐍 Snake High Score',
      'kidsOS_kidstagram': '📸 Kidstagram',
    };
    const el = document.getElementById('storage-usage-list');
    if (!el) return;

    function fmt(bytes) {
      if (bytes < 1024) return bytes + ' B';
      return (bytes / 1024).toFixed(1) + ' KB';
    }

    let html = '';
    OS.STORAGE_KEYS.forEach(key => {
      const bytes = usage.breakdown[key];
      const pct = usage.total > 0 ? (bytes / usage.total * 100) : 0;
      html += `<div class="storage-row">
        <span class="storage-label">${labels[key] || key}</span>
        <div class="storage-bar-wrap">
          <div class="storage-bar" style="width:${Math.max(pct, 2)}%"></div>
        </div>
        <span class="storage-size">${fmt(bytes)}</span>
      </div>`;
    });
    html += `<div class="storage-total">Total: <b>${fmt(usage.total)}</b></div>`;
    el.innerHTML = html;
  },

  factoryReset() {
    if (!confirm('⚠️ Are you sure you want to factory reset?\n\nThis will delete ALL your saved data:\n• Files & documents\n• Settings & wallpaper\n• Chat history\n• Game scores\n• Kidstagram data\n\nThis cannot be undone!')) return;
    if (!confirm('🗑️ Last chance! Really erase everything?')) return;
    OS.factoryReset();
    // Close all windows
    document.querySelectorAll('.window').forEach(w => {
      const id = w.id.replace('window_', '');
      OS.closeWindow(id);
    });
    alert('✅ Factory reset complete!\nKidsOS has been restored to defaults.');
  },

  checkForUpdate() {
    const statusEl = document.getElementById('update-status');
    const applyBtn = document.getElementById('update-apply-btn');
    const checkBtn = document.getElementById('update-check-btn');
    if (!statusEl) return;

    if (!('serviceWorker' in navigator)) {
      statusEl.innerHTML = '⚠️ Service Worker not supported in this browser.';
      return;
    }

    // file:// protocol doesn't support service workers
    if (window.location.protocol === 'file:') {
      statusEl.innerHTML = '⚠️ Updates require a web server.<br><span style="font-size:12px;color:#888">KidsOS is running from a local file. To enable updates, serve it via a web server (localhost or HTTPS).</span>';
      return;
    }

    statusEl.innerHTML = '🔍 Checking for updates...';
    checkBtn.disabled = true;

    // Try to get existing registration, or register if missing
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) return reg;
      // No registration — try to register now
      return navigator.serviceWorker.register('sw.js');
    }).then(reg => {
      // Force the SW to check for a new version on the server
      return reg.update().then(() => {
        if (reg.waiting) {
          statusEl.innerHTML = '✅ <b>Update available!</b> A new version is ready to install.';
          applyBtn.style.display = 'inline-block';
        } else if (reg.installing) {
          statusEl.innerHTML = '⬇️ Downloading update...';
          reg.installing.addEventListener('statechange', function() {
            if (this.state === 'installed') {
              statusEl.innerHTML = '✅ <b>Update available!</b> A new version is ready to install.';
              applyBtn.style.display = 'inline-block';
            }
          });
        } else {
          statusEl.innerHTML = '👍 KidsOS is up to date!';
        }
        checkBtn.disabled = false;
      });
    }).catch(err => {
      statusEl.innerHTML = '❌ Could not check for updates. Are you online?';
      checkBtn.disabled = false;
    });
  },

  applyUpdate() {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.waiting) {
        // Tell the waiting SW to skip waiting and take over
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    // Reload once the new SW activates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  },

  forceReload() {
    if (!confirm('This will clear all cached app files and reload KidsOS.\nYour saved data (files, settings, chat) will NOT be affected.\n\nProceed?')) return;
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  },

  saveUsername() {
    const el = document.getElementById('settings-username');
    if (!el) return;
    const name = el.value.trim();
    if (!name) { alert('Please enter a username!'); return; }
    OS.saveSettings({ username: name });
    OS.updateMenuUsername();
    alert(`Username saved: "${name}" ✅`);
  },
};
