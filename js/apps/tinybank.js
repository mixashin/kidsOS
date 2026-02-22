/* ===== TinyBank — Parody Banking App for Kids ===== */
(() => {
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
    { text: "The board of directors (Mom) says: 'Lol, no.'", coins: 0 },
    { text: "Your request has been forwarded to the Department of Maybe. They're on lunch.", coins: 0 },
    { text: "Congratulations! You've been awarded 5 Sympathy Coins.", coins: 5 },
    { text: "The CEO (Dad) reviewed your case. Here's 10 coins and a pat on the head.", coins: 10 },
    { text: "JACKPOT! Grandma heard about your raise request. Here's 25 coins!", coins: 25 },
    { text: "HR says you get 3 coins and a participation trophy.", coins: 3 },
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
    { label: 'It was me 😅', result: 'Transaction approved. The rubber ducks are on their way.' },
    { label: 'Blame the cat 🐱', result: 'We\'ve flagged the cat as a suspect. Case closed.' },
    { label: 'Call the Bank 📞', result: 'You\'re already IN the bank. But okay, we\'ll investigate.' },
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
  function fmt(n) { return n.toLocaleString(); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function dateStr() {
    const d = new Date();
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    const msg = DAILY_MESSAGES[Math.floor(Date.now() / 86400000) % DAILY_MESSAGES.length];
    const missions = state.dailyMissions ? state.dailyMissions.missions : [];
    const earned = state.badges || [];

    let badgeOverlay = '';
    if (showBadges) {
      badgeOverlay = `<div class="tb-overlay" onclick="window._tbCloseBadges(event)">
        <div class="tb-overlay-box" onclick="event.stopPropagation()">
          <div class="tb-overlay-title">🏆 All Badges</div>
          <div class="tb-badge-grid">
            ${BADGES_DEF.map(b => {
              const unlocked = earned.includes(b.id);
              return `<div class="tb-badge-card ${unlocked ? 'tb-badge-unlocked' : 'tb-badge-locked'}">
                <div class="tb-badge-icon">${unlocked ? b.emoji : '🔒'}</div>
                <div class="tb-badge-name">${b.name}</div>
                <div class="tb-badge-desc">${b.desc}</div>
              </div>`;
            }).join('')}
          </div>
          <button class="tb-btn tb-btn-sm" onclick="window._tbCloseBadges(event)">Close</button>
        </div>
      </div>`;
    }

    return `<div class="tb-wrap">
      ${badgeOverlay}
      <div class="tb-header">
        <span class="tb-logo">🏦 TinyBank</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-home-scroll">
        <div class="tb-hero">
          <div class="tb-hero-label">Your Balance</div>
          <div class="tb-hero-amount">${fmt(state.balance)}</div>
          <div class="tb-hero-unit">Giggle Coins</div>
        </div>
        <div class="tb-daily-msg">${msg}</div>
        <div class="tb-missions">
          <div class="tb-section-title">Daily Missions</div>
          ${missions.map(m => {
            const def = DAILY_MISSIONS_POOL.find(x => x.id === m.id);
            return `<div class="tb-mission ${m.done ? 'tb-mission-done' : ''}">
              <span>${m.done ? '✅' : '⬜'}</span> ${def ? def.text : m.id}
            </div>`;
          }).join('')}
        </div>
        <div class="tb-nav-grid">
          <button class="tb-nav-btn" onclick="window._tbGo('earn')"><span>💰</span>Earn</button>
          <button class="tb-nav-btn" onclick="window._tbGo('save')"><span>🏺</span>Save</button>
          <button class="tb-nav-btn" onclick="window._tbGo('goals')"><span>🎯</span>Goals</button>
          <button class="tb-nav-btn" onclick="window._tbGo('history')"><span>📜</span>History</button>
          <button class="tb-nav-btn" onclick="window._tbGo('card')"><span>💳</span>Card</button>
          <button class="tb-nav-btn" onclick="window._tbGo('give')"><span>🎁</span>Give</button>
        </div>
        <div class="tb-badges-row">
          <div class="tb-section-title">Badges</div>
          <div class="tb-badges-icons">
            ${earned.length ? earned.map(id => {
              const b = BADGES_DEF.find(x => x.id === id);
              return b ? `<span class="tb-badge-mini" title="${b.name}">${b.emoji}</span>` : '';
            }).join('') : '<span class="tb-muted">No badges yet — keep going!</span>'}
          </div>
          <button class="tb-link" onclick="window._tbShowBadges()">View All Badges</button>
        </div>
      </div>
    </div>`;
  }

  function renderEarn() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">💰 Earn Coins</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-earn-list">
          ${EARN_TASKS.map(t => {
            const claimed = state.earnedToday.includes(t.id);
            return `<div class="tb-earn-item ${claimed ? 'tb-earn-claimed' : ''}">
              <div class="tb-earn-left">
                <span class="tb-earn-emoji">${t.emoji}</span>
                <div>
                  <div class="tb-earn-name">${t.name}</div>
                  <div class="tb-earn-coins">+${t.coins} GC</div>
                </div>
              </div>
              ${claimed
                ? '<span class="tb-earn-check">✅</span>'
                : `<button class="tb-btn tb-btn-sm" onclick="window._tbClaim('${t.id}')">Claim</button>`}
            </div>`;
          }).join('')}
        </div>
        <div class="tb-raise-section">
          <div class="tb-section-title">Feeling Brave?</div>
          <button class="tb-btn tb-btn-raise" onclick="window._tbRaise()">💼 Ask for a Raise</button>
          ${raiseResult ? `<div class="tb-raise-result">
            <div class="tb-raise-text">${raiseResult.text}</div>
            ${raiseResult.coins > 0 ? `<div class="tb-raise-coins">+${raiseResult.coins} GC</div>` : ''}
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderSave() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">🏺 Save</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll">
        ${saveMsg ? `<div class="tb-save-msg">${saveMsg}</div>` : ''}
        <div class="tb-jars">
          ${JARS.map(j => {
            const bal = state.jars[j.id] || 0;
            return `<div class="tb-jar">
              <div class="tb-jar-top">
                <span class="tb-jar-emoji">${j.emoji}</span>
                <div>
                  <div class="tb-jar-name">${j.name}</div>
                  <div class="tb-jar-bal">${fmt(bal)} GC</div>
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
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">🎯 Goals</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-goals">
          ${GOALS.map(g => {
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
                <span>${fmt(saved)} / ${fmt(g.target)} GC</span>
                ${done ? '<span class="tb-goal-complete">Complete!</span>' : `<button class="tb-btn tb-btn-sm" onclick="window._tbGoalAdd('${g.id}')">+10 GC</button>`}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderHistory() {
    const thisMonth = new Date().toLocaleDateString(undefined, { month: 'long' });
    const earned = state.history.filter(h => h.amount > 0).reduce((s, h) => s + h.amount, 0);
    const spent = state.history.filter(h => h.amount < 0).reduce((s, h) => s + Math.abs(h.amount), 0);

    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">📜 Drama Log</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-history-summary">
          <div class="tb-section-title">${thisMonth} Summary</div>
          <div class="tb-summary-row">
            <span class="tb-summary-in">↑ Earned: ${fmt(earned)} GC</span>
            <span class="tb-summary-out">↓ Spent: ${fmt(spent)} GC</span>
          </div>
        </div>
        <div class="tb-history-list">
          ${state.history.length ? state.history.map(h => `<div class="tb-history-item">
            <div class="tb-history-left">
              <span class="tb-history-emoji">${h.emoji}</span>
              <div>
                <div class="tb-history-text">${h.text}</div>
                <div class="tb-history-date">${h.date}</div>
              </div>
            </div>
            <span class="tb-history-amount ${h.amount >= 0 ? 'tb-green' : 'tb-red'}">${h.amount >= 0 ? '+' : ''}${fmt(h.amount)} GC</span>
          </div>`).join('') : '<div class="tb-empty">No transactions yet. Go earn some coins!</div>'}
        </div>
      </div>
    </div>`;
  }

  function renderCard() {
    const skin = CARD_SKINS[state.cardSkin];
    let fraudOverlay = '';
    if (fraudAlert !== null) {
      if (fraudResult) {
        fraudOverlay = `<div class="tb-overlay" onclick="window._tbCloseFraud(event)">
          <div class="tb-overlay-box" onclick="event.stopPropagation()">
            <div class="tb-fraud-result-emoji">🔍</div>
            <div class="tb-fraud-result-text">${fraudResult}</div>
            <button class="tb-btn" onclick="window._tbCloseFraud(event)">OK, Phew!</button>
          </div>
        </div>`;
      } else {
        fraudOverlay = `<div class="tb-overlay">
          <div class="tb-overlay-box" onclick="event.stopPropagation()">
            <div class="tb-fraud-alert-emoji">🚨</div>
            <div class="tb-fraud-alert-text">${FRAUD_ALERTS[fraudAlert]}</div>
            <div class="tb-fraud-btns">
              ${FRAUD_RESPONSES.map((r, i) => `<button class="tb-btn tb-btn-sm" onclick="window._tbFraudRespond(${i})">${r.label}</button>`).join('')}
            </div>
          </div>
        </div>`;
      }
    }

    return `<div class="tb-wrap">
      ${fraudOverlay}
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">💳 TinyCard</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll tb-card-scroll">
        <div class="tb-card" style="background:${skin.gradient}">
          ${state.cardFrozen ? '<div class="tb-card-frozen">🧊 FROZEN</div>' : ''}
          <div class="tb-card-top">
            <span class="tb-card-logo">TinyBank</span>
            <span class="tb-card-type">${skin.emoji} ${skin.name}</span>
          </div>
          <div class="tb-card-number">1234 5678 LMAO 9999</div>
          <div class="tb-card-bottom">
            <div><div class="tb-card-label">CARD HOLDER</div><div class="tb-card-value">TINY BANKER</div></div>
            <div><div class="tb-card-label">EXPIRES</div><div class="tb-card-value">99/99</div></div>
          </div>
        </div>
        <div class="tb-card-section">
          <div class="tb-section-title">Card Skin</div>
          <div class="tb-skin-row">
            ${CARD_SKINS.map((s, i) => `<button class="tb-skin-btn ${state.cardSkin === i ? 'tb-skin-active' : ''}" onclick="window._tbSkin(${i})">${s.emoji} ${s.name}</button>`).join('')}
          </div>
        </div>
        <div class="tb-card-section">
          <div class="tb-section-title">Security</div>
          <button class="tb-btn ${state.cardFrozen ? 'tb-btn-danger' : ''}" onclick="window._tbFreeze()">
            ${state.cardFrozen ? '🔥 Unfreeze Card' : '🧊 Freeze Card'}
          </button>
          <button class="tb-btn tb-btn-outline" onclick="window._tbTriggerFraud()" style="margin-top:8px">
            🚨 Test Fraud Alert
          </button>
        </div>
      </div>
    </div>`;
  }

  function renderGive() {
    return `<div class="tb-wrap">
      <div class="tb-header">
        <button class="tb-back" onclick="window._tbGo('home')">← Back</button>
        <span class="tb-header-title">🎁 Kindness Corner</span>
        <span class="tb-bal-pill">${fmt(state.balance)} GC</span>
      </div>
      <div class="tb-scroll">
        <div class="tb-give-total">
          <span>💝 Lifetime Giving:</span>
          <strong>${fmt(state.givenTotal)} GC</strong>
        </div>
        <div class="tb-give-list">
          ${GIVE_CATEGORIES.map(c => `<div class="tb-give-card">
            <div class="tb-give-top">
              <span class="tb-give-emoji">${c.emoji}</span>
              <div>
                <div class="tb-give-name">${c.name}</div>
                <div class="tb-give-desc">${c.desc}</div>
              </div>
            </div>
            <div class="tb-give-btns">
              <button class="tb-btn tb-btn-sm" onclick="window._tbGive('${c.id}',5)">Give 5 GC</button>
              <button class="tb-btn tb-btn-sm" onclick="window._tbGive('${c.id}',10)">Give 10 GC</button>
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
        fraudAlert = Math.floor(Math.random() * FRAUD_ALERTS.length);
      }
    }
    if (s === 'history') missionTracking._historyVisited = true;
    render();
  };

  window._tbClaim = function(taskId) {
    const task = EARN_TASKS.find(t => t.id === taskId);
    if (!task || state.earnedToday.includes(taskId)) return;
    state.earnedToday.push(taskId);
    state.balance += task.coins;
    state.totalEarned += task.coins;
    addHistory(task.emoji, `Earned: ${task.name}`, task.coins);
    missionTracking._earned = true;
    saveState();
    render();
  };

  window._tbRaise = function() {
    const resp = pick(RAISE_RESPONSES);
    raiseResult = resp;
    if (resp.coins > 0) {
      state.balance += resp.coins;
      state.totalEarned += resp.coins;
      addHistory('💼', 'Asked for a raise', resp.coins);
    } else {
      addHistory('💼', 'Asked for a raise... denied', 0);
    }
    missionTracking._raisedAsked = true;
    saveState();
    render();
  };

  window._tbDeposit = function(jarId, amount) {
    if (state.balance < amount) {
      saveMsg = "Not enough Giggle Coins! Go earn some more!";
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    state.balance -= amount;
    state.jars[jarId] = (state.jars[jarId] || 0) + amount;
    const jar = JARS.find(j => j.id === jarId);
    addHistory(jar.emoji, `Saved to ${jar.name}`, -amount);
    saveMsg = pick(SAVE_CONFIRMATIONS);
    missionTracking._saved = true;
    saveState();
    render();
    clearTimeout(saveMsgTimer);
    saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2500);
  };

  window._tbGoalAdd = function(goalId) {
    if (state.balance < 10) {
      saveMsg = "Not enough Giggle Coins!";
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    const goal = state.goals.find(g => g.id === goalId);
    const def = GOALS.find(g => g.id === goalId);
    if (!goal || !def || goal.saved >= def.target) return;
    state.balance -= 10;
    goal.saved = Math.min(goal.saved + 10, def.target);
    addHistory(def.emoji, `Saved toward: ${def.name}`, -10);
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
    fraudAlert = Math.floor(Math.random() * FRAUD_ALERTS.length);
    fraudResult = null;
    render();
  };

  window._tbFraudRespond = function(idx) {
    fraudResult = FRAUD_RESPONSES[idx].result;
    state.fraudsHandled++;
    addHistory('🔍', 'Handled a fraud alert', 0);
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
      saveMsg = "Not enough coins to give! Earn some first!";
      render();
      clearTimeout(saveMsgTimer);
      saveMsgTimer = setTimeout(() => { saveMsg = null; render(); }, 2000);
      return;
    }
    const cat = GIVE_CATEGORIES.find(c => c.id === catId);
    state.balance -= amount;
    state.givenTotal += amount;
    addHistory(cat.emoji, `Donated to ${cat.name}`, -amount);
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

  /* ---- App Registration ---- */
  OS.registerApp('tinybank', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'tinybank',
        title: 'TinyBank',
        icon: '🏦',
        width: 420,
        height: 540,
        content: '<div class="tb-wrap"><div class="tb-loading">Loading TinyBank...</div></div>',
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
