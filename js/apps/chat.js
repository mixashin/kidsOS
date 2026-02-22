/* ===== KidsChat App ===== */
OS.registerApp('chat', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'chat',
      title: 'KidsChat',
      icon: '💬',
      width: 580,
      height: 480,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="kc-wrap">
      <!-- Sidebar -->
      <div class="kc-sidebar">
        <div class="kc-sidebar-header">
          <span>💬 KidsChat</span>
          <button class="kc-add-btn" onclick="KidsChat.showContactDialog()" title="Add contact">+</button>
        </div>
        <div class="kc-contact-list" id="kc-contact-list"></div>
      </div>

      <!-- Main chat area -->
      <div class="kc-main" id="kc-main">
        <!-- Shown when no contact selected -->
        <div class="kc-empty" id="kc-empty">
          <div style="font-size:64px">💬</div>
          <div style="font-size:18px;font-weight:700;color:#555;margin-top:12px">Select someone to chat with!</div>
          <div style="font-size:13px;color:#999;margin-top:6px">Pick a contact on the left</div>
        </div>

        <!-- Add/Edit Contact Dialog -->
        <div class="kc-dialog-overlay" id="kc-dialog" style="display:none">
          <div class="kc-dialog">
            <h3 id="kc-dialog-title">New Contact</h3>
            <div class="kc-dialog-field">
              <label>Name</label>
              <input type="text" id="kc-dialog-name" placeholder="Enter name…" maxlength="20"
                     onkeydown="if(event.key==='Enter') KidsChat.confirmDialog()">
            </div>
            <div class="kc-dialog-field">
              <label>Choose Avatar</label>
              <div class="kc-avatar-grid" id="kc-avatar-grid"></div>
            </div>
            <div class="kc-dialog-field">
              <label>Choose Color</label>
              <div class="kc-color-grid" id="kc-color-grid"></div>
            </div>
            <div class="kc-dialog-btns">
              <button class="kc-dialog-cancel" onclick="KidsChat.cancelDialog()">Cancel</button>
              <button class="kc-dialog-save" onclick="KidsChat.confirmDialog()">Save</button>
            </div>
          </div>
        </div>

        <!-- Chat panel (hidden until contact selected) -->
        <div class="kc-chat-panel" id="kc-chat-panel" style="display:none;flex-direction:column;height:100%;">
          <!-- Chat header -->
          <div class="kc-chat-header" id="kc-chat-header">
            <div class="kc-chat-header-avatar" id="kc-hdr-avatar" onclick="KidsChat.showContactDialog('edit')" title="Change avatar" style="cursor:pointer">👩</div>
            <div class="kc-chat-header-info">
              <div class="kc-chat-header-name" id="kc-hdr-name">Mom</div>
              <div class="kc-chat-header-status">🟢 Online</div>
            </div>
            <button class="kc-edit-replies-btn" onclick="KidsChat.openEditPanel()">✏️ Edit Replies</button>
          </div>

          <!-- Messages -->
          <div class="kc-messages" id="kc-messages"></div>

          <!-- Typing indicator -->
          <div class="kc-typing" id="kc-typing" style="display:none">
            <span id="kc-typing-name">Mom</span> is typing
            <span class="kc-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>

          <!-- Gallery picker -->
          <div class="kc-gallery" id="kc-gallery" style="display:none">
            <div class="kc-gallery-header">
              <span>📷 Send a Photo</span>
              <button class="kc-gallery-close" onclick="KidsChat.toggleGallery()">✕</button>
            </div>
            <div class="kc-gallery-grid" id="kc-gallery-grid"></div>
          </div>

          <!-- Input bar -->
          <div class="kc-input-bar">
            <button class="kc-photo-btn" onclick="KidsChat.toggleGallery()" title="Send a photo">📷</button>
            <input type="text" class="kc-input" id="kc-input"
                   placeholder="Type a message… 😊"
                   onkeydown="if(event.key==='Enter') KidsChat.send()">
            <button class="kc-send-btn" onclick="KidsChat.send()">➤ Send</button>
          </div>
        </div>

        <!-- Edit Replies panel -->
        <div class="kc-edit-panel" id="kc-edit-panel" style="display:none;flex-direction:column;height:100%;">
          <div class="kc-edit-header">
            <button class="kc-back-btn" onclick="KidsChat.closeEditPanel()">← Back</button>
            <span id="kc-edit-title">✏️ Mom's Replies</span>
          </div>
          <div class="kc-edit-hint">These are the messages <b id="kc-edit-who">Mom</b> will send back automatically.</div>
          <div class="kc-edit-list" id="kc-edit-list"></div>
          <div class="kc-edit-add-row">
            <input type="text" class="kc-edit-input" id="kc-edit-input"
                   placeholder="Type a new reply…"
                   onkeydown="if(event.key==='Enter') KidsChat.addReply()">
            <button class="kc-edit-add-btn" onclick="KidsChat.addReply()">+ Add</button>
          </div>
        </div>
      </div>
    </div>`;
  },

  onOpen() { KidsChat.init(); },
  onClose() { KidsChat.destroy(); },
});

/* ===================== KidsChat Logic ===================== */
const KidsChat = (() => {
  const STORE_KEY = 'kidsOS_chat';

  const DEFAULT_CONTACTS = [
    {
      id: 'mom', name: 'Mom', avatar: '👩', color: '#e91e8c',
      replies: [
        'I love you so much! 💕',
        'How was school today? 📚',
        "Don't forget to eat your vegetables! 🥦",
        'Be home by dinner time! 🍽️',
        'Have you done your homework? 📖',
        'You make me so proud! 🌟',
        'Come give me a hug! 🤗',
        'Sweet dreams, my little one! 🌙',
        'What would you like for lunch? 🥪',
        "I can't wait to see you later! 💖",
      ],
      messages: [],
    },
    {
      id: 'dad', name: 'Dad', avatar: '👨', color: '#1976d2',
      replies: [
        "That's my kid! 🌟",
        'Want to play catch later? ⚽',
        'Have you done your homework? 📚',
        "I'm so proud of you! 👏",
        'High five! ✋',
        "You're awesome! 🚀",
        "Let's go on an adventure this weekend! 🗺️",
        'Want to watch a movie tonight? 🎬',
        "I'll be home for dinner! 🍕",
        'Love you to the moon and back! 🌙',
      ],
      messages: [],
    },
    {
      id: 'grandma', name: 'Grandma', avatar: '👵', color: '#7b1fa2',
      replies: [
        'My darling! 🌸',
        'I baked cookies for you! 🍪',
        "You're getting so big! 😊",
        'Come visit me soon! 🏡',
        'I love you dearly! 💜',
        "Don't forget to brush your teeth! 🦷",
        'Be good at school! 🍎',
        'Want me to tell you a story? 📖',
        'You are such a wonderful child! ⭐',
        'Grandma misses you! 😘',
      ],
      messages: [],
    },
    {
      id: 'bestfriend', name: 'Best Friend', avatar: '🧒', color: '#388e3c',
      replies: [
        'Want to play? 🎮',
        "That's so cool! 😎",
        "Let's be best friends forever! 🤝",
        'LOL 😂',
        'No way! Really?! 😮',
        'Come to my house! 🏠',
        "You're my best friend! 💚",
        'What are you doing? 🤔',
        'This is SO fun! 🎉',
        'I like your style! 😄',
      ],
      messages: [],
    },
  ];

  let contacts = [];
  let activeId = null;
  let typingTimer = null;
  let replyCounters = {}; // track reply index per contact to avoid repeats

  /* ---- Init / Destroy ---- */

  function init() {
    loadData();
    setTimeout(() => {
      renderContactList();
      // Auto-select first contact
      if (contacts.length > 0) selectContact(contacts[0].id);
    }, 30);
  }

  function destroy() {
    if (typingTimer) clearTimeout(typingTimer);
  }

  /* ---- Data persistence ---- */

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && saved.contacts && saved.contacts.length > 0) {
        contacts = saved.contacts;
        // Ensure all default contacts exist (merge in new ones)
        DEFAULT_CONTACTS.forEach(def => {
          if (!contacts.find(c => c.id === def.id)) contacts.push({ ...def });
        });
      } else {
        contacts = DEFAULT_CONTACTS.map(c => ({ ...c, messages: [], replies: [...c.replies] }));
      }
    } catch (e) {
      contacts = DEFAULT_CONTACTS.map(c => ({ ...c, messages: [], replies: [...c.replies] }));
    }
    // Init reply counters
    contacts.forEach(c => { replyCounters[c.id] = replyCounters[c.id] || 0; });
  }

  function saveData() {
    localStorage.setItem(STORE_KEY, JSON.stringify({ contacts }));
  }

  function getContact(id) {
    return contacts.find(c => c.id === id);
  }

  /* ---- Contact list ---- */

  function renderContactList() {
    const list = document.getElementById('kc-contact-list');
    if (!list) return;
    list.innerHTML = '';
    contacts.forEach(c => {
      const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
      const preview = lastMsg
        ? (lastMsg.from === 'me' ? 'You: ' + lastMsg.text : lastMsg.text)
        : 'Tap to start chatting!';

      const el = document.createElement('div');
      el.className = 'kc-contact' + (c.id === activeId ? ' active' : '');
      el.dataset.id = c.id;
      el.innerHTML = `
        <div class="kc-contact-avatar" style="background:${c.color}">${c.avatar}</div>
        <div class="kc-contact-body">
          <div class="kc-contact-name">${c.name}</div>
          <div class="kc-contact-preview">${escHtml(preview.slice(0, 40))}${preview.length > 40 ? '…' : ''}</div>
        </div>
      `;
      el.onclick = () => selectContact(c.id);
      list.appendChild(el);
    });
  }

  /* ---- Select contact ---- */

  function selectContact(id) {
    activeId = id;
    const c = getContact(id);
    if (!c) return;

    // Close edit panel if open
    showChatPanel();

    // Update header
    el('kc-hdr-avatar').textContent = c.avatar;
    el('kc-hdr-avatar').style.background = c.color;
    el('kc-hdr-name').textContent = c.name;
    el('kc-typing-name').textContent = c.name;

    // Hide empty screen
    el('kc-empty').style.display = 'none';
    el('kc-chat-panel').style.display = 'flex';

    renderContactList();
    renderMessages();
    scrollToBottom();
    el('kc-input').focus();
  }

  /* ---- Render messages ---- */

  function renderMessages() {
    const c = getContact(activeId);
    const box = el('kc-messages');
    if (!c || !box) return;
    box.innerHTML = '';

    if (c.messages.length === 0) {
      box.innerHTML = `<div class="kc-no-messages">Say hi to ${c.name}! 👋</div>`;
      return;
    }

    c.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'kc-msg-row ' + (msg.from === 'me' ? 'me' : 'them');

      const isImage = msg.type === 'image';
      let contentHtml;
      if (isImage) {
        const imgInfo = GALLERY_IMAGES.find(g => g.id === msg.imageId);
        const label = imgInfo ? imgInfo.label : 'Photo';
        contentHtml = `<div class="kc-bubble-img ${msg.from === 'me' ? 'me' : 'them'}"><canvas class="kc-msg-canvas" data-img-id="${msg.imageId}" width="180" height="130"></canvas><div class="kc-img-label">${escHtml(label)}</div></div>`;
      } else {
        contentHtml = `<div class="kc-bubble ${msg.from === 'me' ? 'me' : 'them'}" ${msg.from !== 'me' ? `style="--contact-color:${c.color}"` : ''}>${escHtml(msg.text)}</div>`;
      }

      if (msg.from !== 'me') {
        div.innerHTML = `
          <div class="kc-bubble-avatar" style="background:${c.color}">${c.avatar}</div>
          <div>
            ${contentHtml}
            <div class="kc-msg-time">${msg.time}</div>
          </div>`;
      } else {
        div.innerHTML = `
          <div>
            ${contentHtml}
            <div class="kc-msg-time" style="text-align:right">${msg.time}</div>
          </div>`;
      }
      box.appendChild(div);
    });

    // Draw all image canvases in messages
    box.querySelectorAll('.kc-msg-canvas').forEach(canvas => {
      drawGalleryImage(canvas.dataset.imgId, canvas);
    });
  }

  function scrollToBottom() {
    const box = el('kc-messages');
    if (box) setTimeout(() => { box.scrollTop = box.scrollHeight; }, 20);
  }

  /* ---- Send message ---- */

  function send() {
    const input = el('kc-input');
    if (!input || !activeId) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const c = getContact(activeId);
    if (!c) return;

    // Add my message
    c.messages.push({ from: 'me', text, time: now() });
    saveData();
    renderMessages();
    renderContactList();
    scrollToBottom();

    // Schedule auto-reply
    if (typingTimer) clearTimeout(typingTimer);
    const delay = 1200 + Math.random() * 1400;

    // Show typing indicator
    setTimeout(() => {
      const typingEl = el('kc-typing');
      if (typingEl && activeId === c.id) typingEl.style.display = 'flex';
      scrollToBottom();
    }, 600);

    typingTimer = setTimeout(() => {
      const typingEl = el('kc-typing');
      if (typingEl) typingEl.style.display = 'none';

      if (!c.replies || c.replies.length === 0) return;

      // Pick next reply in rotation (so all replies are used before repeating)
      const idx = replyCounters[c.id] % c.replies.length;
      const reply = c.replies[idx];
      replyCounters[c.id] = idx + 1;

      c.messages.push({ from: c.id, text: reply, time: now() });
      saveData();
      renderMessages();
      renderContactList();
      scrollToBottom();
    }, delay);
  }

  /* ---- Edit replies panel ---- */

  function openEditPanel() {
    const c = getContact(activeId);
    if (!c) return;

    el('kc-chat-panel').style.display = 'none';
    el('kc-edit-panel').style.display = 'flex';
    el('kc-edit-title').textContent = `✏️ ${c.name}'s Replies`;
    el('kc-edit-who').textContent = c.name;
    renderEditList();
    el('kc-edit-input').focus();
  }

  function closeEditPanel() {
    showChatPanel();
    renderMessages();
    scrollToBottom();
  }

  function showChatPanel() {
    const cp = el('kc-chat-panel');
    const ep = el('kc-edit-panel');
    if (cp) cp.style.display = 'flex';
    if (ep) ep.style.display = 'none';
  }

  function renderEditList() {
    const c = getContact(activeId);
    const list = el('kc-edit-list');
    if (!c || !list) return;
    list.innerHTML = '';

    if (c.replies.length === 0) {
      list.innerHTML = '<div style="padding:16px;color:#999;text-align:center">No replies yet. Add some below!</div>';
      return;
    }

    c.replies.forEach((reply, i) => {
      const row = document.createElement('div');
      row.className = 'kc-edit-reply-row';
      row.innerHTML = `
        <span class="kc-edit-reply-avatar">${c.avatar}</span>
        <span class="kc-edit-reply-text">${escHtml(reply)}</span>
        <button class="kc-edit-del-btn" onclick="KidsChat.deleteReply(${i})" title="Delete">✕</button>
      `;
      list.appendChild(row);
    });
  }

  function addReply() {
    const input = el('kc-edit-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const c = getContact(activeId);
    if (!c) return;
    c.replies.push(text);
    input.value = '';
    saveData();
    renderEditList();
    // Scroll edit list to bottom
    const list = el('kc-edit-list');
    if (list) list.scrollTop = list.scrollHeight;
  }

  function deleteReply(idx) {
    const c = getContact(activeId);
    if (!c) return;
    c.replies.splice(idx, 1);
    saveData();
    renderEditList();
  }

  /* ---- Gallery (Send Image) ---- */

  const GALLERY_IMAGES = [
    { id: 'drawing',    label: 'My Drawing 🎨' },
    { id: 'room',       label: 'My Room 🛏️' },
    { id: 'game',       label: 'Game Screenshot 🎮' },
    { id: 'sunset',     label: 'Sunset 🌅' },
    { id: 'pet',        label: 'My Pet 🐱' },
    { id: 'food',       label: 'Yummy Food 🍕' },
    { id: 'park',       label: 'The Park 🌳' },
    { id: 'selfie',     label: 'Funny Selfie 🤳' },
  ];

  function drawGalleryImage(id, canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    switch (id) {
      case 'drawing': {
        // Kid's crayon drawing: sky, grass, sun, house, stick figure
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#4a2'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
        // Sun
        ctx.fillStyle = '#ffe03a'; ctx.beginPath(); ctx.arc(w * 0.85, h * 0.2, 22, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.strokeStyle = '#ffe03a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.85 + Math.cos(a) * 26, h * 0.2 + Math.sin(a) * 26); ctx.lineTo(w * 0.85 + Math.cos(a) * 36, h * 0.2 + Math.sin(a) * 36); ctx.stroke(); }
        // House
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(w * 0.15, h * 0.42, 50, 38);
        ctx.fillStyle = '#8B4513'; ctx.beginPath(); ctx.moveTo(w * 0.15 - 6, h * 0.42); ctx.lineTo(w * 0.15 + 25, h * 0.22); ctx.lineTo(w * 0.15 + 56, h * 0.42); ctx.fill();
        ctx.fillStyle = '#f5d442'; ctx.fillRect(w * 0.15 + 18, h * 0.52, 14, 14);
        ctx.fillStyle = '#8B4513'; ctx.fillRect(w * 0.15 + 33, h * 0.58, 10, 22);
        // Stick figure
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        const fx = w * 0.62, fy = h * 0.38;
        ctx.beginPath(); ctx.arc(fx, fy, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx, fy + 9); ctx.lineTo(fx, fy + 34); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx - 14, fy + 18); ctx.lineTo(fx + 14, fy + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx, fy + 34); ctx.lineTo(fx - 12, fy + 52); ctx.moveTo(fx, fy + 34); ctx.lineTo(fx + 12, fy + 52); ctx.stroke();
        break;
      }
      case 'room': {
        // Bedroom: floor, wall, window, bed, rug
        ctx.fillStyle = '#f5e6ca'; ctx.fillRect(0, 0, w, h); // wall
        ctx.fillStyle = '#c89b6e'; ctx.fillRect(0, h * 0.65, w, h * 0.35); // floor
        // Window
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(w * 0.55, h * 0.1, 50, 44);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(w * 0.55, h * 0.1, 50, 44);
        ctx.beginPath(); ctx.moveTo(w * 0.55 + 25, h * 0.1); ctx.lineTo(w * 0.55 + 25, h * 0.1 + 44); ctx.moveTo(w * 0.55, h * 0.1 + 22); ctx.lineTo(w * 0.55 + 50, h * 0.1 + 22); ctx.stroke();
        // Bed
        ctx.fillStyle = '#5b8cff'; ctx.fillRect(w * 0.05, h * 0.4, 70, 34);
        ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.05, h * 0.4, 20, 18); // pillow
        ctx.fillStyle = '#8B4513'; ctx.fillRect(w * 0.05 - 3, h * 0.4 - 14, 4, 50); ctx.fillRect(w * 0.05 + 68, h * 0.4 - 6, 4, 42);
        // Rug
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.82, 36, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f5d442'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.82, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'game': {
        // Retro game screen: dark bg, pixel ship, stars, score
        ctx.fillStyle = '#0a0a2e'; ctx.fillRect(0, 0, w, h);
        // Stars
        for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        // Spaceship
        ctx.fillStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.55); ctx.lineTo(w * 0.5 - 16, h * 0.75); ctx.lineTo(w * 0.5 + 16, h * 0.75); ctx.fill();
        ctx.fillStyle = '#0ff'; ctx.fillRect(w * 0.5 - 3, h * 0.75, 6, 8);
        // Enemies
        const enemies = [[0.2, 0.15], [0.5, 0.12], [0.8, 0.18], [0.35, 0.28], [0.65, 0.25]];
        enemies.forEach(([ex, ey]) => { ctx.fillStyle = '#f44'; ctx.fillRect(w * ex - 8, h * ey, 16, 12); ctx.fillStyle = '#ff0'; ctx.fillRect(w * ex - 4, h * ey + 3, 3, 3); ctx.fillRect(w * ex + 2, h * ey + 3, 3, 3); });
        // Score
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace'; ctx.fillText('SCORE: 4280', 6, 14);
        ctx.fillStyle = '#f44'; ctx.fillText('♥♥♥', w - 40, 14);
        break;
      }
      case 'sunset': {
        // Sunset gradient, water, silhouette
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a0533'); grad.addColorStop(0.35, '#e8451c'); grad.addColorStop(0.55, '#ffa62b'); grad.addColorStop(0.65, '#ffd56b');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h * 0.65);
        // Sun
        ctx.fillStyle = '#ffd56b'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.52, 24, 0, Math.PI * 2); ctx.fill();
        // Water
        const wGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
        wGrad.addColorStop(0, '#ffa62b'); wGrad.addColorStop(1, '#1a0533');
        ctx.fillStyle = wGrad; ctx.fillRect(0, h * 0.65, w, h * 0.35);
        // Reflection
        for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,213,107,${0.3 - i * 0.04})`; ctx.fillRect(w * 0.42, h * 0.68 + i * 6, w * 0.16, 2); }
        // Silhouette
        ctx.fillStyle = '#0a0015';
        ctx.beginPath(); ctx.moveTo(0, h * 0.62); ctx.quadraticCurveTo(w * 0.15, h * 0.5, w * 0.25, h * 0.6); ctx.lineTo(w * 0.25, h * 0.65); ctx.lineTo(0, h * 0.65); ctx.fill();
        break;
      }
      case 'pet': {
        // Cute cat drawing
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 0.55;
        // Body
        ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.ellipse(cx, cy, 30, 36, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.arc(cx, cy - 34, 24, 0, Math.PI * 2); ctx.fill();
        // Ears
        ctx.beginPath(); ctx.moveTo(cx - 18, cy - 52); ctx.lineTo(cx - 28, cy - 72); ctx.lineTo(cx - 6, cy - 56); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 18, cy - 52); ctx.lineTo(cx + 28, cy - 72); ctx.lineTo(cx + 6, cy - 56); ctx.fill();
        ctx.fillStyle = '#ffb74d';
        ctx.beginPath(); ctx.moveTo(cx - 15, cy - 52); ctx.lineTo(cx - 23, cy - 66); ctx.lineTo(cx - 8, cy - 54); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 15, cy - 52); ctx.lineTo(cx + 23, cy - 66); ctx.lineTo(cx + 8, cy - 54); ctx.fill();
        // Eyes
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(cx - 9, cy - 36, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 9, cy - 36, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 7, cy - 38, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 11, cy - 38, 1.5, 0, Math.PI * 2); ctx.fill();
        // Nose + mouth
        ctx.fillStyle = '#e57373'; ctx.beginPath(); ctx.moveTo(cx, cy - 28); ctx.lineTo(cx - 4, cy - 24); ctx.lineTo(cx + 4, cy - 24); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy - 24); ctx.quadraticCurveTo(cx - 8, cy - 18, cx - 12, cy - 24); ctx.moveTo(cx, cy - 24); ctx.quadraticCurveTo(cx + 8, cy - 18, cx + 12, cy - 24); ctx.stroke();
        // Whiskers
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
        [[-1, -2], [-1, 2], [1, -2], [1, 2]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(cx + sx * 14, cy - 26 + sy); ctx.lineTo(cx + sx * 32, cy - 28 + sy * 3); ctx.stroke(); });
        // Tail
        ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + 26, cy + 20); ctx.quadraticCurveTo(cx + 52, cy - 10, cx + 44, cy - 30); ctx.stroke();
        break;
      }
      case 'food': {
        // Pizza
        ctx.fillStyle = '#fff8e1'; ctx.fillRect(0, 0, w, h);
        // Plate
        ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.55, 55, 42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.stroke();
        // Pizza triangle
        ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.2); ctx.lineTo(w * 0.25, h * 0.78); ctx.lineTo(w * 0.75, h * 0.78); ctx.fill();
        // Crust
        ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.78); ctx.quadraticCurveTo(w * 0.5, h * 0.86, w * 0.75, h * 0.78); ctx.lineTo(w * 0.72, h * 0.74); ctx.quadraticCurveTo(w * 0.5, h * 0.82, w * 0.28, h * 0.74); ctx.fill();
        // Pepperoni
        ctx.fillStyle = '#c0392b';
        [[0.45, 0.45], [0.55, 0.55], [0.42, 0.62], [0.58, 0.42], [0.5, 0.7]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(w * px, h * py, 7, 0, Math.PI * 2); ctx.fill(); });
        // Cheese drip
        ctx.fillStyle = '#f9e547';
        ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.22); ctx.quadraticCurveTo(w * 0.48, h * 0.32, w * 0.46, h * 0.3); ctx.stroke();
        break;
      }
      case 'park': {
        // Park with sky, grass, trees, path
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h * 0.55);
        ctx.fillStyle = '#4caf50'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
        // Path
        ctx.fillStyle = '#d4a76a'; ctx.beginPath(); ctx.moveTo(w * 0.4, h); ctx.quadraticCurveTo(w * 0.45, h * 0.7, w * 0.5, h * 0.55); ctx.quadraticCurveTo(w * 0.55, h * 0.7, w * 0.6, h); ctx.fill();
        // Trees
        const trees = [[0.15, 0.5], [0.35, 0.45], [0.7, 0.48], [0.88, 0.52]];
        trees.forEach(([tx, ty]) => {
          ctx.fillStyle = '#6d4c41'; ctx.fillRect(w * tx - 4, h * ty, 8, 24);
          ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(w * tx, h * ty - 6, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#388e3c'; ctx.beginPath(); ctx.arc(w * tx - 6, h * ty + 2, 14, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(w * tx + 8, h * ty, 14, 0, Math.PI * 2); ctx.fill();
        });
        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        [[0.25, 0.18], [0.72, 0.12]].forEach(([cx2, cy2]) => { ctx.beginPath(); ctx.arc(w * cx2, h * cy2, 16, 0, Math.PI * 2); ctx.arc(w * cx2 + 14, h * cy2 - 4, 12, 0, Math.PI * 2); ctx.arc(w * cx2 - 12, h * cy2 + 2, 10, 0, Math.PI * 2); ctx.fill(); });
        // Sun
        ctx.fillStyle = '#ffe03a'; ctx.beginPath(); ctx.arc(w * 0.88, h * 0.12, 16, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'selfie': {
        // Funny cartoon face selfie
        ctx.fillStyle = '#e8f5e9'; ctx.fillRect(0, 0, w, h);
        const sx = w * 0.5, sy = h * 0.48;
        // Face
        ctx.fillStyle = '#ffcc80'; ctx.beginPath(); ctx.arc(sx, sy, 42, 0, Math.PI * 2); ctx.fill();
        // Hair
        ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(sx, sy - 16, 44, Math.PI, 2 * Math.PI); ctx.fill();
        ctx.fillRect(sx - 44, sy - 20, 10, 30); ctx.fillRect(sx + 34, sy - 20, 10, 30);
        // Eyes
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(sx - 14, sy - 6, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sx + 14, sy - 6, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(sx - 12, sy - 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + 16, sy - 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx - 10, sy - 6, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + 18, sy - 6, 2, 0, Math.PI * 2); ctx.fill();
        // Big grin
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, sy + 8, 18, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy + 8, 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
        // Tongue
        ctx.fillStyle = '#e57373'; ctx.beginPath(); ctx.ellipse(sx, sy + 24, 8, 5, 0, 0, Math.PI); ctx.fill();
        // Cheeks
        ctx.fillStyle = 'rgba(255,138,128,0.4)'; ctx.beginPath(); ctx.arc(sx - 30, sy + 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + 30, sy + 8, 10, 0, Math.PI * 2); ctx.fill();
        // Peace sign hand
        ctx.fillStyle = '#ffcc80';
        ctx.fillRect(w * 0.78, h * 0.6, 10, 28);
        ctx.fillRect(w * 0.78 + 12, h * 0.56, 10, 28);
        ctx.fillRect(w * 0.78 + 3, h * 0.84, 18, 10);
        break;
      }
    }
  }

  let galleryOpen = false;

  function toggleGallery() {
    galleryOpen = !galleryOpen;
    const gal = el('kc-gallery');
    if (!gal) return;
    gal.style.display = galleryOpen ? 'flex' : 'none';
    if (galleryOpen) renderGallery();
  }

  function renderGallery() {
    const grid = el('kc-gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    GALLERY_IMAGES.forEach(img => {
      const item = document.createElement('div');
      item.className = 'kc-gallery-item';
      item.innerHTML = `<canvas class="kc-gallery-canvas" width="140" height="100"></canvas><span>${img.label}</span>`;
      item.onclick = () => sendImage(img.id);
      grid.appendChild(item);
      drawGalleryImage(img.id, item.querySelector('canvas'));
    });
  }

  function sendImage(imageId) {
    if (!activeId) return;
    const c = getContact(activeId);
    if (!c) return;

    // Close gallery
    galleryOpen = false;
    const gal = el('kc-gallery');
    if (gal) gal.style.display = 'none';

    // Add image message
    const imgInfo = GALLERY_IMAGES.find(g => g.id === imageId);
    c.messages.push({ from: 'me', type: 'image', imageId, text: imgInfo ? imgInfo.label : 'Photo', time: now() });
    saveData();
    renderMessages();
    renderContactList();
    scrollToBottom();

    // Auto-reply about the image
    if (typingTimer) clearTimeout(typingTimer);
    const imageReplies = [
      'Wow, great photo! 😍',
      'That looks amazing! 📸',
      'Love it! 🥰',
      'So cool! Can I see more? 😊',
      'Haha nice one! 😄',
      'That\'s awesome! 🌟',
      'Pretty! 💖',
    ];
    const delay = 1200 + Math.random() * 1400;
    setTimeout(() => {
      const typingEl = el('kc-typing');
      if (typingEl && activeId === c.id) typingEl.style.display = 'flex';
      scrollToBottom();
    }, 600);
    typingTimer = setTimeout(() => {
      const typingEl = el('kc-typing');
      if (typingEl) typingEl.style.display = 'none';
      const reply = imageReplies[Math.floor(Math.random() * imageReplies.length)];
      c.messages.push({ from: c.id, text: reply, time: now() });
      saveData();
      renderMessages();
      renderContactList();
      scrollToBottom();
    }, delay);
  }

  /* ---- Contact Dialog (Add / Edit) ---- */

  const AVATARS = ['👦','👧','🧒','👶','👩','👨','👵','👴','🧓','👩‍🦰','👨‍🦱','👱','🧑‍🎓','🧑‍🚀','🧑‍🎨','🦸','🧚','🐶','🐱','🐻','🐼','🦊','🐸','🐵'];
  const COLORS  = ['#f44336','#e91e8c','#9c27b0','#673ab7','#1976d2','#0097a7','#388e3c','#ff9800','#795548','#607d8b'];

  let dialogMode = null;   // 'add' or 'edit'
  let dialogAvatar = null;
  let dialogColor = null;

  function showContactDialog(mode) {
    dialogMode = mode === 'edit' ? 'edit' : 'add';
    const c = dialogMode === 'edit' ? getContact(activeId) : null;

    dialogAvatar = c ? c.avatar : AVATARS[0];
    dialogColor = c ? c.color : COLORS[0];

    el('kc-dialog-title').textContent = dialogMode === 'edit' ? 'Edit Contact' : 'New Contact';
    const nameInput = el('kc-dialog-name');
    nameInput.value = c ? c.name : '';
    if (dialogMode === 'edit') nameInput.placeholder = c.name;

    // Render avatar grid
    const aGrid = el('kc-avatar-grid');
    aGrid.innerHTML = AVATARS.map(a =>
      `<div class="kc-avatar-opt${a === dialogAvatar ? ' selected' : ''}" onclick="KidsChat.pickAvatar(this, '${a}')">${a}</div>`
    ).join('');

    // Render color grid
    const cGrid = el('kc-color-grid');
    cGrid.innerHTML = COLORS.map(c =>
      `<div class="kc-color-opt${c === dialogColor ? ' selected' : ''}" style="background:${c}" onclick="KidsChat.pickColor(this, '${c}')"></div>`
    ).join('');

    el('kc-dialog').style.display = 'flex';
    nameInput.focus();
  }

  function pickAvatar(elem, avatar) {
    dialogAvatar = avatar;
    el('kc-avatar-grid').querySelectorAll('.kc-avatar-opt').forEach(e => e.classList.remove('selected'));
    elem.classList.add('selected');
  }

  function pickColor(elem, color) {
    dialogColor = color;
    el('kc-color-grid').querySelectorAll('.kc-color-opt').forEach(e => e.classList.remove('selected'));
    elem.classList.add('selected');
  }

  function cancelDialog() {
    el('kc-dialog').style.display = 'none';
    dialogMode = null;
  }

  function confirmDialog() {
    const nameInput = el('kc-dialog-name');
    const name = nameInput.value.trim();

    if (dialogMode === 'add') {
      if (!name) { nameInput.focus(); return; }
      const id = 'contact_' + Date.now();
      contacts.push({
        id, name, avatar: dialogAvatar, color: dialogColor,
        replies: ["Hi there! 👋", "That's great! 😊", "Tell me more! 🤔", "Sounds fun! 🎉"],
        messages: [],
      });
      replyCounters[id] = 0;
      saveData();
      renderContactList();
      cancelDialog();
      selectContact(id);
    } else if (dialogMode === 'edit') {
      const c = getContact(activeId);
      if (!c) return;
      if (name) c.name = name;
      c.avatar = dialogAvatar;
      c.color = dialogColor;
      saveData();
      renderContactList();
      cancelDialog();
      selectContact(c.id);
    }
  }

  /* ---- Helpers ---- */

  function el(id) { return document.getElementById(id); }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, destroy, send, selectContact, toggleGallery, showContactDialog, pickAvatar, pickColor, confirmDialog, cancelDialog, openEditPanel, closeEditPanel, addReply, deleteReply };
})();
