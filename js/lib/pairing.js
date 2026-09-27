/* ===== Pairing — direct connection between two devices, no server =====
   Two devices on the same Wi-Fi connect with WebRTC data channels. There is no server of
   any kind: the list of ICE servers is empty, so the browser uses addresses of the local
   network only and sends nothing to the internet.

   A connection needs one exchange of two short texts ("codes"):
   1. The first device makes a code (offer). The second device reads it.
   2. The second device makes a code (answer). The first device reads it.
   How a code gets to the other device is not the task of this file (QR code, see qr.js).

   A code holds what the browser needs from the connection description (SDP): name and
   password of the connection, fingerprint of the certificate, and up to 3 local addresses.
   The fingerprint makes the connection safe: only the device that showed the code has
   the key for it.

   The other device is not trusted. unpack() checks each field, because its text goes
   into a description that the browser reads. */
const Pairing = (() => {
  const LETTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'; // base45: the 45 letters of the QR alphanumeric mode
  const MARK = 'K';              // first letter of each code. The space is one of the 45 letters: with
                                 // the mark no code starts with it, so a text field cannot cut a code.
  const FORMAT = 1;
  const ROLES = ['actpass', 'active', 'passive']; // actpass: offer. active, passive: answer
  const MAX_ADDRESSES = 3;
  const MAX_CODE = 400;          // letters. A code with 3 addresses has about 180
  const NAME = /^[A-Za-z0-9+/]{4,64}$/;      // ice-ufrag and ice-pwd
  const HIDDEN = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i; // mDNS name
  const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const KIND_HIDDEN = 1, KIND_IPV4 = 4;
  // ponytail: no IPv6 addresses. Add kind 6 if a home network with IPv6 only shows up.

  /* ---- Text and bytes ---- */
  function checkValue(bytes) {
    let h = 2166136261;
    for (const b of bytes) h = Math.imul(h ^ b, 16777619);
    return (h >>> 0) & 0xffff;
  }

  // Bytes to code text, with a check value at the end
  function seal(bytes) {
    const c = checkValue(bytes);
    const all = Uint8Array.from([...bytes, c >> 8, c & 255]);
    let text = MARK;
    for (let i = 0; i < all.length; i += 2) {
      const pair = i + 1 < all.length;
      const n = pair ? all[i] * 256 + all[i + 1] : all[i];
      text += LETTERS[n % 45] + LETTERS[Math.floor(n / 45) % 45] + (pair ? LETTERS[Math.floor(n / 2025)] : '');
    }
    return text;
  }

  // Code text to bytes. null when the text is not a code.
  function open(text) {
    if (typeof text !== 'string') return null;
    text = text.trim();
    if (!text.startsWith(MARK) || text.length > MAX_CODE) return null;
    text = text.slice(MARK.length);
    if (text.length < 6 || text.length % 3 === 1) return null;
    const all = [];
    for (let i = 0; i < text.length; i += 3) {
      const v = [...text.slice(i, i + 3)].map(ch => LETTERS.indexOf(ch));
      if (v.includes(-1)) return null;
      const n = v[0] + v[1] * 45 + (v.length === 3 ? v[2] * 2025 : 0);
      if (n > (v.length === 3 ? 65535 : 255)) return null;
      if (v.length === 3) all.push(n >> 8, n & 255); else all.push(n);
    }
    const bytes = Uint8Array.from(all.slice(0, -2));
    const c = all[all.length - 2] * 256 + all[all.length - 1];
    return c === checkValue(bytes) ? bytes : null;
  }

  const isLocal = ([a, b]) => a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);

  /* ---- Description to code ---- */
  // null when the text is not a usable description, or when the device has no local address
  function pack(sdp) {
    if (typeof sdp !== 'string') return null;
    const rows = sdp.split(/\r?\n/);
    const value = start => { const r = rows.find(l => l.startsWith(start)); return r ? r.slice(start.length).trim() : ''; };
    const ufrag = value('a=ice-ufrag:'), pwd = value('a=ice-pwd:');
    const role = ROLES.indexOf(value('a=setup:'));
    const print = value('a=fingerprint:sha-256 ').split(':').map(h => (/^[0-9a-f]{2}$/i.test(h) ? parseInt(h, 16) : -1));
    if (!NAME.test(ufrag) || !NAME.test(pwd) || role < 0 || print.length !== 32 || print.includes(-1)) return null;

    const addresses = [];
    for (const row of rows) {
      const m = /^a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ host\b/i.exec(row);
      if (!m || addresses.length === MAX_ADDRESSES) continue;
      const port = Number(m[2]);
      if (port < 1 || port > 65535) continue;
      const hidden = HIDDEN.exec(m[1]), ip = IPV4.exec(m[1]);
      if (hidden) {
        const hex = hidden.slice(1).join('');
        addresses.push([KIND_HIDDEN, ...hex.match(/../g).map(h => parseInt(h, 16)), port >> 8, port & 255]);
      } else if (ip) {
        const parts = ip.slice(1).map(Number);
        if (parts.every(p => p <= 255) && isLocal(parts)) addresses.push([KIND_IPV4, ...parts, port >> 8, port & 255]);
      }
    }
    if (!addresses.length) return null;

    const text = s => [s.length, ...[...s].map(ch => ch.charCodeAt(0))];
    return seal([FORMAT << 4 | role, ...text(ufrag), ...text(pwd), ...print, addresses.length, ...addresses.flat()]);
  }

  /* ---- Code to description ---- */
  // Returns { type: 'offer' | 'answer', sdp } or null
  function unpack(code) {
    const b = open(code);
    if (!b || b.length < 1 || b[0] >> 4 !== FORMAT) return null;
    const role = ROLES[b[0] & 15];
    if (!role) return null;
    let at = 1;
    const take = n => (at + n <= b.length ? b.subarray(at, at += n) : null);
    const text = () => { const n = take(1); const t = n && take(n[0]); return t ? String.fromCharCode(...t) : ''; };

    const ufrag = text(), pwd = text();
    const print = take(32), count = take(1);
    if (!NAME.test(ufrag) || !NAME.test(pwd) || !print || !count || count[0] < 1 || count[0] > MAX_ADDRESSES) return null;

    const hex = bytes => [...bytes].map(v => v.toString(16).padStart(2, '0')).join('');
    const candidates = [];
    for (let i = 0; i < count[0]; i++) {
      const kind = take(1);
      const raw = kind && take(kind[0] === KIND_HIDDEN ? 16 : kind[0] === KIND_IPV4 ? 4 : 1e9);
      const p = raw && take(2);
      if (!p) return null;
      const port = p[0] * 256 + p[1];
      if (port === 0 || (kind[0] === KIND_IPV4 && !isLocal(raw))) return null;
      const address = kind[0] === KIND_IPV4
        ? raw.join('.')
        : hex(raw).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5') + '.local';
      candidates.push(`a=candidate:${i + 1} 1 udp ${2113937151 - i} ${address} ${port} typ host generation 0`);
    }
    if (at !== b.length) return null;

    const sdp = [
      'v=0',
      `o=- ${parseInt(hex(print.subarray(0, 6)), 16)} 2 IN IP4 127.0.0.1`,
      's=-',
      't=0 0',
      'a=group:BUNDLE 0',
      'a=msid-semantic: WMS',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      'c=IN IP4 0.0.0.0',
      ...candidates,
      'a=end-of-candidates',
      `a=ice-ufrag:${ufrag}`,
      `a=ice-pwd:${pwd}`,
      `a=fingerprint:sha-256 ${hex(print).toUpperCase().match(/../g).join(':')}`,
      `a=setup:${role}`,
      'a=mid:0',
      'a=sctp-port:5000',
      'a=max-message-size:262144',
      '',
    ].join('\r\n');
    return { type: role === 'actpass' ? 'offer' : 'answer', sdp };
  }

  /* ---- Connection ---- */
  // Two channels, the same on both devices:
  //   talk  each message arrives, in order. For text: start of a game, chat.
  //   fast  a message can get lost, none is sent again. For game input, 120 times per second.
  function connection() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const talk = pc.createDataChannel('talk', { negotiated: true, id: 0 });
    const fast = pc.createDataChannel('fast', { negotiated: true, id: 1, ordered: false, maxRetransmits: 0 });
    fast.binaryType = 'arraybuffer';
    let state = 'wait'; // wait -> open -> closed

    const link = {
      onopen: null,    // ()
      onclose: null,   // ()
      ontalk: null,    // (value) value is from the other device: check it before use
      onfast: null,    // (ArrayBuffer)
      get state() { return state; },
      talk(value) { if (talk.readyState === 'open') talk.send(JSON.stringify(value)); },
      fast(buf) { if (fast.readyState === 'open') fast.send(buf); },
      close() { end(); },
    };

    function end() {
      if (state === 'closed') return;
      state = 'closed';
      try { pc.close(); } catch (e) { /* closed already */ }
      if (link.onclose) link.onclose();
    }
    function ready() {
      if (state !== 'wait' || talk.readyState !== 'open' || fast.readyState !== 'open') return;
      state = 'open';
      if (link.onopen) link.onopen();
    }
    talk.onopen = fast.onopen = ready;
    talk.onclose = fast.onclose = end;
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') end(); };
    talk.onmessage = e => {
      if (typeof e.data !== 'string' || e.data.length > 4096) return;
      let value;
      try { value = JSON.parse(e.data); } catch (err) { return; }
      if (value && typeof value === 'object' && link.ontalk) link.ontalk(value);
    };
    fast.onmessage = e => { if (e.data instanceof ArrayBuffer && link.onfast) link.onfast(e.data); };
    return { pc, link };
  }

  // The browser needs a moment to find the addresses of this device
  function gathered(pc) {
    return new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const timer = setTimeout(resolve, 3000);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve(); }
      });
    });
  }

  // First device. Returns { code, link, accept(code of the second device) } or null with no network.
  async function host() {
    const { pc, link } = connection();
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    const code = pack(pc.localDescription.sdp);
    if (!code) { link.close(); return null; }
    return {
      code, link,
      async accept(answer) {
        const d = unpack(answer);
        if (!d || d.type !== 'answer' || pc.signalingState !== 'have-local-offer') return false;
        try { await pc.setRemoteDescription(d); } catch (e) { return false; }
        return true;
      },
    };
  }

  // Second device, with the code of the first device. Returns { code, link } or null.
  async function join(offer) {
    const d = unpack(offer);
    if (!d || d.type !== 'offer') return null;
    const { pc, link } = connection();
    try {
      await pc.setRemoteDescription(d);
      await pc.setLocalDescription(await pc.createAnswer());
    } catch (e) { link.close(); return null; }
    await gathered(pc);
    const code = pack(pc.localDescription.sdp);
    if (!code) { link.close(); return null; }
    return { code, link };
  }

  const kind = code => { const d = unpack(code); return d ? d.type : null; };

  return { host, join, kind, pack, unpack, seal, open };
})();
