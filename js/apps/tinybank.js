/* ===== TinyBank — Parody Banking App for Kids ===== */
(() => {
  const t = OS.texts('tinybank');

  /* ---- Data Constants ---- */
  const EARN_TASKS = [
    { id: 'bed', emoji: '🛏️', name: 'Made the Bed (Without Being Asked!)', coins: 10 },
    { id: 'teeth', emoji: '🪥', name: 'Brushed Teeth Twice Today', coins: 5 },
    { id: 'homework', emoji: '📚', name: 'Finished Homework on Time', coins: 15 },
    { id: 'sock', emoji: '🧦', name: 'Found the Missing Sock', coins: 8 },
    { id: 'veggie', emoji: '🥦', name: 'Ate a Vegetable Voluntarily', coins: 12 },
    { id: 'pet', emoji: '🐕', name: 'Fed the Pet (Real or Imaginary)', coins: 7 },
    { id: 'clean', emoji: '🧹', name: 'Cleaned Room Without Crying', coins: 14 },
    { id: 'nice', emoji: '💕', name: 'Said Something Nice to a Sibling', coins: 10 },
  ];

  const RAISE_RESPONSES = [
    { id: 'board', text: "The board of directors (Mom) says: 'Lol, no.'", coins: 0 },
    { id: 'maybe', text: "Your request has been forwarded to the Department of Maybe. They're on lunch.", coins: 0 },
    { id: 'sympathy', text: "Congratulations! You've been awarded 5 Sympathy Coins.", coins: 5 },
    { id: 'ceo', text: "The CEO (Dad) reviewed your case. Here's 10 coins and a pat on the head.", coins: 10 },
    { id: 'grandma', text: "JACKPOT! Grandma heard about your raise request. Here's 25 coins!", coins: 25 },
    { id: 'hr', text: "HR says you get 3 coins and a participation trophy.", coins: 3 },
  ];

  const JARS = [
    { id: 'treasure', emoji: '🏴‍☠️', name: 'Treasure Chest' },
    { id: 'cookie', emoji: '🍪', name: 'Cookie Jar' },
    { id: 'fun', emoji: '🎉', name: 'Emergency Fun Fund' },
    { id: 'dragon', emoji: '🐉', name: 'Dragon Savings' },
  ];

  const GOALS = [
    { id: 'castle', emoji: '🏰', name: 'Build a Castle', target: 100, deadline: 'Before the dragons notice' },
    { id: 'rocket', emoji: '🚀', name: 'Buy a Rocket', target: 250, deadline: 'Before Mars gets boring' },
    { id: 'unicorn', emoji: '🦄', name: 'Adopt a Unicorn', target: 150, deadline: 'While supplies last' },
    { id: 'pizza', emoji: '🍕', name: 'Infinite Pizza Pass', target: 200, deadline: 'Before you get hungry' },
    { id: 'robot', emoji: '🤖', name: 'Personal Robot Butler', target: 300, deadline: 'Before homework is due' },
  ];

  const CARD_SKINS = [
    { id: 'unicorn', name: 'Unicorn Platinum', emoji: '🦄', gradient: 'linear-gradient(135deg, #e040fb, #7c4dff, #448aff)' },
    { id: 'robot', name: 'Robot Titanium', emoji: '🤖', gradient: 'linear-gradient(135deg, #546e7a, #90a4ae, #cfd8dc)' },
    { id: 'pirate', name: 'Pirate Gold-ish', emoji: '🏴‍☠️', gradient: 'linear-gradient(135deg, #ff8f00, #ffc107, #ffe082)' },
  ];

  const FRAUD_ALERTS = [
    '🚨 URGENT: Someone tried to buy 47 rubber ducks with your card!',
    '🚨 ALERT: Suspicious purchase of 100kg of gummy bears detected!',
    '🚨 WARNING: Your card was used to rent a bouncy castle in Antarctica!',
    '🚨 CRITICAL: Someone ordered a lifetime supply of glitter with your account!',
  ];

  const FRAUD_RESPONSES = [
    { id: 'me', label: 'It was me 😅', result: 'Transaction approved. The rubber ducks are on their way.' },
    { id: 'cat', label: 'Blame the cat 🐱', result: 'We\'ve flagged the cat as a suspect. Case closed.' },
    { id: 'bank', label: 'Call the Bank 📞', result: 'You\'re already IN the bank. But okay, we\'ll investigate.' },
  ];

  const BADGES_DEF = [
    { id: 'ceo', emoji: '👔', name: 'Tiny CEO', desc: 'Earn 100+ total coins', check: s => s.totalEarned >= 100 },
    { id: 'ninja', emoji: '🥷', name: 'Savings Ninja', desc: 'Save 50+ coins in jars', check: s => jarTotal(s) >= 50 },
    { id: 'wizard', emoji: '🧙', name: 'Budget Wizard', desc: 'Make 10+ transactions', check: s => s.history.length >= 10 },
    { id: 'guardian', emoji: '🛡️', name: 'Vault Guardian', desc: 'Save 200+ coins in jars', check: s => jarTotal(s) >= 200 },
    { id: 'detective', emoji: '🔍', name: 'Fraud Detective', desc: 'Handle a fraud alert', check: s => s.fraudsHandled >= 1 },
    { id: 'kindness', emoji: '💝', name: 'Kindness Banker', desc: 'Give 25+ coins to charity', check: s => s.givenTotal >= 25 },
  ];

  const DAILY_MESSAGES = [
    "Your money is totally safe. We checked under the mattress.",
    "Markets are up! (We think. We don't actually know what that means.)",
    "Fun fact: Giggle Coins are backed by giggles. Very stable.",
    "Breaking news: The piggy bank workers' union is on strike.",
    "Alert: Your savings are growing! Or they're just sitting there. Hard to tell.",
    "Reminder: Money can't buy happiness, but it CAN buy rubber ducks.",
    "The bank vault is guarded by a very sleepy dragon. Don't worry.",
    "Interest rates today: Interesting. That's all we know.",
  ];

  const SAVE_CONFIRMATIONS = [
    'The coins have been safely dropped into the jar! *clink clink*',
    'Your money is now wearing a tiny jar-shaped hat. Cozy!',
    'Deposit complete! The coins are having a pool party in there.',
    'Saved! Your future self is doing a happy dance right now.',
    'Cha-ching! That jar is looking THICC with coins.',
    'Money secured! Even the dragon couldn\'t get it now.',
  ];

  const DAILY_MISSIONS_POOL = [
    { id: 'dm_earn', text: 'Earn coins from any task', check: (s, ms) => ms._earned },
    { id: 'dm_save', text: 'Save coins to any jar', check: (s, ms) => ms._saved },
    { id: 'dm_goal', text: 'Add coins to a goal', check: (s, ms) => ms._goaled },
    { id: 'dm_give', text: 'Give coins to charity', check: (s, ms) => ms._given },
    { id: 'dm_card', text: 'Visit your TinyCard', check: (s, ms) => ms._cardVisited },
    { id: 'dm_raise', text: 'Ask for a raise', check: (s, ms) => ms._raisedAsked },
    { id: 'dm_history', text: 'Check your Drama Log', check: (s, ms) => ms._historyVisited },
    { id: 'dm_badges', text: 'View your badges', check: (s, ms) => ms._badgesViewed },
  ];

  const GIVE_CATEGORIES = [
    { id: 'animals', emoji: '🐾', name: 'Animal Friends', desc: 'Help feed imaginary shelter animals' },
    { id: 'trees', emoji: '🌳', name: 'Plant a Tree', desc: 'Plant pretend trees to save fake forests' },
    { id: 'smiles', emoji: '😊', name: 'Smile Delivery', desc: 'Send smiles to people who need them' },
  ];

  /* ---- Helper Functions ---- */
  function jarTotal(s) { return JARS.reduce((sum, j) => sum + (s.jars[j.id] || 0), 0); }
  function goalTotal(s) { return GOALS.reduce((sum, g) => sum + (getGoalSaved(s, g.id)), 0); }
  function getGoalSaved(s, gid) { const g = s.goals.find(x => x.id === gid); return g ? g.saved : 0; }
  function fmt(n) { return n.toLocaleString(OS.locale()); }
  function gc(n) { return t('{n} GC', { n }); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function dateStr() {
    const d = new Date();
    return d.toLocaleDateString(OS.locale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /* ---- State ---- */
  let state = {};
  let screen = 'home';
  let raiseResult = null;
  let saveMsg = null;
  let saveMsgTimer = null;
  let fraudAlert = null;
  let fraudResult = null;
  let showBadges = false;
  let missionTracking = {};
  let winId = null;

  function defaultState() {
    return {
      balance: 50,
      jars: {},
      goals: GOALS.map(g => ({ id: g.id, saved: 0 })),
      history: [],
      earnedToday: [],
      lastEarnDate: today(),
      badges: [],
      cardSkin: 0,
      cardFrozen: false,
      givenTotal: 0,
      totalEarned: 0,
      fraudsHandled: 0,
      dailyMissions: null,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('kidsOS_tinybank');
      state = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch (e) { state = defaultState(); }
    // Daily reset
    if (state.lastEarnDate !== today()) {
      state.earnedToday = [];
      state.lastEarnDate = today();
      state.dailyMissions = null;
    }
    if (!state.dailyMissions || state.dailyMissions.date !== today()) {
      generateDailyMissions();
    }
    missionTracking = {};
    checkBadges();
  }

  function saveState() {
    localStorage.setItem('kidsOS_tinybank', JSON.stringify(state));
  }

  function generateDailyMissions() {
    const pool = [...DAILY_MISSIONS_POOL];
    const picked = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push({ id: pool[idx].id, done: false });
      pool.splice(idx, 1);
    }
    state.dailyMissions = { date: today(), missions: picked };
  }

  function checkMissions() {
    if (!state.dailyMissions) return;
    state.dailyMissions.missions.forEach(m => {
      if (m.done) return;
      const def = DAILY_MISSIONS_POOL.find(x => x.id === m.id);
      if (def && def.check(state, missionTracking)) m.done = true;
    });
    saveState();
  }

  function checkBadges() {
    BADGES_DEF.forEach(b => {
      if (!state.badges.includes(b.id) && b.check(state)) {
        state.badges.push(b.id);
      }
    });
  }

  function addHistory(emoji, text, amount) {
    state.history.unshift({ emoji, text, amount, date: dateStr() });
    if (state.history.length > 30) state.history.pop();
  }

  /* ---- Render ---- */
  function render() {
    const body = document.getElementById('win-body-' + winId);
    if (!body) return;
    checkBadges();
    checkMissions();

    let html = '';
    switch (screen) {
      case 'home': html = renderHome(); break;
      case 'earn': html = renderEarn(); break;
      case 'save': html = renderSave(); break;
      case 'goals': html = renderGoals(); break;
      case 'history': html = renderHistory(); break;
      case 'card': html = renderCard(); break;
      case 'give': html = renderGive(); break;
    }
    body.innerHTML = html;
  }

  function renderHome() {
    // t.plural with 'Giggle Coins' two times: English shows one form for each number, Serbian has 3 forms
    const messages = t.list('tinybank.news', DAILY_MESSAGES);
    const msg = messages[Math.floor(Date.now() / 86400000) % messages.length];
    const pool = t.list('tinybank.missions', DAILY_MISSIONS_POOL);
    const badges = t.list('tinybank.badges', BADGES_DEF);
    const missions = state.dailyMissions ? state.dailyMissions.missions : [];
    const earned = state.badges || [];

    let badgeOverlay = '';
    if (showBadges) {
      badgeOverlay = `<div class="tb-overlay" onclick="window._tbCloseBadges(event)">
        <div class="tb-overlay-box" onclick="event.stopPropagation()">
          <div class="tb-overlay-title">🏆 ${t('All Badges')}</div>
          <div class="tb-badge-grid">
            ${badges.map(b => {
              const unlocked = earned.includes(b.id);
              return `<div class="tb-badge-card ${unlocked ? 'tb-badge-unlocked' : 'tb-badge-locked'}">
                <div class="tb-badge-icon">${unlocked ? b.emoji : '🔒'}</div>
                <div class="tb-badge-name">${b.name}</div>
                <div class="tb-badge-desc">${b.desc}</div>
              </div>`;
            }).join('')}
          </div>
          <button class="tb-btn tb-btn-sm" onclick="window._tbCloseBadges(event)">${t('Close')}</button>
        </div>
      </div>`;
    }

    return `<div class="tb-wrap">
      ${badgeOverlay}
      <div class="tb-header">
        <span class="tb-logo">🏦 ${t('TinyBank')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-home-scroll">
        <div class="tb-hero">
          <div class="tb-hero-label">${t('Your Balance')}</div>
          <div class="tb-hero-amount">${fmt(state.balance)}</div>
          <div class="tb-hero-unit">${t.plural(state.balance, 'Giggle Coins', 'Giggle Coins')}</div>
        </div>
        <div class="tb-daily-msg">${msg}</div>
        <div class="tb-missions">
          <div class="tb-section-title">${t('Daily Missions')}</div>
          ${missions.map(m => {
            const def = pool.find(x => x.id === m.id);
            return `<div class="tb-mission ${m.done ? 'tb-mission-done' : ''}">
              <span>${m.done ? '✅' : '⬜'}</span> ${def ? def.text : m.id}
            </div>`;
          }).join('')}
        </div>
        <div class="tb-nav-grid">
          <button class="tb-nav-btn" onclick="window._tbGo('earn')"><span>💰</span>${t('Earn')}</button>
          <button class="tb-nav-btn" onclick="window._tbGo('save')"><span>🏺</span>${t('bank|Save')}</button>
          <button class="tb-nav-btn" onclick="window._tbGo('goals')"><span>🎯</span>${t('Goals')}</button>
          <button class="tb-nav-btn" onclick="window._tbGo('history')"><span>📜</span>${t('History')}</button>
          <button class="tb-nav-btn" onclick="window._tbGo('card')"><span>💳</span>${t('Card')}</button>
          <button class="tb-nav-btn" onclick="window._tbGo('give')"><span>🎁</span>${t('Give')}</button>
        </div>
        <div class="tb-badges-row">
          <div class="tb-section-title">${t('Badges')}</div>
          <div class="tb-badges-icons">
            ${earned.length ? earned.map(id => {
              const b = badges.find(x => x.id === id);
              return b ? `<span class="tb-badge-mini" title="${b.name}">${b.emoji}</span>` : '';
            }).join('') : `<span class="tb-muted">${t('No badges yet — keep going!')}</span>`}
          </div>
          <button class="tb-link" onclick="window._tbShowBadges()">${t('View All Badges')}</button>
        </div>
      </div>
    </div>`;
  }

  function renderEarn() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">💰 ${t('Earn Coins')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-earn-list">
          ${t.list('tinybank.tasks', EARN_TASKS).map(task => {
            const claimed = state.earnedToday.includes(task.id);
            return `<div class="tb-earn-item ${claimed ? 'tb-earn-claimed' : ''}">
              <div class="tb-earn-left">
                <span class="tb-earn-emoji">${task.emoji}</span>
                <div>
                  <div class="tb-earn-name">${task.name}</div>
                  <div class="tb-earn-coins">${gc('+' + task.coins)}</div>
                </div>
              </div>
              ${claimed
                ? '<span class="tb-earn-check">✅</span>'
                : `<button class="tb-btn tb-btn-sm" onclick="window._tbClaim('${task.id}')">${t('Claim')}</button>`}
            </div>`;
          }).join('')}
        </div>
        <div class="tb-raise-section">
          <div class="tb-section-title">${t('Feeling Brave?')}</div>
          <button class="tb-btn tb-btn-raise" onclick="window._tbRaise()">💼 ${t('Ask for a Raise')}</button>
          ${raiseResult ? `<div class="tb-raise-result">
            <div class="tb-raise-text">${raiseResult.text}</div>
            ${raiseResult.coins > 0 ? `<div class="tb-raise-coins">${gc('+' + raiseResult.coins)}</div>` : ''}
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderSave() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">🏺 ${t('bank|Save')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll">
        ${saveMsg ? `<div class="tb-save-msg">${saveMsg}</div>` : ''}
        <div class="tb-jars">
          ${t.list('tinybank.jars', JARS).map(j => {
            const bal = state.jars[j.id] || 0;
            return `<div class="tb-jar">
              <div class="tb-jar-top">
                <span class="tb-jar-emoji">${j.emoji}</span>
                <div>
                  <div class="tb-jar-name">${j.name}</div>
                  <div class="tb-jar-bal">${gc(fmt(bal))}</div>
                </div>
              </div>
              <div class="tb-jar-btns">
                <button class="tb-btn tb-btn-sm" onclick="window._tbDeposit('${j.id}',5)">+5</button>
                <button class="tb-btn tb-btn-sm" onclick="window._tbDeposit('${j.id}',20)">+20</button>
                <button class="tb-btn tb-btn-sm" onclick="window._tbDeposit('${j.id}',50)">+50</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderGoals() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">🎯 ${t('Goals')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-goals">
          ${t.list('tinybank.goals', GOALS).map(g => {
            const saved = getGoalSaved(state, g.id);
            const pct = Math.min(100, Math.round(saved / g.target * 100));
            const done = saved >= g.target;
            return `<div class="tb-goal ${done ? 'tb-goal-done' : ''}">
              <div class="tb-goal-top">
                <span class="tb-goal-emoji">${g.emoji}</span>
                <div class="tb-goal-info">
                  <div class="tb-goal-name">${g.name} ${done ? '✅' : ''}</div>
                  <div class="tb-goal-deadline">${g.deadline}</div>
                </div>
              </div>
              <div class="tb-progress">
                <div class="tb-progress-bar" style="width:${pct}%"></div>
              </div>
              <div class="tb-goal-bottom">
                <span>${t('{n} / {total} GC', { n: fmt(saved), total: fmt(g.target) })}</span>
                ${done ? `<span class="tb-goal-complete">${t('Complete!')}</span>` : `<button class="tb-btn tb-btn-sm" onclick="window._tbGoalAdd('${g.id}')">${gc('+10')}</button>`}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderHistory() {
    const thisMonth = new Date().toLocaleDateString(OS.locale(), { month: 'long' });
    const earned = state.history.filter(h => h.amount > 0).reduce((s, h) => s + h.amount, 0);
    const spent = state.history.filter(h => h.amount < 0).reduce((s, h) => s + Math.abs(h.amount), 0);

    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">📜 ${t('Drama Log')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-history-summary">
          <div class="tb-section-title">${t('{month} Summary', { month: thisMonth })}</div>
          <div class="tb-summary-row">
            <span class="tb-summary-in">↑ ${t('Earned: {n} GC', { n: fmt(earned) })}</span>
            <span class="tb-summary-out">↓ ${t('Spent: {n} GC', { n: fmt(spent) })}</span>
          </div>
        </div>
        <div class="tb-history-list">
          ${state.history.length ? state.history.map(h => `<div class="tb-history-item">
            <div class="tb-history-left">
              <span class="tb-history-emoji">${h.emoji}</span>
              <div>
                <div class="tb-history-text">${OS.esc(h.text)}</div>
                <div class="tb-history-date">${h.date}</div>
              </div>
            </div>
            <span class="tb-history-amount ${h.amount >= 0 ? 'tb-green' : 'tb-red'}">${gc((h.amount >= 0 ? '+' : '') + fmt(h.amount))}</span>
          </div>`).join('') : `<div class="tb-empty">${t('No transactions yet. Go earn some coins!')}</div>`}
        </div>
      </div>
    </div>`;
  }

  function renderCard() {
    const skins = t.list('tinybank.skins', CARD_SKINS);
    const skin = skins[state.cardSkin];
    let fraudOverlay = '';
    if (fraudAlert !== null) {
      if (fraudResult) {
        fraudOverlay = `<div class="tb-overlay" onclick="window._tbCloseFraud(event)">
          <div class="tb-overlay-box" onclick="event.stopPropagation()">
            <div class="tb-fraud-result-emoji">🔍</div>
            <div class="tb-fraud-result-text">${fraudResult}</div>
            <button class="tb-btn" onclick="window._tbCloseFraud(event)">${t('OK, Phew!')}</button>
          </div>
        </div>`;
      } else {
        fraudOverlay = `<div class="tb-overlay">
          <div class="tb-overlay-box" onclick="event.stopPropagation()">
            <div class="tb-fraud-alert-emoji">🚨</div>
            <div class="tb-fraud-alert-text">${fraudAlert}</div>
            <div class="tb-fraud-btns">
              ${t.list('tinybank.fraudReplies', FRAUD_RESPONSES).map((r, i) => `<button class="tb-btn tb-btn-sm" onclick="window._tbFraudRespond(${i})">${r.label}</button>`).join('')}
            </div>
          </div>
        </div>`;
      }
    }

    return `<div class="tb-wrap">
      ${fraudOverlay}
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">💳 ${t('TinyCard')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll tb-card-scroll">
        <div class="tb-card" style="background:${skin.gradient}">
          ${state.cardFrozen ? `<div class="tb-card-frozen">🧊 ${t('FROZEN')}</div>` : ''}
          <div class="tb-card-top">
            <span class="tb-card-logo">${t('TinyBank')}</span>
            <span class="tb-card-type">${skin.emoji} ${skin.name}</span>
          </div>
          <div class="tb-card-number">${t('1234 5678 LMAO 9999')}</div>
          <div class="tb-card-bottom">
            <div><div class="tb-card-label">${t('CARD HOLDER')}</div><div class="tb-card-value">${t('TINY BANKER')}</div></div>
            <div><div class="tb-card-label">${t('EXPIRES')}</div><div class="tb-card-value">99/99</div></div>
          </div>
        </div>
        <div class="tb-card-section">
          <div class="tb-section-title">${t('Card Skin')}</div>
          <div class="tb-skin-row">
            ${skins.map((s, i) => `<button class="tb-skin-btn ${state.cardSkin === i ? 'tb-skin-active' : ''}" onclick="window._tbSkin(${i})">${s.emoji} ${s.name}</button>`).join('')}
          </div>
        </div>
        <div class="tb-card-section">
          <div class="tb-section-title">${t('Security')}</div>
          <button class="tb-btn ${state.cardFrozen ? 'tb-btn-danger' : ''}" onclick="window._tbFreeze()">
            ${state.cardFrozen ? '🔥 ' + t('Unfreeze Card') : '🧊 ' + t('Freeze Card')}
          </button>
          <button class="tb-btn tb-btn-outline" onclick="window._tbTriggerFraud()" style="margin-top:8px">
            🚨 ${t('Test Fraud Alert')}
          </button>
        </div>
      </div>
    </div>`;
  }

  function renderGive() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← ${t('Back')}</button>
        <span class="tb-header-title">🎁 ${t('Kindness Corner')}</span>
        <span class="tb-bal-pill">${gc(fmt(state.balance))}</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-give-total">
          <span>💝 ${t('Lifetime Giving:')}</span>
          <strong>${gc(fmt(state.givenTotal))}</strong>
        </div>
        <div class="tb-give-list">
          ${t.list('tinybank.gifts', GIVE_CATEGORIES).map(c => `<div class="tb-give-card">
            <div class="tb-give-top">
              <span class="tb-give-emoji">${c.emoji}</span>
              <div>
                <div class="tb-give-name">${c.name}</div>
                <div class="tb-give-desc">${c.desc}</div>
              </div>
            </div>
            <div class="tb-give-btns">
              <button class="tb-btn tb-btn-sm" onclick="window._tbGive('${c.id}',5)">${t('Give {n} GC', { n: 5 })}</button>
              <button class="tb-btn tb-btn-sm" onclick="window._tbGive('${c.id}',10)">${t('Give {n} GC', { n: 10 })}</button>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ---- Actions (global handlers) ---- */
  window._tbGo = function(s) {
    screen = s;
    raiseResult = null;
    fraudAlert = null;
    fraudResult = null;
    if (s === 'card') {
      missionTracking._cardVisited = true;
      // 20% chance of random fraud alert
      if (Math.random() < 0.2) {
        fraudAlert = pick(t.list('tinybank.fraudAlerts', FRAUD_ALERTS));
      }
    }
    if (s === 'history') missionTracking._historyVisited = true;
    render();
  };

  window._tbClaim = function(taskId) {
    const task = t.list('tinybank.tasks', EARN_TASKS).find(x => x.id === taskId);
    if (!task || state.earnedToday.includes(taskId)) return;
    state.earnedToday.push(taskId);
    state.balance += task.coins;
    state.totalEarned += task.coins;
    addHistory(task.emoji, t('Earned: {name}', { name: task.name }), task.coins);
    missionTracking._earned = true;
    saveState();
    render();
  };

  window._tbRaise = function() {
    const resp = pick(t.list('tinybank.raises', RAISE_RESPONSES));
    raiseResult = resp;
    if (resp.coins > 0) {
      state.balance += resp.coins;
      state.totalEarned += resp.coins;
      addHistory('💼', t('Asked for a raise'), resp.coins);
    } else {
      addHistory('💼', t('Asked for a raise... denied'), 0);
    }
    missionTracking._raisedAsked = true;
    saveState();
    render();
  };

  window._tbDeposit = function(jarId, amount) {
    if (state.balance < amount) {
      saveMsg = t('Not enough Giggle Coins! Go earn some more!');
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    state.balance -= amount;
    state.jars[jarId] = (state.jars[jarId] || 0) + amount;
    const jar = t.list('tinybank.jars', JARS).find(j => j.id === jarId);
    addHistory(jar.emoji, t('Saved to {name}', { name: jar.name }), -amount);
    saveMsg = pick(t.list('tinybank.saved', SAVE_CONFIRMATIONS));
    missionTracking._saved = true;
    saveState();
    render();
    clearTimeout(saveMsgTimer);
    saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2500);
  };

  window._tbGoalAdd = function(goalId) {
    if (state.balance < 10) {
      saveMsg = t('Not enough Giggle Coins!');
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    const goal = state.goals.find(g => g.id === goalId);
    const def = t.list('tinybank.goals', GOALS).find(g => g.id === goalId);
    if (!goal || !def || goal.saved >= def.target) return;
    state.balance -= 10;
    goal.saved = Math.min(goal.saved + 10, def.target);
    addHistory(def.emoji, t('Saved toward: {name}', { name: def.name }), -10);
    missionTracking._goaled = true;
    saveState();
    render();
  };

  window._tbSkin = function(idx) {
    state.cardSkin = idx;
    saveState();
    render();
  };

  window._tbFreeze = function() {
    state.cardFrozen = !state.cardFrozen;
    saveState();
    render();
  };

  window._tbTriggerFraud = function() {
    fraudAlert = pick(t.list('tinybank.fraudAlerts', FRAUD_ALERTS));
    fraudResult = null;
    render();
  };

  window._tbFraudRespond = function(idx) {
    fraudResult = t.list('tinybank.fraudReplies', FRAUD_RESPONSES)[idx].result;
    state.fraudsHandled++;
    addHistory('🔍', t('Handled a fraud alert'), 0);
    saveState();
    render();
  };

  window._tbCloseFraud = function(e) {
    e.stopPropagation();
    fraudAlert = null;
    fraudResult = null;
    render();
  };

  window._tbGive = function(catId, amount) {
    if (state.balance < amount) {
      saveMsg = t('Not enough coins to give! Earn some first!');
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    const cat = t.list('tinybank.gifts', GIVE_CATEGORIES).find(c => c.id === catId);
    state.balance -= amount;
    state.givenTotal += amount;
    addHistory(cat.emoji, t('Donated to {name}', { name: cat.name }), -amount);
    missionTracking._given = true;
    saveState();
    render();
  };

  window._tbShowBadges = function() {
    showBadges = true;
    missionTracking._badgesViewed = true;
    render();
  };

  window._tbCloseBadges = function(e) {
    e.stopPropagation();
    showBadges = false;
    render();
  };

  window._tbExternalDeposit = function() {
    if (winId) { loadState(); render(); }
  };

  /* ---- App Registration ---- */
  OS.registerApp('tinybank', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'tinybank',
        title: t('TinyBank'),
        icon: '🏦',
        width: 420,
        height: 540,
        content: '<div class="tb-wrap"><div class="tb-loading">' + t('Loading TinyBank...') + '</div></div>',
      };
    },
    onOpen(id) {
      winId = id;
      screen = 'home';
      raiseResult = null;
      saveMsg = null;
      fraudAlert = null;
      fraudResult = null;
      showBadges = false;
      missionTracking = {};
      loadState();
      render();
    },
    onClose() {
      winId = null;
      clearTimeout(saveMsgTimer);
    },
  });
})();
