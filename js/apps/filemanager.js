/* ===== File Manager App ===== */
// All app files share one scope for a top-level const. The block keeps `t` inside this file.
// `var` puts FM into the shared scope: the markup, Notepad, and Paint call it.
{
const t = OS.texts('filemanager');

OS.registerApp('filemanager', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'filemanager',
      title: t('File Manager'),
      icon: '📁',
      width: 620,
      height: 420,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="fm-wrap">
      <div class="fm-toolbar">
        <button onclick="FM.goBack()">◀ ${t('Back')}</button>
        <button onclick="FM.goHome()">🏠 ${t('Home')}</button>
        <input class="fm-path" id="fm-path" readonly value="${t('/home/kidsuser')}">
        <button onclick="FM.newFolder()">📁+ ${t('New Folder')}</button>
        <button onclick="FM.newFile()">📄+ ${t('New File')}</button>
      </div>
      <div class="fm-body">
        <div class="fm-sidebar">
          <div class="fm-sidebar-item active" onclick="FM.navigate('home')">🏠 ${t('Home')}</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('documents')">📄 ${t('Documents')}</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('pictures')">🖼️ ${t('Pictures')}</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('music')">🎵 ${t('Music')}</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('videos')">🎬 ${t('Videos')}</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('trash')">🗑️ ${t('Trash')}</div>
        </div>
        <div class="fm-files" id="fm-files" oncontextmenu="FM.onContextMenu(event)"></div>
      </div>
      <div class="fm-statusbar"><span id="fm-status">${t('Loading...')}</span></div>
    </div>`;
  },

  onOpen() { FM.init(); },
  onClose() {},
});

var FM = (() => {
  // Virtual file system stored in localStorage
  const FS_KEY = 'kidsOS_fs';
  let currentPath = 'home';
  let history = [];
  let selected = null;

  // Start content of a new device, in the language of the device.
  // The names of the 5 folders are keys of the stored data: they do not change.
  const defaultFS = {
    home: {
      type: 'folder',
      children: {
        'documents': { type: 'folder', children: {
          [t('my_story') + '.txt']: { type: 'file', ext: 'txt', content: t('Once upon a time...') },
          [t('homework') + '.txt']: { type: 'file', ext: 'txt', content: t('Math homework:') + '\n1+1=2' },
        }},
        'pictures': { type: 'folder', children: {
          [t('drawing1') + '.png']: { type: 'file', ext: 'png', content: '' },
          [t('photo') + '.jpg']: { type: 'file', ext: 'jpg', content: '' },
        }},
        'music': { type: 'folder', children: {
          [t('my_song') + '.mp3']: { type: 'file', ext: 'mp3', content: '' },
        }},
        'videos': { type: 'folder', children: {} },
        'trash': { type: 'folder', children: {} },
      }
    }
  };

  function loadFS() {
    try {
      return JSON.parse(localStorage.getItem(FS_KEY)) || defaultFS;
    } catch(e) { return defaultFS; }
  }

  function saveFS(fs) {
    localStorage.setItem(FS_KEY, JSON.stringify(fs));
  }

  function getNode(path) {
    const fs = loadFS();
    const parts = path.split('/').filter(Boolean);
    let node = fs.home;
    for (const p of parts) {
      if (p === 'home') { node = fs.home; continue; }
      if (!node.children || !node.children[p]) return null;
      node = node.children[p];
    }
    return node;
  }

  function getParentNode(path) {
    const parts = path.split('/').filter(p => p && p !== 'home');
    if (parts.length === 0) return null;
    const parentPath = parts.slice(0, -1).join('/');
    return { node: getNode(parentPath || 'home'), name: parts[parts.length - 1] };
  }

  function fileIcon(name, type) {
    if (type === 'folder') return '📁';
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
      txt: '📄', md: '📄', js: '📜', html: '🌐', css: '🎨',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
      mp3: '🎵', wav: '🎵', ogg: '🎵',
      mp4: '🎬', avi: '🎬', mkv: '🎬',
      pdf: '📕', zip: '📦', json: '🔧',
    };
    return icons[ext] || '📄';
  }

  // A folder of the system has a key in the stored data, and a name that the child sees
  function shownName(name, path = currentPath) {
    const names = { documents: t('folder|documents'), pictures: t('folder|pictures'), music: t('folder|music'), videos: t('folder|videos'), trash: t('folder|trash') };
    return path === 'home' && Object.hasOwn(names, name) ? names[name] : name;
  }

  function pathLabel(p) {
    const map = { documents: t('Documents'), pictures: t('Pictures'), music: t('Music'), videos: t('Videos'), trash: t('Trash') };
    if (p === 'home') return t('/home/kidsuser');
    const parts = p.split('/');
    if (parts.length > 1) parts[0] = shownName(parts[0], 'home');
    return t('/home/kidsuser') + '/' + (map[p] || parts.join('/'));
  }

  const countText = n => t('{n} {items}', { n, items: t.plural(n, 'item', 'items') });

  function render() {
    const container = document.getElementById('fm-files');
    const pathEl = document.getElementById('fm-path');
    const statusEl = document.getElementById('fm-status');
    if (!container) return;

    // Update sidebar active state
    document.querySelectorAll('.fm-sidebar-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.fm-sidebar-item[onclick*="'${currentPath}'"]`);
    if (activeItem) activeItem.classList.add('active');

    if (pathEl) pathEl.value = pathLabel(currentPath);
    container.innerHTML = '';
    selected = null;

    const node = getNode(currentPath);
    if (!node || !node.children) {
      container.innerHTML = '<div style="padding:20px;color:#999;grid-column:1/-1">' + t('Empty folder') + '</div>';
      if (statusEl) statusEl.textContent = countText(0);
      return;
    }

    const entries = Object.entries(node.children).sort(([,a],[,b]) => {
      if (a.type === b.type) return 0;
      return a.type === 'folder' ? -1 : 1;
    });

    entries.forEach(([name, item]) => {
      const div = document.createElement('div');
      div.className = 'fm-file';
      div.dataset.name = name;
      div.innerHTML = `<div class="file-icon">${fileIcon(name, item.type)}</div><span>${shownName(name)}</span>`;

      let lastTapTime = 0;
      div.onclick = () => {
        const now = Date.now();
        const isDoubleClick = (now - lastTapTime) < 400;
        lastTapTime = now;

        if (isDoubleClick) {
          // Double-click or double-tap: open
          if (item.type === 'folder') {
            navigate(currentPath === 'home' ? name : currentPath + '/' + name);
          } else {
            openFile(name, item);
          }
        } else {
          // Single click/tap: select
          document.querySelectorAll('.fm-file').forEach(f => f.classList.remove('selected'));
          div.classList.add('selected');
          selected = name;
          if (statusEl) statusEl.textContent = t('"{name}" — tap again to open', { name: shownName(name) });
        }
      };

      div.oncontextmenu = (e) => {
        e.stopPropagation();
        selected = name;
        document.querySelectorAll('.fm-file').forEach(f => f.classList.remove('selected'));
        div.classList.add('selected');
        showFileMenu(e, name, item);
      };

      container.appendChild(div);
    });

    if (statusEl) statusEl.textContent = countText(entries.length);
  }

  function openFile(name, item) {
    if (item.ext === 'txt' || item.ext === 'md') {
      NotepadApp.openWithFile(currentPath, name, item.content || '');
    } else if (['png','jpg','jpeg','gif'].includes(item.ext)) {
      PaintApp.openWithFile(currentPath, name, item.content || '');
    }
  }

  function navigate(path) {
    history.push(currentPath);
    currentPath = path;
    render();
  }

  function goBack() {
    if (history.length > 0) {
      currentPath = history.pop();
      render();
    }
  }

  function goHome() { history = []; currentPath = 'home'; render(); }

  function newFolder() {
    const name = prompt(t('Enter folder name:'));
    if (!name || !name.trim()) return;
    const safeName = name.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNodeInFS(fs, currentPath);
    if (!node.children) node.children = {};
    if (node.children[safeName]) { alert(t('Name already exists!')); return; }
    node.children[safeName] = { type: 'folder', children: {} };
    saveFS(fs);
    render();
  }

  function newFile() {
    const name = prompt(t('Enter file name (e.g. {example}):', { example: t('note') + '.txt' }));
    if (!name || !name.trim()) return;
    const safeName = name.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNodeInFS(fs, currentPath);
    if (!node.children) node.children = {};
    if (node.children[safeName]) { alert(t('Name already exists!')); return; }
    const ext = safeName.split('.').pop().toLowerCase();
    node.children[safeName] = { type: 'file', ext, content: '' };
    saveFS(fs);
    render();
  }

  function renameItem(name) {
    const shown = shownName(name);
    const newName = prompt(t('Rename to:'), shown);
    if (!newName || !newName.trim() || newName === shown) return;
    const safeName = newName.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNodeInFS(fs, currentPath);
    if (node.children[safeName]) { alert(t('Name already exists!')); return; }
    node.children[safeName] = node.children[name];
    delete node.children[name];
    saveFS(fs);
    render();
  }

  function deleteItem(name) {
    if (!confirm(t('Delete "{name}"?', { name: shownName(name) }))) return;
    const fs = loadFS();
    const node = getNodeInFS(fs, currentPath);
    delete node.children[name];
    saveFS(fs);
    render();
  }

  function showFileMenu(e, name, item) {
    e.preventDefault();
    OS.showContextMenu([
      { icon: item.type === 'folder' ? '📂' : '📄', label: t('Open'), action: () => {
        if (item.type === 'folder') navigate(currentPath === 'home' ? name : currentPath + '/' + name);
        else openFile(name, item);
      }},
      'sep',
      { icon: '✏️', label: t('Rename'), action: () => renameItem(name) },
      { icon: '🗑️', label: t('Delete'), action: () => deleteItem(name) },
    ], e.clientX, e.clientY);
  }

  function onContextMenu(e) {
    e.preventDefault();
    OS.showContextMenu([
      { icon: '📁', label: t('New Folder'), action: newFolder },
      { icon: '📄', label: t('New File'), action: newFile },
    ], e.clientX, e.clientY);
  }

  function init() {
    currentPath = 'home';
    history = [];
    render();
  }

  // Write content to an existing file in the FS
  function writeFile(fsPath, name, content) {
    const fs = loadFS();
    const node = getNodeInFS(fs, fsPath);
    if (node && node.children && node.children[name]) {
      node.children[name].content = content;
      saveFS(fs);
      return true;
    }
    return false;
  }

  // Save a brand new file into a folder
  function saveNewFile(fsPath, name, content) {
    const fs = loadFS();
    const node = getNodeInFS(fs, fsPath);
    if (!node) return false;
    if (!node.children) node.children = {};
    const ext = name.split('.').pop().toLowerCase();
    node.children[name] = { type: 'file', ext, content };
    saveFS(fs);
    // Refresh file manager if it's showing that folder
    if (currentPath === fsPath) render();
    return true;
  }

  // Traverse a given FS object (not loading from localStorage)
  function getNodeInFS(fs, path) {
    const parts = path.split('/').filter(p => p && p !== 'home');
    let node = fs.home;
    for (const p of parts) {
      if (!node.children || !node.children[p]) return null;
      node = node.children[p];
    }
    return node;
  }

  return { init, navigate, goBack, goHome, newFolder, newFile, onContextMenu, render, writeFile, saveNewFile };
})();
}
