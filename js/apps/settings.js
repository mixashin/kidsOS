/* ===== Settings App ===== */
// All app files share one scope for a top-level const. The block keeps t inside this file.
// var puts SettingsApp into the shared scope: the markup calls it (onclick).
{
const t = OS.texts('settings');

OS.registerApp('settings', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'settings',
      title: t('Settings'),
      icon: '⚙️',
      width: 560,
      height: 420,
      content: this.getHTML(),
    };
  },

  getHTML() {
    const s = OS.getSettings();
    const wallpapers = OS.getWallpapers();
    const gradientPreviews = wallpapers.map(wp => `
      <div class="wp-option ${s.wallpaper === wp.id ? 'selected' : ''}"
           style="background:${wp.look} center / cover"
           onclick="SettingsApp.selectWallpaper('${wp.id}', this)"><b>${wp.name}</b></div>`).join('');

    const accentSwatches = OS.accentColors().map(c => `
      <div class="accent-option ${s.accentColor === c.hex ? 'active' : ''}"
           style="background:${c.hex}" data-color="${c.hex}"
           onclick="SettingsApp.setAccent('${c.hex}')"
           title="${c.name}"></div>`).join('');

    const now = new Date();
    const timeStr = now.toTimeString().slice(0,5);
    const dateStr = now.toISOString().slice(0,10);

    return `
    <div class="settings-wrap">
      <div class="settings-sidebar">
        <div class="settings-sidebar-item active" onclick="SettingsApp.showPanel('personalize', this)">
          🖼️ ${t('Appearance')}
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('datetime', this)">
          🕐 ${t('Date & Time')}
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('account', this)">
          👤 ${t('Account')}
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('storage', this)">
          💾 ${t('Storage')}
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('updates', this)">
          🔄 ${t('Updates')}
        </div>
        <div class="settings-sidebar-item" onclick="SettingsApp.showPanel('about', this)">
          ℹ️ ${t('About')}
        </div>
      </div>

      <!-- Appearance Panel -->
      <div class="settings-panel active" id="panel-personalize">
        <h2>🖼️ ${t('Appearance')}</h2>
        <div class="settings-group">
          <label>${t('Language')}</label>
          <div class="lang-options">
            <button type="button" class="lang-option ${OS.lang() === 'en' ? 'active' : ''}" data-lang="en" onclick="SettingsApp.setLanguage('en')">English</button>
            <button type="button" class="lang-option ${OS.lang() === 'sr' ? 'active' : ''}" data-lang="sr" lang="sr-Cyrl" onclick="SettingsApp.setLanguage('sr')">Српски</button>
          </div>
        </div>
        <div class="settings-group">
          <label>${t('Wallpaper')}</label>
          <div class="wallpaper-grid">${gradientPreviews}</div>
        </div>
        <div class="settings-group">
          <label>${t('Theme')}</label>
          <div class="theme-options">
            <div class="theme-option ${s.theme !== 'dark' ? 'active' : ''}" onclick="SettingsApp.setTheme('light')">
              <span>☀️</span> ${t('Day')}
            </div>
            <div class="theme-option ${s.theme === 'dark' ? 'active' : ''}" onclick="SettingsApp.setTheme('dark')">
              <span>🌙</span> ${t('theme|Night')}
            </div>
          </div>
        </div>
        <div class="settings-group">
          <label>${t('Accent Color')}</label>
          <div class="accent-options">${accentSwatches}</div>
        </div>
      </div>

      <!-- Date & Time Panel -->
      <div class="settings-panel" id="panel-datetime">
        <h2>🕐 ${t('Date & Time')}</h2>
        <div class="settings-group">
          <label>${t('Set Time (HH:MM)')}</label>
          <input type="time" id="settings-time" value="${timeStr}">
        </div>
        <div class="settings-group">
          <label>${t('Set Date')}</label>
          <input type="date" id="settings-date" value="${dateStr}">
        </div>
        <button class="settings-btn" onclick="SettingsApp.saveDateTime()">${t('Apply Date & Time')}</button>
        <br><br>
        <button class="settings-btn" style="background:#888" onclick="SettingsApp.resetDateTime()">${t('Reset to Real Time')}</button>
      </div>

      <!-- Account Panel -->
      <div class="settings-panel" id="panel-account">
        <h2>👤 ${t('Account')}</h2>
        <div class="settings-group">
          <label>${t('Username')}</label>
          <input type="text" id="settings-username" value="${OS.esc(OS.userName())}"
                 placeholder="${t('Enter your name')}" maxlength="20">
        </div>
        <button class="settings-btn" onclick="SettingsApp.saveUsername()">${t('Save Username')}</button>
        <div style="margin-top:20px;padding:12px;background:var(--surface-bg);border-radius:8px">
          <strong>${t('Current User:')}</strong> ${OS.esc(OS.userName())}
        </div>
      </div>

      <!-- Storage Panel -->
      <div class="settings-panel" id="panel-storage">
        <h2>💾 ${t('Storage')}</h2>
        <div class="settings-group">
          <label>${t('Storage Usage')}</label>
          <div id="storage-usage-list" class="storage-usage-list"></div>
        </div>
        <div class="settings-group">
          <button class="settings-btn" onclick="SettingsApp.refreshStorage()">🔄 ${t('Refresh')}</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border-color);margin:16px 0">
        <div class="settings-group">
          <label style="color:#c00">${t('Factory Reset')}</label>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
            ${t('This will erase <b>all</b> your saved data: files, settings, chat history, game scores, and Kidstagram data. This cannot be undone!')}
          </p>
          <button class="settings-btn settings-btn-danger" onclick="SettingsApp.factoryReset()">🗑️ ${t('Factory Reset')}</button>
        </div>
      </div>

      <!-- Updates Panel -->
      <div class="settings-panel" id="panel-updates">
        <h2>🔄 ${t('Updates')}</h2>
        <div class="settings-group">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
            ${t('Check if a newer version of KidsOS is available. Requires an internet connection.')}
          </p>
          <div id="update-status" style="padding:12px;background:var(--surface-bg);border-radius:8px;font-size:13px;color:var(--text-secondary);margin-bottom:12px">
            ${t('Current version: v{version} — Not checked yet', { version: OS.VERSION })}
          </div>
          <button class="settings-btn" id="update-check-btn" onclick="SettingsApp.checkForUpdate()">🔍 ${t('Check for Updates')}</button>
          <button class="settings-btn" id="update-apply-btn" onclick="SettingsApp.applyUpdate()" style="display:none;margin-left:8px;background:#4caf50">⬇️ ${t('Update Now')}</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border-color);margin:16px 0">
        <div class="settings-group">
          <label>${t('Force Reload')}</label>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
            ${t('Clear all cached files and reload KidsOS. Use this if the app feels stuck on an old version.')}
          </p>
          <button class="settings-btn" style="background:#ff9800" onclick="SettingsApp.forceReload()">🔁 ${t('Force Reload')}</button>
        </div>
      </div>

      <!-- About Panel -->
      <div class="settings-panel" id="panel-about">
        <h2>ℹ️ ${t('About KidsOS')}</h2>
        <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
          <div style="text-align:center"><img src="art/mascot/hello.webp" alt="" draggable="false" style="width:96px;height:96px"></div>
          <div style="text-align:center">
            <strong style="font-size:22px">KidsOS</strong><br>
            <span style="color:var(--text-muted)">${t('Version {version}', { version: OS.VERSION })}</span>
          </div>
          <div style="background:var(--surface-bg);border-radius:8px;padding:14px;font-size:14px;color:var(--text-primary);line-height:1.8">
            ${t('<b>KidsOS</b> is a fun, educational operating system simulator designed to help children learn how to use computers!')}<br><br>
            🎯 <b>${t('Apps included:')}</b><br>
            ${OS.APPS.map(a => OS.appName(a.id)).join(' · ')}
          </div>
          <div style="text-align:center;color:var(--text-muted);font-size:13px">${t('Built with HTML, CSS & JavaScript')} ❤️</div>
          <button class="settings-btn settings-btn-danger" style="align-self:center" onclick="OS.shutdown()">⏻ ${t('Shut down')}</button>
        </div>
      </div>
    </div>`;
  },

  onOpen() {},
  onClose() {},
});

