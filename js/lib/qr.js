/* ===== QR — shows a text as a QR code, and reads a QR code with the camera =====
   Own code, no library. It makes what the pairing codes need and no more:
   - alphanumeric mode only: digits, capital letters, and space $ % * + - . / :
   - error correction level M
   - versions 1 to 10 (21 to 57 modules), up to 311 letters

   The reader is the BarcodeDetector of the browser. A browser with no BarcodeDetector (each
   browser on iPhone and iPad) uses read() of this file: it reads the codes that make() writes.
   The picture of the camera stays on the device. */
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
  const div = (a, b) => (a ? EXP[LOG[a] + 255 - LOG[b]] : 0);

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

  // Places of the 15 format bits, bit 0 first: the copy at the top left corner mark, and the copy at the other two
  function formatPlaces(size) {
    const near = [], far = [];
    for (let i = 0; i <= 5; i++) near.push([8, i]);
    near.push([8, 7], [8, 8], [7, 8]);
    for (let i = 9; i < 15; i++) near.push([14 - i, 8]);
    for (let i = 0; i < 8; i++) far.push([size - 1 - i, 8]);
    for (let i = 8; i < 15; i++) far.push([8, size - 15 + i]);
    return [near, far];
  }
  const formatBits = mask => withCheck(mask, 10, 0x537) ^ 0x5412; // level M is 0, then the mask

  // Places of the data bits, in order: two columns at a time, from the right, up and down in turn
  function dataPlaces(size, fixed) {
    const places = [];
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // the column of the timing line
      for (let v = 0; v < size; v++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
          if (!fixed[y * size + x]) places.push(y * size + x);
        }
      }
    }
    return places;
  }

  // The parts of a code that hold no data: marks, timing lines, version, and the places of the format.
  // Returns { size, dark, fixed, set }. fixed: 1 for each module that holds no data.
  function frame(version) {
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
    // Format: the places are reserved now and get their value for each mask
    for (const copy of formatPlaces(size)) for (const [x, y] of copy) set(x, y, 0);
    set(8, size - 8, 1); // dark module
    return { size, dark, fixed, set };
  }

  // Returns { version, size, dark: Uint8Array with size x size values 0 or 1 } or null
  function make(text) {
    if (typeof text !== 'string' || !text.length || [...text].some(ch => !LETTERS.includes(ch))) return null;
    let version = 1, all = null;
    while (version <= 10 && !(all = codewords(text, version))) version++;
    if (!all) return null;

    const { size, dark, fixed, set } = frame(version);
    const format = mask => {
      for (const copy of formatPlaces(size)) copy.forEach(([x, y], i) => set(x, y, (formatBits(mask) >>> i) & 1));
    };
    dataPlaces(size, fixed).forEach((at, n) => { dark[at] = n < all.length * 8 ? (all[n >> 3] >>> (7 - (n & 7))) & 1 : 0; });

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

  /* ---- Reader: picture to text ----
     It reads the codes that make() writes: alphanumeric, level M, versions 1 to 10. Steps:
     dark and light pixels, the 3 corner marks, the perspective of the code, the modules, the
     correction of errors, the text. */

  // Corrects the errors in one block (data bytes, then correction bytes) in place.
  // Returns false when the block has more errors than its count correction bytes can repair.
  function repair(block, count) {
    const syndromes = [];
    for (let j = 0; j < count; j++) syndromes.push(block.reduce((s, byte) => times(s, EXP[j]) ^ byte, 0));
    if (syndromes.every(s => !s)) return true;
    // Places of the errors (Berlekamp-Massey): the roots of loc
    let loc = [1], prev = [1], errors = 0, gap = 1, last = 1;
    for (let n = 0; n < count; n++) {
      let d = syndromes[n];
      for (let i = 1; i <= errors; i++) d ^= times(loc[i] || 0, syndromes[n - i]);
      if (!d) { gap++; continue; }
      const next = loc.slice(), f = div(d, last);
      prev.forEach((p, i) => { next[i + gap] = (next[i + gap] || 0) ^ times(f, p); });
      if (2 * errors <= n) { prev = loc; errors = n + 1 - errors; last = d; gap = 1; } else gap++;
      loc = next;
    }
    if (2 * errors > count) return false;
    // Values of the errors (Forney)
    const at = (poly, x) => poly.reduceRight((v, c) => times(v, x) ^ (c || 0), 0);
    const slope = loc.slice(1).map((c, i) => (i % 2 ? 0 : c));
    const omega = syndromes.map((_, i) => syndromes.slice(0, i + 1).reduce((v, s, j) => v ^ times(s, loc[i - j] || 0), 0));
    let found = 0;
    for (let p = 0; p < block.length; p++) {
      const power = block.length - 1 - p, inv = EXP[(255 - power) % 255];
      if (at(loc, inv)) continue;
      const d = at(slope, inv);
      if (!d) return false;
      block[p] ^= times(EXP[power], div(at(omega, inv), d));
      found++;
    }
    return found === errors && Array.from({ length: count }, (_, j) => block.reduce((s, byte) => times(s, EXP[j]) ^ byte, 0)).every(s => !s);
  }

  // Modules to text, or null
  function decode(grid, version) {
    const size = 17 + 4 * version;
    // Mask: the format word of level M nearest to one of the two copies, with 3 wrong bits at most
    const copies = formatPlaces(size).map(copy => copy.reduce((v, [x, y], i) => v | (grid[y * size + x] << i), 0));
    let mask = -1, best = 4;
    for (let m = 0; m < 8; m++) for (const bits of copies) {
      let wrong = 0;
      for (let d = bits ^ formatBits(m); d; d &= d - 1) wrong++;
      if (wrong < best) { best = wrong; mask = m; }
    }
    if (mask < 0) return null;
    const places = dataPlaces(size, frame(version).fixed);
    const [extra, n1, d1, n2, d2] = BLOCKS[version];
    const lengths = [...new Array(n1).fill(d1), ...new Array(n2).fill(d2)];
    const bytes = new Uint8Array(lengths.reduce((s, n) => s + n + extra, 0));
    for (let n = 0; n < bytes.length * 8; n++) {
      const at = places[n], x = at % size;
      if (grid[at] ^ MASKS[mask](x, (at - x) / size)) bytes[n >> 3] |= 128 >> (n & 7);
    }
    // Blocks: one byte of each block in turn, as make() puts them
    const blocks = lengths.map(() => []);
    let next = 0;
    for (let i = 0; i < Math.max(d1, d2); i++) lengths.forEach((n, b) => { if (i < n) blocks[b].push(bytes[next++]); });
    for (let i = 0; i < extra; i++) for (const b of blocks) b.push(bytes[next++]);
    if (!blocks.every(b => repair(b, extra))) return null;
    const data = blocks.flatMap((b, i) => b.slice(0, lengths[i]));
    // Text: alphanumeric mode, letter count, then 2 letters in 11 bits and the last letter in 6 bits
    let pos = 0;
    const take = n => { let v = 0; for (let i = 0; i < n; i++, pos++) v = v * 2 + ((data[pos >> 3] >>> (7 - (pos & 7))) & 1); return v; };
    if (take(4) !== 2) return null;
    const count = take(version < 10 ? 9 : 11);
    if (!count || pos + Math.floor(count / 2) * 11 + (count % 2) * 6 > data.length * 8) return null;
    let text = '';
    for (let i = 0; i + 1 < count; i += 2) {
      const v = take(11);
      if (v >= 45 * 45) return null;
      text += LETTERS[Math.floor(v / 45)] + LETTERS[v % 45];
    }
    if (count % 2) {
      const v = take(6);
      if (v >= 45) return null;
      text += LETTERS[v];
    }
    return text;
  }

  // 1 for each pixel that is darker than the area around it (an eighth of the picture to each side)
  function threshold({ data, width: w, height: h }) {
    const W = w + 1, sum = new Uint32Array(W * (h + 1)), gray = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
        row += gray[i];
        sum[(y + 1) * W + x + 1] = sum[y * W + x + 1] + row;
      }
    }
    const r = Math.max(8, Math.round(Math.min(w, h) / 8)), dark = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const s = sum[y1 * W + x1] - sum[y0 * W + x1] - sum[y1 * W + x0] + sum[y0 * W + x0];
        dark[y * w + x] = gray[y * w + x] * (x1 - x0) * (y1 - y0) * 8 < s * 7 ? 1 : 0; // an eighth darker than the mean
      }
    }
    return dark;
  }

  // Runs of a corner mark: dark, light, dark, light, dark at 1 : 1 : 3 : 1 : 1
  function markRuns(c) {
    const unit = (c[0] + c[1] + c[2] + c[3] + c[4]) / 7, slack = unit / 2;
    return unit >= 1 && [1, 1, 3, 1, 1].every((n, i) => Math.abs(c[i] - n * unit) < n * slack);
  }

  // Runs along a line through the dark point x, y in the direction dx, dy, one pixel for each step.
  // Returns { at, total } for the runs of a corner mark, or null. at: center of the middle run along
  // a line of pixels (x, y whole numbers, dx or dy 0).
  function cross(dark, w, h, x, y, dx, dy, most) {
    const get = t => {
      const px = Math.floor(x + dx * t), py = Math.floor(y + dy * t);
      return px < 0 || py < 0 || px >= w || py >= h ? -1 : dark[py * w + px];
    };
    const walk = dir => {
      const runs = [0, 0, 0]; // middle (no center pixel), light, dark
      for (let t = dir, k = 0; ;) {
        const v = get(t);
        if (v < 0) return null;
        if (v === (k === 1 ? 0 : 1)) {
          if (++runs[k] > most) return null;
          t += dir;
        } else if (++k === 3) return runs;
      }
    };
    if (get(0) !== 1) return null;
    const a = walk(-1), b = walk(1);
    if (!a || !b) return null;
    const c = [a[2], a[1], a[0] + 1 + b[0], b[1], b[2]];
    if (!markRuns(c)) return null;
    return { at: (dx ? x : y) + (b[0] - a[0] + 1) / 2, total: c[0] + c[1] + c[2] + c[3] + c[4] };
  }

  // Corner marks: rows with the runs of a mark, checked again down and across. Each mark comes
  // from many rows: n counts them. unit: size of a module in pixels.
  function findMarks(dark, w, h) {
    const marks = [];
    const near = (a, b) => Math.abs(a - b) * 5 < b * 2;
    for (let y = 0; y < h; y++) {
      const runs = [];
      for (let x = 1, start = 0; x <= w; x++) if (x === w || dark[y * w + x] !== dark[y * w + x - 1]) { runs.push([start, x - start]); start = x; }
      for (let i = dark[y * w] ? 0 : 1; i + 4 < runs.length; i += 2) {
        const c = runs.slice(i, i + 5).map(r => r[1]);
        if (!markRuns(c)) continue;
        const total = c.reduce((s, n) => s + n), cx = Math.floor(runs[i + 2][0] + c[2] / 2);
        const down = cross(dark, w, h, cx, y, 0, 1, total);
        if (!down || !near(down.total, total)) continue;
        const across = cross(dark, w, h, cx, Math.floor(down.at), 1, 0, total);
        if (!across || !near(across.total, total)) continue;
        const x = across.at, my = down.at, unit = (across.total + down.total) / 14;
        const same = marks.find(m => Math.abs(m.x - x) < m.unit * 2 && Math.abs(m.y - my) < m.unit * 2 && Math.abs(m.unit - unit) < m.unit);
        if (!same) marks.push({ x, y: my, unit, n: 1 });
        else {
          same.x = (same.x * same.n + x) / (same.n + 1);
          same.y = (same.y * same.n + my) / (same.n + 1);
          same.unit = (same.unit * same.n + unit) / (same.n + 1);
          same.n++;
        }
      }
    }
    return marks;
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Size of a module of the corner mark m, along the line to the point p. The line follows a side
  // of the code, so the runs of the mark on it are 7 modules long. (The rows of the picture cross a
  // turned code at a slant: their runs are longer.)
  function unitTo(dark, w, h, m, p) {
    const d = dist(m, p), c = cross(dark, w, h, m.x, m.y, (p.x - m.x) / d, (p.y - m.y) / d, m.unit * 7);
    return c ? c.total / 7 : m.unit;
  }

  // Sets of 3 corner marks that can be one code: about the same size, two sides of about the same
  // length at about a right angle. The best 3 sets, with the corners named.
  function corners(marks) {
    const list = marks.filter(m => m.n >= 2).sort((a, b) => b.n - a.n).slice(0, 8);
    const sets = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) for (let k = j + 1; k < list.length; k++) {
      const p = [list[i], list[j], list[k]], units = p.map(m => m.unit);
      if (Math.max(...units) > Math.min(...units) * 1.6) continue;
      const sides = [dist(p[1], p[2]), dist(p[0], p[2]), dist(p[0], p[1])];
      const top = sides.indexOf(Math.max(...sides)); // the corner at the right angle is opposite the longest side
      const tl = p[top], [b, c] = p.filter((_, n) => n !== top);
      const ab = dist(tl, b), ac = dist(tl, c);
      const cos = ((b.x - tl.x) * (c.x - tl.x) + (b.y - tl.y) * (c.y - tl.y)) / (ab * ac), skew = Math.abs(ab - ac) / Math.max(ab, ac);
      if (Math.abs(cos) > 0.4 || skew > 0.4 || Math.min(ab, ac) < tl.unit * 7) continue;
      const turn = (b.x - tl.x) * (c.y - tl.y) - (b.y - tl.y) * (c.x - tl.x); // > 0: b is at the top right
      sets.push({ score: Math.abs(cos) + skew, tl, tr: turn > 0 ? b : c, bl: turn > 0 ? c : b });
    }
    return sets.sort((a, b) => a.score - b.score).slice(0, 3);
  }

  // Perspective map from 4 points to 4 points: returns (x, y) => [x, y], or null
  function perspective(from, to) {
    const A = [], b = [];
    from.forEach(([u, v], i) => {
      const [x, y] = to[i];
      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
      A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
    });
    for (let c = 0; c < 8; c++) {
      let p = c;
      for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p], b[c], b[p]] = [A[p], A[c], b[p], b[c]];
      if (Math.abs(A[c][c]) < 1e-9) return null;
      for (let r = 0; r < 8; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const m = b.map((v, i) => v / A[i][i]);
    return (u, v) => {
      const z = m[6] * u + m[7] * v + 1;
      return [(m[0] * u + m[1] * v + m[2]) / z, (m[3] * u + m[4] * v + m[5]) / z];
    };
  }

  // Modules of a code of this version, with the corner marks of the set s. Null when the code is not all in the picture.
  // The perspective needs a fourth point: the place of a fourth corner mark at the bottom right. The reader
  // moves it from the corner of a parallelogram until the most fixed modules (marks, timing lines) are right.
  function sample(dark, w, h, s, version) {
    const size = 17 + 4 * version, far = size - 3.5, span = size - 7;
    const { dark: want, fixed } = frame(version), format = new Set(formatPlaces(size).flat().map(([x, y]) => y * size + x));
    const known = [];
    for (let i = 0; i < size * size; i++) if (fixed[i] && !format.has(i)) known.push(i);
    const mapTo = p => perspective([[3.5, 3.5], [far, 3.5], [3.5, far], [far, far]], [[s.tl.x, s.tl.y], [s.tr.x, s.tr.y], [s.bl.x, s.bl.y], [p.x, p.y]]);
    const pixel = (map, i) => {
      const x = i % size, [px, py] = map(x + 0.5, (i - x) / size + 0.5).map(Math.floor);
      return px < 0 || py < 0 || px >= w || py >= h ? -1 : dark[py * w + px];
    };
    const fit = p => {
      const map = mapTo(p);
      let n = 0;
      if (map) for (const i of known) if (pixel(map, i) === want[i]) n++;
      return n;
    };
    const ex = { x: (s.tr.x - s.tl.x) / span, y: (s.tr.y - s.tl.y) / span }, ey = { x: (s.bl.x - s.tl.x) / span, y: (s.bl.y - s.tl.y) / span };
    const guess = { x: s.tr.x + s.bl.x - s.tl.x, y: s.tr.y + s.bl.y - s.tl.y };
    let best = guess, most = fit(best);
    const tryAt = (from, i, j) => {
      const p = { x: from.x + i * ex.x + j * ey.x, y: from.y + i * ex.y + j * ey.y }, n = fit(p);
      if (n <= most) return false;
      most = n;
      best = p;
      return true;
    };
    // Steps of 2 modules (a code at a slant: up to 12 modules from the parallelogram), then from the best
    // place to the next better place, with steps of 1, a half, and a quarter module
    for (let j = -12; j <= 12; j += 2) for (let i = -12; i <= 12; i += 2) tryAt(guess, i, j);
    for (const step of [1, 0.5, 0.25]) {
      for (let moved = true; moved;) {
        const from = best;
        moved = false;
        for (const [i, j] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) if (tryAt(from, i * step, j * step)) moved = true;
      }
    }
    const map = mapTo(best), grid = new Uint8Array(size * size);
    if (!map) return null;
    for (let i = 0; i < size * size; i++) if ((grid[i] = pixel(map, i)) < 0) return null;
    return grid;
  }

  // Reads a code in a picture ({ data: RGBA bytes, width, height }, as ImageData). Returns its text or null.
  function read(image) {
    const { width: w, height: h } = image;
    if (!(w >= 21 && h >= 21)) return null;
    const dark = threshold(image);
    for (const s of corners(findMarks(dark, w, h))) {
      const across = (unitTo(dark, w, h, s.tl, s.tr) + unitTo(dark, w, h, s.tr, s.tl)) / 2;
      const down = (unitTo(dark, w, h, s.tl, s.bl) + unitTo(dark, w, h, s.bl, s.tl)) / 2;
      const guess = Math.round(((dist(s.tl, s.tr) / across + dist(s.tl, s.bl) / down) / 2 + 7 - 17) / 4);
      for (const version of [guess, guess - 1, guess + 1]) {
        if (version < 1 || version > 10) continue;
        const grid = sample(dark, w, h, s, version), text = grid && decode(grid, version);
        if (text) return text;
      }
    }
    return null;
  }

  /* ---- Camera ---- */
  const canScan = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // The QR reader of the browser, else read() with the pictures of the camera (up to 1280 pixels wide)
  function reader() {
    try {
      if ('BarcodeDetector' in window) return new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) { /* the reader of the browser has no QR codes */ }
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    return {
      async detect(video) {
        const k = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
        const w = Math.round(video.videoWidth * k), h = Math.round(video.videoHeight * k);
        if (!w || !h) return [];
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        ctx.drawImage(video, 0, 0, w, h);
        const text = read(ctx.getImageData(0, 0, w, h));
        return text ? [{ rawValue: text }] : [];
      },
    };
  }

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
      const codes = reader();
      const look = async () => {
        if (stopped) return;
        try {
          if (video.readyState >= 2) for (const code of await codes.detect(video)) if (!stopped && code.rawValue) found(code.rawValue);
        } catch (e) { /* no picture yet */ }
        if (!stopped) timer = setTimeout(look, 150);
      };
      look();
      return 'ok';
    })();
    return { stop, ready };
  }

  return { make, draw, read, scan, canScan };
})();
