/* ===== eJob — Executive Email Simulator ===== */
(() => {
  const EMAILS = [
    { from: 'Mom', emoji: '👩', subject: 'Dinner tonight?', body: 'Hi sweetie, what do you want for dinner? Also please clean your room.' },
    { from: 'Dad', emoji: '👨', subject: 'About the glitter...', body: "There's glitter everywhere in the kitchen. Care to explain?" },
    { from: 'Grandma', emoji: '👵', subject: 'Cookies!', body: 'I made your favorite cookies! When are you visiting?' },
    { from: 'Best Friend', emoji: '😎', subject: 'EMERGENCY!!!', body: 'Dude!! Did you see the new episode?? We need to talk NOW!' },
    { from: 'Mom', emoji: '👩', subject: 'Homework update', body: "Your teacher emailed me. She says you haven't turned in your homework??" },
    { from: 'Dad', emoji: '👨', subject: 'Lawn proposal', body: "If you mow the lawn this weekend, I'll increase your allowance. Deal?" },
    { from: 'Sister', emoji: '👧', subject: 'STAY OUT OF MY ROOM', body: 'I KNOW you took my charger. Return it or ELSE.' },
    { from: 'Grandpa', emoji: '👴', subject: 'Fishing trip', body: "How about we go fishing this Saturday? I'll bring the snacks!" },
    { from: 'Best Friend', emoji: '😎', subject: 'Sleepover plan', body: 'Can you sleep over Friday? My mom said OK if your parents say yes!' },
    { from: 'Mom', emoji: '👩', subject: 'Vegetables', body: 'You need to eat more vegetables. This is not negotiable, young person.' },
    { from: 'Teacher', emoji: '🧑‍🏫', subject: 'Great work!', body: 'Your science project was excellent! Keep it up!' },
    { from: 'Dad', emoji: '👨', subject: 'The bike situation', body: "Found your bike in the rain AGAIN. We've talked about this." },
    { from: 'Cousin', emoji: '🧒', subject: 'Birthday party!!', body: "My birthday is next Saturday! There's gonna be a BOUNCY CASTLE!!" },
    { from: 'Best Friend', emoji: '😎', subject: 'Secret mission', body: 'Meet me at the big tree after school. Bring snacks. Tell NO ONE.' },
    { from: 'Grandma', emoji: '👵', subject: 'New sweater!', body: 'I knitted you a new sweater! It has dinosaurs on it!' },
  ];

  const REPLIES = [
    "Hi Mom, circling back on dinner. Please see attached: my appetite. Let's align at 19:00. Regards.",
    "Per my previous communication, the glitter situation is under review. I've escalated to the cat. No further questions at this time.",
    'Dear Grandma, confirming receipt of cookie intel. ETA for pickup: ASAP. This is now my highest priority.',
    'Acknowledged. Scheduling emergency debrief re: the episode. Please prepare talking points and snacks.',
    'Homework deliverables are in the pipeline. Expect completion by EOD. Thank you for your patience.',
    "Re: lawn proposal \u2014 I accept the terms pending formal documentation. Please draft an agreement for my review.",
    'Your concerns have been noted and filed. The charger relocation was a strategic business decision. Case closed.',
    "Fishing trip: approved. I'll prepare a detailed snack requirements document by Friday. Looking forward to synergizing.",
    'Sleepover request has been forwarded to upper management (parents). Awaiting sign-off. Fingers crossed on approval.',
    'I acknowledge the vegetable mandate. Counter-proposal: pizza counts if it has peppers on it. Please advise.',
    "Thank you for the positive performance review. I'd like to schedule a meeting to discuss a raise in my allowance.",
    'The bike situation has been addressed. Implementing new garage-first protocol effective immediately. My apologies.',
    "RSVP: confirmed. Bouncy castle access is mission-critical. Please advise on dress code. I'll bring the vibes.",
    'Mission accepted. Snack procurement is underway. Initiating radio silence until rendezvous. Over and out.',
    'Sweater received with great enthusiasm. Dinosaur pattern exceeds all expectations. Five stars, would wear again.',
  ];

  const RANKS = [
    { min: 0,  label: '\u{1F4CB} Intern' },
    { min: 3,  label: '\u{1F4BC} Junior Associate' },
    { min: 6,  label: '\u{1F4CA} Manager' },
    { min: 9,  label: '\u{1F3E2} VP of Replies' },
    { min: 12, label: '\u{1F454} CEO' },
    { min: 15, label: '\u{1F31F} Legendary Boss' },
  ];

  // Game state
  let state = 'idle';
  let emails = [];
  let currentIdx = 0;
  let charIdx = 0;
  let score = 0;
  let combo = 1;
  let emailsSent = 0;
  let bestCombo = 0;
  let hiScore = 0;
  let timer = 90;
  let timerInterval = null;
  let emailStartTime = 0;
  let lastSendTime = 0;
  let winId = null;
  let keyHandler = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getRank(sent) {
    let rank = RANKS[0].label;
    for (const r of RANKS) { if (sent >= r.min) rank = r.label; }
    return rank;
  }

  function fmt(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function startGame() {
    state = 'playing';
    emails = shuffle(EMAILS.map((e, i) => ({ ...e, ri: i })));
    currentIdx = 0;
    charIdx = 0;
    score = 0;
    combo = 1;
    emailsSent = 0;
    bestCombo = 0;
    timer = 90;
    emailStartTime = Date.now();
    lastSendTime = Date.now();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer--;
      if (timer <= 0) { timer = 0; endGame(); }
      render();
    }, 1000);
    render();
  }

  function handleInput() {
    if (state !== 'playing') return;
    const reply = REPLIES[emails[currentIdx].ri];
    charIdx = Math.min(charIdx + 3 + Math.floor(Math.random() * 2), reply.length);
    render();
    if (charIdx >= reply.length) sendEmail();
  }

  function sendEmail() {
    const now = Date.now();
    const elapsed = (now - emailStartTime) / 1000;

    let pts = 100;
    if (elapsed < 5) pts += Math.round(50 * (1 - elapsed / 5));

    if (emailsSent > 0 && (now - lastSendTime) / 1000 < 8) {
      combo = Math.min(combo + 1, 5);
    } else if (emailsSent > 0) {
      combo = 1;
    }

    pts *= combo;
    score += pts;
    emailsSent++;
    if (combo > bestCombo) bestCombo = combo;
    lastSendTime = now;

    currentIdx++;
    if (currentIdx >= emails.length) {
      emails = shuffle(EMAILS.map((e, i) => ({ ...e, ri: i })));
      currentIdx = 0;
    }
    charIdx = 0;
    emailStartTime = Date.now();

    render();
    requestAnimationFrame(() => {
      const flash = document.getElementById('ej-sent-flash');
      if (flash) { flash.classList.remove('ej-flash-anim'); void flash.offsetWidth; flash.classList.add('ej-flash-anim'); }
      if (combo > 1) {
        const pop = document.getElementById('ej-combo-pop');
        if (pop) { pop.textContent = 'x' + combo + ' COMBO!'; pop.classList.remove('ej-pop-anim'); void pop.offsetWidth; pop.classList.add('ej-pop-anim'); }
      }
    });
  }

  function endGame() {
    state = 'gameover';
    clearInterval(timerInterval);
    timerInterval = null;
    if (score > hiScore) { hiScore = score; localStorage.setItem('kidsOS_ejobHi', String(hiScore)); }
    render();
  }

  function render() {
    const body = document.getElementById('win-body-' + winId);
    if (!body) return;

    if (state === 'idle') {
      body.innerHTML = `<div class="ej-wrap"><div class="ej-idle">
        <div class="ej-idle-icon">💼</div>
        <div class="ej-idle-title">eJob</div>
        <div class="ej-idle-subtitle">Executive Email Simulator</div>
        <div class="ej-idle-desc">Mash your keyboard to auto-write hilariously corporate replies to emails from family and friends!</div>
        <div class="ej-idle-rules">
          <div>⏱️ 90 seconds on the clock</div>
          <div>⌨️ Any key = type reply characters</div>
          <div>⚡ Fast replies = speed bonus!</div>
          <div>🔥 Quick combos = score multiplier!</div>
        </div>
        <button class="ej-start-btn" onclick="window._ejobStart()">Start Your Shift</button>
        ${hiScore > 0 ? '<div class="ej-hi-score">\u{1F3C6} High Score: ' + hiScore + '</div>' : ''}
      </div></div>`;
      return;
    }

    if (state === 'gameover') {
      body.innerHTML = `<div class="ej-wrap"><div class="ej-gameover">
        <div class="ej-go-rank">${getRank(emailsSent)}</div>
        <div class="ej-go-title">Shift Over!</div>
        <div class="ej-go-stats">
          <div class="ej-go-stat"><span>📧 Emails Sent</span><strong>${emailsSent}</strong></div>
          <div class="ej-go-stat"><span>⭐ Score</span><strong>${score}</strong></div>
          <div class="ej-go-stat"><span>🔥 Best Combo</span><strong>x${bestCombo}</strong></div>
          <div class="ej-go-stat"><span>🏆 High Score</span><strong>${hiScore}</strong></div>
        </div>
        <button class="ej-start-btn" onclick="window._ejobStart()">Play Again</button>
      </div></div>`;
      return;
    }

    // Playing
    const email = emails[currentIdx];
    const reply = REPLIES[email.ri];
    const typed = reply.substring(0, charIdx);
    const pct = Math.round((charIdx / reply.length) * 100);

    let inbox = '';
    const show = Math.min(emails.length, 12);
    for (let i = 0; i < show; i++) {
      const e = emails[i];
      let st, cls;
      if (i < currentIdx) { st = '✅'; cls = 'ej-done'; }
      else if (i === currentIdx) { st = '▶'; cls = 'ej-current'; }
      else { st = '·'; cls = 'ej-pending'; }
      inbox += '<div class="ej-inbox-item ' + cls + '"><span class="ej-inbox-status">' + st + '</span><span class="ej-inbox-emoji">' + e.emoji + '</span><span class="ej-inbox-name">' + e.from + '</span></div>';
    }

    body.innerHTML = `<div class="ej-wrap">
      <div class="ej-stats">
        <span class="ej-score">⭐ ${score}</span>
        ${combo > 1 ? '<span class="ej-combo">\u{1F525} x' + combo + '</span>' : ''}
        <span class="ej-rank">${getRank(emailsSent)}</span>
        <span class="ej-timer ${timer <= 10 ? 'ej-timer-low' : ''}">⏱️ ${fmt(timer)}</span>
      </div>
      <div class="ej-body">
        <div class="ej-inbox"><div class="ej-inbox-title">INBOX</div><div class="ej-inbox-list">${inbox}</div></div>
        <div class="ej-view">
          <div class="ej-email-header">
            <span class="ej-sender-emoji">${email.emoji}</span>
            <div class="ej-sender-info">
              <div class="ej-sender-name">${email.from}</div>
              <div class="ej-subject">RE: ${email.subject}</div>
            </div>
          </div>
          <div class="ej-email-body">"${email.body}"</div>
          <div class="ej-reply-section">
            <div class="ej-reply-label">── Your Reply ──</div>
            <div class="ej-reply-text">${typed}<span class="ej-cursor">|</span></div>
          </div>
          <div class="ej-progress-wrap"><div class="ej-progress-bar" style="width:${pct}%"></div></div>
          <div class="ej-progress-pct">${pct}%</div>
          <div id="ej-sent-flash" class="ej-sent-flash">✅ SENT!</div>
          <div id="ej-combo-pop" class="ej-combo-pop"></div>
        </div>
      </div>
      <div class="ej-tap-zone" onclick="window._ejobInput()" ontouchstart="window._ejobInput(); event.preventDefault();">⌨️ Mash any key to type!</div>
    </div>`;
  }

  // Expose minimal globals for onclick handlers
  window._ejobStart = startGame;
  window._ejobInput = handleInput;

  OS.registerApp('ejob', {
    singleInstance: true,
    getWindowOpts() {
      return { id: 'ejob', title: 'eJob', icon: '💼', width: 640, height: 480, content: '' };
    },
    onOpen(id) {
      winId = id;
      const saved = localStorage.getItem('kidsOS_ejobHi');
      hiScore = saved ? parseInt(saved, 10) || 0 : 0;
      state = 'idle';
      render();

      keyHandler = (e) => {
        const win = document.getElementById('window_ejob');
        if (!win || !win.classList.contains('focused')) return;
        if (state !== 'playing') return;
        if (['Shift','Control','Alt','Meta','Tab','Escape','CapsLock'].includes(e.key)) return;
        e.preventDefault();
        handleInput();
      };
      document.addEventListener('keydown', keyHandler);
    },
    onClose() {
      if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
      state = 'idle';
      clearInterval(timerInterval);
      timerInterval = null;
    },
  });
})();
