/* ===== QR — shows a text as a QR code, and reads a QR code with the camera =====
   Own code, no library. It makes what the pairing codes need and no more:
   - alphanumeric mode only: digits, capital letters, and space $ % * + - . / :
   - error correction level M
   - versions 1 to 10 (21 to 57 modules), up to 311 letters

   The reader is the BarcodeDetector of the browser. The picture of the camera stays on
   the device. */
const QR = (() => {
  const LETTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  // Level M, for each version: [correction bytes in each block, blocks, data bytes in each, more blocks, data bytes in each]
  const BLOCKS = [null,
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
  // Centers of the small marks (alignment patterns)
  const MARKS = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
    (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
    (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
  ];

  /* ---- Error correction (Reed-Solomon over GF(256)) ---- */
  const EXP = new Uint8Array(510), LOG = new Uint8Array(256);
  for (let i = 0, x = 1; i < 255; i++) {
    EXP[i] = EXP[i + 255] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  const times = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

  function correction(data, count) {
    let gen = [1];
    for (let i = 0; i < count; i++) {
      const next = new Array(gen.length + 1).fill(0);
      gen.forEach((g, j) => { next[j] ^= g; next[j + 1] ^= times(g, EXP[i]); });
      gen = next;
    }
    const rest = new Array(count).fill(0);
    for (const byte of data) {
      const factor = byte ^ rest.shift();
      rest.push(0);
      for (let j = 0; j < count; j++) rest[j] ^= times(gen[j + 1], factor);
    }
    return rest;
  }

  // Check bits for format (15 bits) and version (18 bits)
  function withCheck(value, length, divisor) {
    let rest = value;
    for (let i = 0; i < length; i++) rest = (rest << 1) ^ ((rest >>> (length - 1)) * divisor);
    return (value << length) | rest;
  }

  /* ---- Text to bytes ---- */
  function codewords(text, version) {
    const [extra, n1, d1, n2, d2] = BLOCKS[version];
    const capacity = (n1 * d1 + n2 * d2) * 8;
    const bits = [];
    const put = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
    put(2, 4); // alphanumeric mode
    put(text.length, version < 10 ? 9 : 11);
    for (let i = 0; i < text.length; i += 2) {
      const a = LETTERS.indexOf(text[i]);
      if (i + 1 < text.length) put(a * 45 + LETTERS.indexOf(text[i + 1]), 11); else put(a, 6);
    }
    if (bits.length > capacity) return null;
    put(0, Math.min(4, capacity - bits.length));
    put(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < capacity; pad ^= 0xfd) put(pad, 8); // 0xEC, 0x11, 0xEC, ...
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) bytes.push(bits.slice(i, i + 8).reduce((v, b) => v * 2 + b, 0));

    // Blocks, each with its correction bytes. Then one byte of each block in turn.
    const blocks = [];
    let at = 0;
    for (const [count, length] of [[n1, d1], [n2, d2]]) {
      for (let n = 0; n < count; n++) {
        const data = bytes.slice(at, at += length);
        blocks.push({ data, more: correction(data, extra) });
      }
    }
    const all = [];
    for (let i = 0; i < Math.max(d1, d2); i++) for (const b of blocks) if (i < b.data.length) all.push(b.data[i]);
    for (let i = 0; i < extra; i++) for (const b of blocks) all.push(b.more[i]);
    return all;
  }

  /* ---- Bytes to modules ---- */
  function penalty(dark, size) {
    let points = 0, total = 0;
    const rows = [], cols = [];
    for (let i = 0; i < size; i++) {
      let row = '', col = '';
      for (let j = 0; j < size; j++) { row += dark[i * size + j]; col += dark[j * size + i]; }
      rows.push(row);
      cols.push(col);
    }
    for (const line of [...rows, ...cols]) {
      for (const run of line.match(/0+|1+/g)) if (run.length >= 5) points += run.length - 2; // long runs of one color
      for (const like of ['10111010000', '00001011101']) {                                   // looks like a corner mark
        for (let from = line.indexOf(like); from >= 0; from = line.indexOf(like, from + 1)) points += 40;
      }
    }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {                   // blocks of one color
      const c = dark[y * size + x];
      if (c === dark[y * size + x + 1] && c === dark[(y + 1) * size + x] && c === dark[(y + 1) * size + x + 1]) points += 3;
    }
    for (const v of dark) total += v;
    return points + Math.floor(Math.abs(total * 20 - size * size * 10) / (size * size)) * 10; // too dark or too light
  }

  // Returns { version, size, dark: Uint8Array with size x size values 0 or 1 } or null
  function make(text) {
    if (typeof text !== 'string' || !text.length || [...text].some(ch => !LETTERS.includes(ch))) return null;
    let version = 1, all = null;
    while (version <= 10 && !(all = codewords(text, version))) version++;
    if (!all) return null;

    const size = 17 + 4 * version;
    const dark = new Uint8Array(size * size), fixed = new Uint8Array(size * size);
    const set = (x, y, on) => { dark[y * size + x] = on ? 1 : 0; fixed[y * size + x] = 1; };
    const ring = (dx, dy) => Math.max(Math.abs(dx), Math.abs(dy));

    // Corner marks with their white border
    for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, ring(dx, dy) !== 2 && ring(dx, dy) !== 4);
      }
    }
    // Small marks
    const centers = MARKS[version];
    for (const cy of centers) for (const cx of centers) {
      if (fixed[cy * size + cx]) continue; // a corner mark is there
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, ring(dx, dy) !== 1);
    }
    // Timing lines
    for (let i = 8; i < size - 8; i++) {
      if (!fixed[6 * size + i]) set(i, 6, i % 2 === 0);
      if (!fixed[i * size + 6]) set(6, i, i % 2 === 0);
    }
    // Version, from version 7
    if (version >= 7) {
      const bits = withCheck(version, 12, 0x1f25);
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + (i % 3), b = Math.floor(i / 3), on = (bits >>> i) & 1;
        set(a, b, on);
        set(b, a, on);
      }
    }
    // Format: level M is 0, then the mask. The places are reserved now and get their value for each mask.
    const format = mask => {
      const bits = withCheck(mask, 10, 0x537) ^ 0x5412;
      const bit = i => (bits >>> i) & 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, 1); // dark module
    };
    format(0);

    // Data: two columns at a time, from the right, up and down in turn
    let n = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // the column of the timing line
      for (let v = 0; v < size; v++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
          if (fixed[y * size + x]) continue;
          dark[y * size + x] = n < all.length * 8 ? (all[n >> 3] >>> (7 - (n & 7))) & 1 : 0;
          n++;
        }
      }
    }

    // The mask with the fewest penalty points
    let best = null;
    for (let mask = 0; mask < 8; mask++) {
      format(mask);
      const trial = dark.slice();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!fixed[y * size + x] && MASKS[mask](x, y)) trial[y * size + x] ^= 1;
      }
      const points = penalty(trial, size);
      if (!best || points < best.points) best = { points, mask, dark: trial };
    }
    return { version, size, mask: best.mask, dark: best.dark };
  }

  // Draws the code into a canvas, black on white, with the white border that a reader needs.
  // Returns false when the text does not fit.
  function draw(canvas, text) {
    const q = make(text);
    if (!q) return false;
    const BORDER = 4;
    const px = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / (q.size + BORDER * 2)));
    const left = Math.floor((canvas.width - q.size * px) / 2), top = Math.floor((canvas.height - q.size * px) / 2);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) {
      if (q.dark[y * q.size + x]) ctx.fillRect(left + x * px, top + y * px, px, px);
    }
    return true;
  }

  /* ---- Camera ---- */
  const canScan = () => 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Shows the camera in the video element and calls found(text) for each QR code that it sees,
  // until stop() is called. front: the camera at the side of the screen.
  // Returns { stop(), ready: Promise<'ok' | 'no-reader' | 'no-camera'> }
  function scan(video, found, front = false) {
    let stream = null, timer = null, stopped = false;
    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = null;
      video.srcObject = null;
    };
    const ready = (async () => {
      if (!canScan()) return 'no-reader';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      } catch (e) { return 'no-camera'; }
      if (stopped) { stream.getTracks().forEach(t => t.stop()); stream = null; return 'ok'; } // stop() came before the camera
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try { await video.play(); } catch (e) { /* the element is gone */ }
      const reader = new BarcodeDetector({ formats: ['qr_code'] });
      const look = async () => {
        if (stopped) return;
        try {
          if (video.readyState >= 2) for (const code of await reader.detect(video)) if (!stopped && code.rawValue) found(code.rawValue);
        } catch (e) { /* no picture yet */ }
        if (!stopped) timer = setTimeout(look, 150);
      };
      look();
      return 'ok';
    })();
    return { stop, ready };
  }

  return { make, draw, scan, canScan };
})();
