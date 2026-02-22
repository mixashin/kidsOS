/* ===== Paint App ===== */
OS.registerApp('paint', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'paint',
      title: 'Paint',
      icon: '🎨',
      width: 680,
      height: 520,
      content: this.getHTML(),
    };
  },

  getHTML() {
    const colors = [
      '#000000','#ffffff','#ff0000','#00aa00','#0000ff',
      '#ffff00','#ff8800','#aa00aa','#00aaaa','#884400',
      '#ff88aa','#88ffaa','#aaaaff','#ffaa44','#44ffff',
    ];
    const colorBtns = colors.map(c => `
      <div class="paint-color-btn ${c==='#000000'?'active':''}"
           style="background:${c}"
           onclick="PaintApp.setColor('${c}',this)"
           title="${c}"></div>`).join('');

    return `
    <div class="paint-wrap">
      <div class="paint-toolbar">
        <button class="paint-tool-btn active" onclick="PaintApp.setTool('pencil',this)" title="Pencil">✏️</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('brush',this)" title="Brush">🖌️</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('eraser',this)" title="Eraser">🧹</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('line',this)" title="Line">╱</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('rect',this)" title="Rectangle">▭</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('circle',this)" title="Circle">◯</button>
        <button class="paint-tool-btn" onclick="PaintApp.setTool('fill',this)" title="Fill">🪣</button>
        <div class="paint-sep"></div>
        ${colorBtns}
        <input type="color" id="paint-color-picker" value="#000000" title="Custom color"
               oninput="PaintApp.setColorFromPicker(this.value)">
        <div class="paint-sep"></div>
        <span class="paint-size-label">Size:</span>
        <input type="range" id="paint-size" min="1" max="40" value="4"
               oninput="PaintApp.setSize(this.value)">
        <div class="paint-sep"></div>
        <div class="paint-actions">
          <button class="paint-action-btn" onclick="PaintApp.clear()">🗑 Clear</button>
          <button class="paint-action-btn" onclick="PaintApp.undo()">↩ Undo</button>
          <button class="paint-action-btn paint-save-btn" onclick="PaintApp.saveToOS(this)">💾 Save</button>
          <button class="paint-action-btn" onclick="PaintApp.download()">⬇ Download</button>
        </div>
      </div>
      <div class="paint-canvas-wrap">
        <canvas id="paint-canvas" width="800" height="600"></canvas>
      </div>
    </div>`;
  },

  onOpen() { PaintApp.init(); },
  onClose() { PaintApp.destroy(); },
});

const PaintApp = (() => {
  let canvas, ctx;
  let tool = 'pencil';
  let color = '#000000';
  let size = 4;
  let drawing = false;
  let startX, startY;
  let history = [];
  let snapshot = null;
  let currentFile = null; // { name } when saved to OS

  function init() {
    setTimeout(() => {
      canvas = document.getElementById('paint-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
      bindEvents();
    }, 50);
  }

  function destroy() {
    canvas = null; ctx = null; history = []; currentFile = null;
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      onDown(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      onMove(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      onUp(e.changedTouches[0]);
    }, { passive: false });
    canvas.addEventListener('touchcancel', onUp);
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    // Support both mouse events and touch events (which pass a Touch object)
    const clientX = e.clientX;
    const clientY = e.clientY;
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY,
    };
  }

  function onDown(e) {
    drawing = true;
    const pos = getPos(e);
    startX = pos.x; startY = pos.y;

    if (tool === 'fill') {
      floodFill(Math.round(pos.x), Math.round(pos.y), color);
      saveHistory();
      return;
    }

    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (tool === 'brush' ? size * 2 : size) / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.fill();
    }
  }

  function onMove(e) {
    if (!drawing) return;
    const pos = getPos(e);

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'brush' ? size * 2.5 : size;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      // Shape preview
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
      } else if (tool === 'circle') {
        const rx = (pos.x - startX) / 2, ry = (pos.y - startY) / 2;
        ctx.beginPath();
        ctx.ellipse(startX + rx, startY + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function onUp(e) {
    if (!drawing) return;
    drawing = false;
    ctx.beginPath();
    saveHistory();
  }

  function saveHistory() {
    if (!ctx) return;
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 20) history.shift();
  }

  function undo() {
    if (history.length > 1) {
      history.pop();
      ctx.putImageData(history[history.length - 1], 0, 0);
    }
  }

  function clear() {
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }

  function saveToOS(btn) {
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');

    if (currentFile) {
      // Overwrite existing file in Pictures
      FM.writeFile('pictures', currentFile.name, dataURL);
      flashBtn(btn, '✅ Saved');
    } else {
      // Save As — prompt for name
      const input = prompt('Save as (filename):', 'drawing.png');
      if (!input || !input.trim()) return;
      let name = input.trim().replace(/[/\\:*?"<>|]/g, '_');
      if (!name.toLowerCase().endsWith('.png')) name += '.png';
      FM.saveNewFile('pictures', name, dataURL);
      currentFile = { name };
      // Update window title
      const win = canvas.closest('.window');
      const titleEl = win && win.querySelector('.win-title');
      if (titleEl) titleEl.innerHTML = `<span class="win-title-icon">🎨</span> ${name}`;
      flashBtn(btn, '✅ Saved');
    }
  }

  function download() {
    if (!canvas) return;
    const name = currentFile ? currentFile.name : ('drawing_' + Date.now() + '.png');
    const a = document.createElement('a');
    a.download = name;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function flashBtn(btn, msg) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
  }

  function setTool(t, btn) {
    tool = t;
    document.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function setColor(c, btn) {
    color = c;
    document.querySelectorAll('.paint-color-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const picker = document.getElementById('paint-color-picker');
    if (picker) picker.value = c;
  }

  function setColorFromPicker(c) {
    color = c;
    document.querySelectorAll('.paint-color-btn').forEach(b => b.classList.remove('active'));
  }

  function setSize(s) { size = parseInt(s); }

  // Flood fill (bucket tool)
  function floodFill(x, y, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const idx = (y * canvas.width + x) * 4;
    const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2];

    const r = parseInt(fillColor.slice(1,3), 16);
    const g = parseInt(fillColor.slice(3,5), 16);
    const b = parseInt(fillColor.slice(5,7), 16);

    if (r === targetR && g === targetG && b === targetB) return;

    const stack = [[x, y]];
    const w = canvas.width, h = canvas.height;

    function matches(i) {
      return data[i] === targetR && data[i+1] === targetG && data[i+2] === targetB;
    }

    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const ci = (cy * w + cx) * 4;
      if (!matches(ci)) continue;
      data[ci] = r; data[ci+1] = g; data[ci+2] = b; data[ci+3] = 255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function openWithFile(path, name, content) {
    OS.launch('paint');
    setTimeout(() => {
      if (!canvas || !ctx) return;
      if (content && content.startsWith('data:')) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          saveHistory();
        };
        img.src = content;
      }
      currentFile = { name };
      const win = canvas.closest('.window');
      const titleEl = win && win.querySelector('.win-title');
      if (titleEl) titleEl.innerHTML = `<span class="win-title-icon">🎨</span> ${name}`;
    }, 150);
  }

  return { init, destroy, setTool, setColor, setColorFromPicker, setSize, clear, undo, saveToOS, download, openWithFile };
})();
