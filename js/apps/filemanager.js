/* ===== File Manager App ===== */
OS.registerApp('filemanager', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'filemanager',
      title: 'File Manager',
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
        <button onclick="FM.goBack()">◀ Back</button>
        <button onclick="FM.goHome()">🏠 Home</button>
        <input class="fm-path" id="fm-path" readonly value="/home/kidsuser">
        <button onclick="FM.newFolder()">📁+ New Folder</button>
        <button onclick="FM.newFile()">📄+ New File</button>
      </div>
      <div class="fm-body">
        <div class="fm-sidebar">
          <div class="fm-sidebar-item active" onclick="FM.navigate('home')">🏠 Home</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('documents')">📄 Documents</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('pictures')">🖼️ Pictures</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('music')">🎵 Music</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('videos')">🎬 Videos</div>
          <div class="fm-sidebar-item" onclick="FM.navigate('trash')">🗑️ Trash</div>
        </div>
        <div class="fm-files" id="fm-files" oncontextmenu="FM.onContextMenu(event)"></div>
      </div>
      <div class="fm-statusbar"><span id="fm-status">Loading...</span></div>
    </div>`;
  },

  onOpen() { FM.init(); },
  onClose() {},
});

const FM = (() => {
  // Virtual file system stored in localStorage
  const FS_KEY = 'kidsOS_fs';
  let currentPath = 'home';
  let history = [];
  let selected = null;

  const defaultFS = {
    home: {
      type: 'folder',
      children: {
        'documents': { type: 'folder', children: {
          'my_story.txt': { type: 'file', ext: 'txt', content: 'Once upon a time...' },
          'homework.txt': { type: 'file', ext: 'txt', content: 'Math homework:\n1+1=2' },
        }},
        'pictures': { type: 'folder', children: {
          'drawing1.png': { type: 'file', ext: 'png', content: '' },
          'photo.jpg': { type: 'file', ext: 'jpg', content: '' },
        }},
        'music': { type: 'folder', children: {
          'my_song.mp3': { type: 'file', ext: 'mp3', content: '' },
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

  function pathLabel(p) {
    const map = { home: '/home/kidsuser', documents: 'Documents', pictures: 'Pictures', music: 'Music', videos: 'Videos', trash: 'Trash' };
    return '/home/kidsuser/' + (map[p] || p);
  }

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
      container.innerHTML = '<div style="padding:20px;color:#999;grid-column:1/-1">Empty folder</div>';
      if (statusEl) statusEl.textContent = '0 items';
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
      div.innerHTML = `<div class="file-icon">${fileIcon(name, item.type)}</div><span>${name}</span>`;

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
          if (statusEl) statusEl.textContent = `"${name}" — tap again to open`;
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

    if (statusEl) statusEl.textContent = `${entries.length} item${entries.length !== 1 ? 's' : ''}`;
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
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;
    const safeName = name.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNode(currentPath);
    if (!node.children) node.children = {};
    if (node.children[safeName]) { alert('Name already exists!'); return; }
    node.children[safeName] = { type: 'folder', children: {} };
    saveFS(fs);
    render();
  }

  function newFile() {
    const name = prompt('Enter file name (e.g. note.txt):');
    if (!name || !name.trim()) return;
    const safeName = name.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNode(currentPath);
    if (!node.children) node.children = {};
    if (node.children[safeName]) { alert('Name already exists!'); return; }
    const ext = safeName.split('.').pop().toLowerCase();
    node.children[safeName] = { type: 'file', ext, content: '' };
    saveFS(fs);
    render();
  }

  function renameItem(name) {
    const newName = prompt('Rename to:', name);
    if (!newName || !newName.trim() || newName === name) return;
    const safeName = newName.trim().replace(/[/\\:*?"<>|]/g, '_');
    const fs = loadFS();
    const node = getNode(currentPath);
    if (node.children[safeName]) { alert('Name already exists!'); return; }
    node.children[safeName] = node.children[name];
    delete node.children[name];
    saveFS(fs);
    render();
  }

  function deleteItem(name) {
    if (!confirm(`Delete "${name}"?`)) return;
    const fs = loadFS();
    const node = getNode(currentPath);
    delete node.children[name];
    saveFS(fs);
    render();
  }

  function showFileMenu(e, name, item) {
    e.preventDefault();
    OS.showContextMenu([
      { icon: item.type === 'folder' ? '📂' : '📄', label: 'Open', action: () => {
        if (item.type === 'folder') navigate(currentPath === 'home' ? name : currentPath + '/' + name);
        else openFile(name, item);
      }},
      'sep',
      { icon: '✏️', label: 'Rename', action: () => renameItem(name) },
      { icon: '🗑️', label: 'Delete', action: () => deleteItem(name) },
    ], e.clientX, e.clientY);
  }

  function onContextMenu(e) {
    e.preventDefault();
    OS.showContextMenu([
      { icon: '📁', label: 'New Folder', action: newFolder },
      { icon: '📄', label: 'New File', action: newFile },
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