var SettingsApp = {
  showPanel(name, sidebarEl) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.settings-sidebar-item').forEach(i => i.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('active');
    if (sidebarEl) sidebarEl.classList.add('active');
    if (name === 'storage') this.refreshStorage();
  },

  setTheme(theme) {
    OS.saveSettings({ theme });
    document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.theme-option:${theme === 'dark' ? 'last-child' : 'first-child'}`);
    if (activeEl) activeEl.classList.add('active');
  },

  setAccent(hex) {
    OS.saveSettings({ accentColor: hex });
    document.querySelectorAll('.accent-option').forEach(el => {
      el.classList.toggle('active', el.dataset.color === hex);
    });
  },

  // The texts of the open screens are in the old language, so the app starts again.
  // The question is in both languages: the person who changes the language can read one of them.
  setLanguage(code) {
    if (code === OS.lang()) return;
    if (!confirm('Change the language? The app starts again.\n\nПромена језика? Апликација се покреће поново.')) return;
    OS.setLanguage(code);
  },

  selectWallpaper(id, el) {
    document.querySelectorAll('.wp-option').forEach(w => w.classList.remove('selected'));
    if (el) el.classList.add('selected');
    OS.saveSettings({ wallpaper: id });
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
    alert(t('Date & Time updated!') + ' ✅');
  },

  resetDateTime() {
    OS.saveSettings({ timeOffset: 0, dateOverride: null });
    const now = new Date();
    const timeEl = document.getElementById('settings-time');
    const dateEl = document.getElementById('settings-date');
    if (timeEl) timeEl.value = now.toTimeString().slice(0,5);
    if (dateEl) dateEl.value = now.toISOString().slice(0,10);
    alert(t('Time reset to real time') + ' ✅');
  },

  refreshStorage() {
    const usage = OS.getStorageUsage();
    const labels = {
      'kidsOS_settings': '⚙️ ' + t('Settings'),
      'kidsOS_fs': '📁 ' + t('Files'),
      'kidsOS_chat': '💬 ' + t('KidsChat'),
      'kidsOS_snakeHi': '🐍 ' + t('Snake High Score'),
      'kidsOS_kidstagram': '📸 ' + t('Kidstagram'),
      'kidsOS_tinyscanner': '🔍 ' + t('TinyScanner'),
    };
    // Each other key: the name of the app that owns it (kidsOS_tinybank, kidsOS_kidflix)
    const owner = key => {
      const rest = key.replace('kidsOS_', '').toLowerCase();
      const app = OS.APPS.find(a => rest === a.id || rest.startsWith(a.id));
      return app ? OS.appName(app.id) : OS.esc(key);
    };
    const el = document.getElementById('storage-usage-list');
    if (!el) return;

    function fmt(bytes) {
      if (bytes < 1024) return bytes + ' ' + t('B');
      return (bytes / 1024).toFixed(1) + ' ' + t('KB');
    }

    let html = '';
    Object.keys(usage.breakdown).forEach(key => {
      const bytes = usage.breakdown[key];
      const pct = usage.total > 0 ? (bytes / usage.total * 100) : 0;
      html += `<div class="storage-row">
        <span class="storage-label">${labels[key] || owner(key)}</span>
        <div class="storage-bar-wrap">
          <div class="storage-bar" style="width:${Math.max(pct, 2)}%"></div>
        </div>
        <span class="storage-size">${fmt(bytes)}</span>
      </div>`;
    });
    html += `<div class="storage-total">${t('Total:')} <b>${fmt(usage.total)}</b></div>`;
    el.innerHTML = html;
  },

  factoryReset() {
    if (!confirm('⚠️ ' + t('Are you sure you want to factory reset?\n\nThis will delete ALL your saved data:\n• Files & documents\n• Settings & wallpaper\n• Chat history\n• Game scores\n• Kidstagram data\n\nThis cannot be undone!'))) return;
    if (!confirm('🗑️ ' + t('Last chance! Really erase everything?'))) return;
    const other = OS.lang() !== 'en';
    OS.factoryReset(); // also closes all windows
    alert('✅ ' + t('Factory reset complete!\nKidsOS has been restored to defaults.'));
    // A new device has English. The texts on the screen are in the old language: start again
    if (other) location.reload();
  },

  checkForUpdate() {
    const statusEl = document.getElementById('update-status');
    const applyBtn = document.getElementById('update-apply-btn');
    const checkBtn = document.getElementById('update-check-btn');
    if (!statusEl) return;

    statusEl.innerHTML = '🔍 ' + t('Checking for updates...');
    checkBtn.disabled = true;

    OS.checkForUpdate().then(remote => {
      const local = OS.VERSION;

      if (remote.available) {
        statusEl.innerHTML = `✅ <b>${t('Update available!')}</b><br>
          <span style="font-size:12px">${t('Current: v{now} → New: v{next}', { now: OS.esc(local), next: OS.esc(remote.version) })}</span>
          ${remote.build ? '<br><span style="font-size:12px;color:#888">' + t('Build: {build}', { build: OS.esc(remote.build) }) + '</span>' : ''}`;
        applyBtn.style.display = 'inline-block';
      } else {
        statusEl.innerHTML = `👍 ${t('KidsOS is up to date!')} <span style="font-size:12px">${t('(v{version})', { version: OS.esc(local) })}</span>`;
        applyBtn.style.display = 'none';
      }
    }).catch(() => {
      statusEl.innerHTML = '❌ ' + t('Could not check for updates. Are you online?');
    }).finally(() => {
      checkBtn.disabled = false;
    });
  },

  applyUpdate() {
    const applyBtn = document.getElementById('update-apply-btn');
    if (applyBtn) { applyBtn.textContent = '⏳ ' + t('Updating...'); applyBtn.disabled = true; }
    OS.applyUpdate();
  },

  forceReload() {
    if (!confirm(t('This will clear all cached app files and reload KidsOS.\nYour saved data (files, settings, chat) will NOT be affected.\n\nProceed?'))) return;
    OS._nukeAndReload();
  },

  saveUsername() {
    const el = document.getElementById('settings-username');
    if (!el) return;
    const name = el.value.trim();
    if (!name) { alert(t('Please enter a username!')); return; }
    OS.saveSettings({ username: name });
    OS.updateMenuUsername();
    alert(t('Username saved: "{name}"', { name }) + ' ✅');
  },
};
}
