/* ===== Notepad App ===== */
// All app files share one scope for a top-level const. The block keeps `t` inside this file.
// `var` puts NotepadApp into the shared scope: the markup calls it.
{
const t = OS.texts('notepad');

OS.registerApp('notepad', {
  singleInstance: false,

  getWindowOpts() {
    return {
      id: 'notepad_' + Date.now(),
      title: t('Notepad'),
      icon: '📝',
      width: 520,
      height: 400,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="notepad-wrap">
      <div class="notepad-toolbar">
        <select onchange="NotepadApp.setFont(this.value, this.closest('.notepad-wrap'))">
          <option value="'Consolas',monospace">${t('Monospace')}</option>
          <option value="'Segoe UI',sans-serif">${t('Sans-serif')}</option>
          <option value="Georgia,serif">${t('Serif')}</option>
          <option value="'Comic Sans MS',cursive">${t('Comic Sans')}</option>
        </select>
        <select onchange="NotepadApp.setSize(this.value, this.closest('.notepad-wrap'))">
          <option value="13">${t('{n}px', { n: 13 })}</option>
          <option value="16" selected>${t('{n}px', { n: 16 })}</option>
          <option value="20">${t('{n}px', { n: 20 })}</option>
          <option value="24">${t('{n}px', { n: 24 })}</option>
          <option value="32">${t('{n}px', { n: 32 })}</option>
        </select>
        <input type="color" value="#000000" title="${t('Text Color')}"
               oninput="NotepadApp.setColor(this.value, this.closest('.notepad-wrap'))">
        <button onclick="NotepadApp.clearText(this.closest('.notepad-wrap'))">🗑 ${t('Clear')}</button>
        <button onclick="NotepadApp.copyText(this.closest('.notepad-wrap'))">📋 ${t('Copy')}</button>
        <button class="np-save-btn" onclick="NotepadApp.saveToOS(this.closest('.notepad-wrap'), this)">💾 ${t('Save')}</button>
        <button onclick="NotepadApp.download(this.closest('.notepad-wrap'))">⬇ ${t('Download')}</button>
      </div>
      <textarea class="notepad-ta" placeholder="${t('Start typing here...')} ✏️"
                oninput="NotepadApp.updateStatus(this.closest('.notepad-wrap'))"
                style="flex:1;border:none;outline:none;resize:none;padding:14px;font-size:16px;line-height:1.6;font-family:'Consolas',monospace;"></textarea>
      <div class="notepad-statusbar">
        <span class="np-status">${NotepadApp.statusText(0, 0, 0)}</span>
      </div>
    </div>`;
  },

  onOpen(id) {
    // If openWithFile was called just before, populate this new window
    if (NotepadApp._pending) {
      const { filePath, fileName, content } = NotepadApp._pending;
      NotepadApp._pending = null;
      setTimeout(() => {
        const body = document.getElementById('win-body-' + id);
        if (!body) return;
        const wrap = body.querySelector('.notepad-wrap');
        const ta = wrap && wrap.querySelector('textarea');
        if (ta) {
          ta.value = content;
          NotepadApp.updateStatus(wrap);
        }
        if (wrap) {
          wrap.dataset.filepath = filePath;
          wrap.dataset.filename = fileName;
        }
        // Update window title to show filename
        const titleEl = document.querySelector(`#window_${id} .win-title`);
        if (titleEl) titleEl.innerHTML = `<span class="win-title-icon">${OS.icon('notepad')}</span> ${fileName}`;
      }, 20);
    }
  },
  onClose() {},
});

var NotepadApp = {
  _pending: null,

  // Open notepad pre-loaded with a file from the OS filesystem
  openWithFile(filePath, fileName, content) {
    this._pending = { filePath, fileName, content };
    OS.launch('notepad');
  },

  getTA(wrap) { return wrap ? wrap.querySelector('textarea') : null; },

  setFont(f, wrap) {
    const ta = this.getTA(wrap);
    if (ta) ta.style.fontFamily = f;
  },
  setSize(s, wrap) {
    const ta = this.getTA(wrap);
    if (ta) ta.style.fontSize = s + 'px';
  },
  setColor(c, wrap) {
    const ta = this.getTA(wrap);
    if (ta) ta.style.color = c;
  },
  clearText(wrap) {
    const ta = this.getTA(wrap);
    if (ta) { ta.value = ''; this.updateStatus(wrap); }
  },
  copyText(wrap) {
    const ta = this.getTA(wrap);
    if (!ta) return;
    navigator.clipboard.writeText(ta.value).catch(() => {
      ta.select(); document.execCommand('copy');
    });
  },

  download(wrap) {
    const ta = this.getTA(wrap);
    if (!ta) return;
    const name = wrap.dataset.filename || (t('note') + '_' + new Date().toISOString().slice(0,10) + '.txt');
    const blob = new Blob([ta.value], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  },

  saveToOS(wrap, btn) {
    const ta = this.getTA(wrap);
    if (!ta) return;
    const content = ta.value;

    const filePath = wrap.dataset.filepath;
    const fileName = wrap.dataset.filename;

    if (filePath && fileName) {
      // Overwrite existing file
      const ok = FM.writeFile(filePath, fileName, content);
      if (ok) {
        this._flashSaved(btn, '✅ ' + t('Saved'));
      } else {
        alert(t('Could not save file. It may have been deleted.'));
      }
    } else {
      // Save As — ask for filename, save to Documents
      const name = prompt(t('Save as (filename):'), t('note') + '.txt');
      if (!name || !name.trim()) return;
      const safeName = name.trim().replace(/[/\\:*?"<>|]/g, '_');
      const finalName = safeName.includes('.') ? safeName : safeName + '.txt';
      if (!FM.saveNewFile('documents', finalName, content)) { alert(t('Could not save file. It may have been deleted.')); return; }
      wrap.dataset.filepath = 'documents';
      wrap.dataset.filename = finalName;
      // Update window title
      const titleEl = wrap.closest('.window')?.querySelector('.win-title');
      if (titleEl) titleEl.innerHTML = `<span class="win-title-icon">${OS.icon('notepad')}</span> ${finalName}`;
      this._flashSaved(btn, '✅ ' + t('Saved'));
    }
  },

  _flashSaved(btn, msg) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
  },

  updateStatus(wrap) {
    if (!wrap) return;
    const ta = this.getTA(wrap);
    const status = wrap.querySelector('.np-status');
    if (!ta || !status) return;
    const text = ta.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 1;
    status.textContent = this.statusText(chars, words, lines);
  },

  // English has one word form for each number, as before. Serbian has 3 forms.
  statusText(chars, words, lines) {
    return [
      t('{n} {things}', { n: chars, things: t.plural(chars, 'characters', 'characters') }),
      t('{n} {things}', { n: words, things: t.plural(words, 'words', 'words') }),
      t('{n} {things}', { n: lines, things: t.plural(lines, 'lines', 'lines') }),
    ].join(' · ');
  },
};
}
