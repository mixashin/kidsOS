/* ===== SnackDash — Fake Food Delivery App ===== */
(() => {
  /* ---- Data Constants ---- */
  const RESTAURANTS = [
    {
      id: 'crunch', name: "Captain Crunch's Dockside Diner", emoji: '\u{1F3F4}\u200D\u2620\uFE0F',
      tags: ['Pirate Grub', 'Crunchy'], rating: 4.7, time: '20-30 min',
      items: [
        { emoji: '\u{1F4A3}', name: 'Crunchy Cannonball', desc: 'Deep-fried ball of everything. EVERYTHING.', price: 12, addOns: ['Extra Crunch', 'Gunpowder Sauce'] },
        { emoji: '\u{1F9AA}', name: 'Barnacle Nuggets', desc: 'Suspiciously chewy nuggets from the ocean floor.', price: 8, addOns: ['Seaweed Dip', 'Pirate Ketchup'] },
        { emoji: '\u{1F35F}', name: 'Walk The Plank Fries', desc: 'Long fries that dangle over the edge of the plate.', price: 7, addOns: ['Treasure Cheese', 'Salt Storm'] },
        { emoji: '\u{1F368}', name: 'Shipwreck Sundae', desc: 'Ice cream buried under candy debris.', price: 10, addOns: ['Gummy Sharks', 'Whirlpool Swirl'] },
      ],
    },
    {
      id: 'noodle', name: 'The Noodle Doodle', emoji: '\u{1F35C}',
      tags: ['Noodley', 'Slurpy'], rating: 4.5, time: '15-25 min',
      items: [
        { emoji: '\u{1F32A}\uFE0F', name: 'Spaghetti Tornado', desc: 'Pasta that spins in the bowl. Wear goggles.', price: 11, addOns: ['Extra Spin', 'Cheese Cloud'] },
        { emoji: '\u{1F95F}', name: 'Doodle Dumplings', desc: 'Each dumpling has a silly face drawn on it.', price: 9, addOns: ['Giggly Sauce', 'Doodle Extras'] },
        { emoji: '\u{1F9D4}', name: 'Noodle Beard Bowl', desc: 'So many noodles you can wear them as a beard.', price: 13, addOns: ['Beard Extensions', 'Broth Boost'] },
      ],
    },
    {
      id: 'pancake', name: 'Planet Pancake', emoji: '\u{1F95E}',
      tags: ['Breakfast', 'Space'], rating: 4.8, time: '10-20 min',
      items: [
        { emoji: '\u{1FA90}', name: 'Saturn Ring Pancakes', desc: 'Pancakes with a ring of syrup orbiting them.', price: 10, addOns: ['Stardust Sprinkles', 'Maple Meteor'] },
        { emoji: '\u{1F47D}', name: 'Alien Waffle', desc: 'Green waffle with antenna-shaped fruit.', price: 9, addOns: ['UFO Syrup', 'Moon Butter'] },
        { emoji: '\u{1F30C}', name: 'Milky Way Milkshake', desc: 'So thick you need a rocket-powered straw.', price: 8, addOns: ['Asteroid Chunks', 'Galactic Whip'] },
        { emoji: '\u{1F573}\uFE0F', name: 'Black Hole Donut', desc: 'Everything near it gets sucked in. Especially fingers.', price: 7, addOns: ['Gravity Glaze', 'Cosmic Crumbs'] },
      ],
    },
    {
      id: 'booger', name: 'Burgers & Boogers', emoji: '\u{1F354}',
      tags: ['Gross', 'Yummy'], rating: 4.2, time: '15-20 min',
      items: [
        { emoji: '\u{1F922}', name: 'The Booger Burger', desc: "Green cheese that's totally NOT boogers. Probably.", price: 11, addOns: ['Snot Sauce', 'Slime Pickles'] },
        { emoji: '\u{1F964}', name: 'Snot Shake', desc: 'Thick, green, and drips everywhere. Delicious!', price: 7, addOns: ['Bogey Bits', 'Goo Swirl'] },
        { emoji: '\u{1F35F}', name: 'Earwax Fries', desc: 'Yellow and waxy. Crunchy on the outside. Do not ask.', price: 6, addOns: ['Wax Dip', 'Crust Crumble'] },
      ],
    },
    {
      id: 'broccoli', name: 'The Sneaky Broccoli', emoji: '\u{1F966}',
      tags: ['Healthy', 'Sneaky'], rating: 4.6, time: '10-15 min',
      items: [
        { emoji: '\u{1F332}', name: 'Broccoli Disguised As A Tree', desc: 'You WILL eat a tree and you WILL like it.', price: 8, addOns: ['Ranch Cloud', 'Cheese Camo'] },
        { emoji: '\u{1F370}', name: 'Invisible Carrot Cake', desc: "It's there. You just can't see the carrots. Trust us.", price: 9, addOns: ['Stealth Frosting', 'Ninja Sprinkles'] },
        { emoji: '\u{1F966}', name: 'Spinach Surprise Smoothie', desc: "Surprise! It's spinach. You already drank it.", price: 7, addOns: ['Berry Disguise', 'Vitamin Sneak'] },
      ],
    },
    {
      id: 'waffle', name: 'Waffle Wizard Academy', emoji: '\u{1F9D9}',
      tags: ['Magical', 'Breakfast'], rating: 4.9, time: '20-30 min',
      items: [
        { emoji: '\u{1FA84}', name: "Wizard's Staff Waffle Stick", desc: 'Wave it around before eating. Spells not guaranteed.', price: 10, addOns: ['Enchanted Syrup', 'Sparkle Dust'] },
        { emoji: '\u{1F9EA}', name: 'Potion Pancake Platter', desc: 'Each pancake is a different color potion flavor.', price: 12, addOns: ['Mana Butter', 'XP Berries'] },
        { emoji: '\u{2728}', name: 'Enchanted French Toast', desc: 'Glows faintly. May grant wishes. (Probably not.)', price: 11, addOns: ['Golden Syrup', 'Fairy Sugar'] },
      ],
    },
    {
      id: 'sushi', name: 'Sushi No Slushy', emoji: '\u{1F363}',
      tags: ['Cold', 'Fishy'], rating: 4.4, time: '15-25 min',
      items: [
        { emoji: '\u{1F3A2}', name: 'Sushi Roll-ercoaster', desc: 'A looping sushi roll that does a barrel roll on the plate.', price: 13, addOns: ['Wasabi Boost', 'Ginger Loop'] },
        { emoji: '\u{1F9CA}', name: 'Brain Freeze Slushy', desc: 'So cold your brain files a complaint.', price: 6, addOns: ['Extra Freeze', 'Neon Flavor'] },
        { emoji: '\u{1F419}', name: 'Octopus Hug Roll', desc: '8 arms of flavor wrapped around rice. Group hug!', price: 11, addOns: ['Tentacle Sauce', 'Seaweed Scarf'] },
      ],
    },
    {
      id: 'taco', name: "Taco 'Bout It", emoji: '\u{1F32E}',
      tags: ['Spicy', 'Chatty'], rating: 4.7, time: '10-20 min',
      items: [
        { emoji: '\u{1F4AC}', name: 'Chatty Chalupa', desc: "Won't stop talking. Even while you eat it.", price: 9, addOns: ['Salsa Shout', 'Cheese Whisper'] },
        { emoji: '\u{1F6CF}\uFE0F', name: 'Burrito Blanket', desc: "So big you can wrap yourself in it. And you should.", price: 12, addOns: ['Guac Pillow', 'Bean Stuffing'] },
        { emoji: '\u{1F9C0}', name: 'Nacho Average Nachos', desc: 'Above average. Way above. Sky-high nacho tower.', price: 10, addOns: ['Cheese Waterfall', 'Jalape\u00F1o Rain'] },
        { emoji: '\u{1F4DC}', name: 'Quesadilla Of Truth', desc: 'Answers one question per bite. Ask wisely.', price: 11, addOns: ['Truth Sauce', 'Wisdom Guac'] },
      ],
    },
  ];

  const CURRENCIES = [
    { name: 'Giggle Coins', emoji: '\u{1F602}' },
    { name: 'Sticker Bucks', emoji: '\u2B50' },
    { name: 'Tooth Fairy Credits', emoji: '\u{1F9DA}' },
    { name: 'Laundry Tokens', emoji: '\u{1F9E6}' },
    { name: 'Mom\'s "Maybe Later" Card', emoji: '\u{1F4B3}' },
  ];

  const DRIVERS = [
    { name: 'Scooter Penguin', emoji: '\u{1F427}', vehicle: 'a tiny scooter' },
    { name: 'Rollerblade Robot', emoji: '\u{1F916}', vehicle: 'rocket rollerblades' },
    { name: 'Sleepy Sloth', emoji: '\u{1F9A5}', vehicle: 'a hammock on wheels' },
    { name: 'Rocket Turtle', emoji: '\u{1F422}', vehicle: 'a jet-powered shell' },
    { name: 'Unicycle Unicorn', emoji: '\u{1F984}', vehicle: 'a sparkly unicycle' },
  ];

  const WAYPOINTS = [
    { emoji: '\u{1F373}', place: 'Restaurant Kitchen', msg: 'Chef is flipping your food in the air...' },
    { emoji: '\u{1F6CB}\uFE0F', place: 'Couch Canyon', msg: 'Navigating between giant couch cushions...' },
    { emoji: '\u{1F9F1}', place: 'Lego Swamp', msg: 'OW! Stepped on a Lego! Driver needs a moment...' },
    { emoji: '\u{1F408}', place: 'Cat Crossing', msg: '12 cats blocking the road. Negotiations underway...' },
    { emoji: '\u{1F6CF}\uFE0F', place: 'Pillow Fort Station', msg: 'Passing through the great pillow fortress...' },
    { emoji: '\u{1F9E6}', place: 'Sock Mountain', msg: 'Climbing the legendary mountain of lost socks...' },
    { emoji: '\u{1F3E0}', place: 'Your Door', msg: 'Arrived! Quick, open the door!' },
  ];

  const BADGES = [
    { id: 'nugget', name: 'Chief Nugget Officer', emoji: '\u{1F357}', condition: (s) => s.totalOrders >= 1 },
    { id: 'pizza', name: 'Pizza Whisperer', emoji: '\u{1F355}', condition: (s) => s.totalOrders >= 3 },
    { id: 'wizard', name: 'Waffle Wizard', emoji: '\u{1F9D9}', condition: (s) => s.uniqueRestaurants >= 3 },
    { id: 'captain', name: 'Captain of Crunch', emoji: '\u{1F3F4}\u200D\u2620\uFE0F', condition: (s) => s.uniqueRestaurants >= 5 },
    { id: 'broccoli', name: 'Brave Broccoli Eater', emoji: '\u{1F966}', condition: (s) => s.orderedFrom.includes('broccoli') },
    { id: 'spender', name: 'Big Spender', emoji: '\u{1F4B0}', condition: (s) => s.snackPoints >= 500 },
  ];

  const BANNERS = [
    '\u{1F525} HOT: Someone ordered 47 burritos. Legend.',
    '\u{1F4E2} NEW: Free invisible salad with every order!',
    '\u{26A0}\uFE0F WARNING: Noodle Beard Bowl may cause actual beards.',
    '\u{1F3C6} RECORD: Fastest delivery — 0.3 seconds (driver was already there).',
    '\u{1F9CA} ALERT: Brain Freeze Slushy now 200% colder!',
    '\u{1F47D} BREAKING: Alien Waffle confirmed to be from actual aliens.',
    '\u{1F9E6} LOST & FOUND: 847 socks recovered from Sock Mountain today.',
    '\u{1F370} MYSTERY: Invisible Carrot Cake still missing. Or is it?',
  ];

  const PAYMENT_MSGS = [
    'Counting your giggle coins...',
    'Asking mom for permission...',
    'Checking under couch cushions for change...',
    'Converting belly laughs to currency...',
    'Bribing the payment hamster...',
    'Shaking the piggy bank really hard...',
  ];

  const DAILY_DEALS = [
    { emoji: '\u{1F355}', name: 'Mega Ultra Pizza Slice', price: 3, original: 15, tag: '80% OFF' },
    { emoji: '\u{1F366}', name: 'Triple Scoop Chaos Cone', price: 2, original: 10, tag: 'STEAL' },
    { emoji: '\u{1F969}', name: 'T-Rex Steak (toy sized)', price: 5, original: 25, tag: 'DEAL OF DOOM' },
    { emoji: '\u{1F382}', name: 'Birthday Cake (any day!)', price: 4, original: 20, tag: 'PARTY TIME' },
  ];

  const MOODS = [
    { emoji: '\u{1F60B}', label: 'Kinda hungry' },
    { emoji: '\u{1F924}', label: 'STARVING' },
    { emoji: '\u{1F92F}', label: 'FEED ME NOW' },
  ];

  /* ---- Helpers ---- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function $(sel) { return body ? body.querySelector(sel) : null; }

  /* ---- State ---- */
  let winId = null;
  let body = null;
  let screen = 'home';
  let cart = [];
  let selectedRestaurant = null;
  let selectedCurrency = 0;
  let tipLevel = 3;
  let mood = 1;
  let activeOrder = null;
  let trackingInterval = null;
  let payTimeout = null;
  let bannerIdx = 0;
  let bannerInterval = null;
  let honkAnim = false;

  // Persisted state
  let persisted = {
    snackPoints: 0,
    badges: [],
    orderHistory: [],
    totalOrders: 0,
    orderedFrom: [],
  };

  function loadState() {
    try {
      const raw = localStorage.getItem('kidsOS_snackdash');
      if (raw) persisted = { ...persisted, ...JSON.parse(raw) };
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem('kidsOS_snackdash', JSON.stringify(persisted));
  }

  /* ---- Badge Checking ---- */
  function checkBadges() {
    const stats = {
      ...persisted,
      uniqueRestaurants: [...new Set(persisted.orderedFrom)].length,
    };
    const newBadges = [];
    for (const b of BADGES) {
      if (!persisted.badges.includes(b.id) && b.condition(stats)) {
        persisted.badges.push(b.id);
        newBadges.push(b);
      }
    }
    return newBadges;
  }

  /* ---- Cart Helpers ---- */
  function cartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function cartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function addToCart(restId, itemIdx, addOns) {
    const rest = RESTAURANTS.find(r => r.id === restId);
    if (!rest) return;
    const item = rest.items[itemIdx];
    if (!item) return;
    const key = restId + '_' + itemIdx + '_' + addOns.sort().join(',');
    const existing = cart.find(c => c.key === key);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        key, restId, restName: rest.name, restEmoji: rest.emoji,
        name: item.name, emoji: item.emoji, price: item.price,
        addOns: [...addOns], qty: 1,
      });
    }
    render();
  }

  /* ---- Screen Renderers ---- */
  function render() {
    if (!body) return;
    switch (screen) {
      case 'home': renderHome(); break;
      case 'restaurants': renderRestaurants(); break;
      case 'menu': renderMenu(); break;
      case 'cart': renderCart(); break;
      case 'paying': renderPaying(); break;
      case 'tracking': renderTracking(); break;
      case 'delivered': renderDelivered(); break;
      case 'vault': renderVault(); break;
    }
  }

  function renderHome() {
    const deal = DAILY_DEALS[new Date().getDate() % DAILY_DEALS.length];
    const earnedBadges = BADGES.filter(b => persisted.badges.includes(b.id));
    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <span class="sd-logo">\u{1F6F5} SnackDash</span>
          <span class="sd-points">\u2B50 ${persisted.snackPoints} pts</span>
        </div>
        <div class="sd-content">
          <div class="sd-mood-section">
            <div class="sd-mood-label">How hungry are you?</div>
            <div class="sd-mood-row">
              ${MOODS.map((m, i) => `<button class="sd-mood-btn ${mood === i ? 'sd-mood-active' : ''}" onclick="window._sdMood(${i})">${m.emoji}<br><small>${m.label}</small></button>`).join('')}
            </div>
          </div>
          <button class="sd-big-btn" onclick="window._sdGo('restaurants')">\u{1F354} Order Snacks</button>
          ${activeOrder ? '<button class="sd-big-btn sd-track-btn" onclick="window._sdGo(\'tracking\')">\u{1F4E6} Track Delivery</button>' : ''}
          <button class="sd-big-btn sd-vault-btn" onclick="window._sdGo('vault')">\u{1F3C6} Snack Vault</button>
          <div class="sd-banner" id="sd-banner">${BANNERS[bannerIdx]}</div>
          <div class="sd-deal" onclick="window._sdGo('restaurants')">
            <div class="sd-deal-tag">${deal.tag}</div>
            <div class="sd-deal-body">
              <span class="sd-deal-emoji">${deal.emoji}</span>
              <div class="sd-deal-info">
                <div class="sd-deal-name">${deal.name}</div>
                <div class="sd-deal-price"><s>${deal.original}</s> \u2192 ${deal.price} coins!</div>
              </div>
            </div>
          </div>
          ${earnedBadges.length > 0 ? `<div class="sd-badges-row">${earnedBadges.map(b => `<span class="sd-badge" title="${b.name}">${b.emoji}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
  }

  function renderRestaurants() {
    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <button class="sd-back" onclick="window._sdGo('home')">\u2190</button>
          <span class="sd-header-title">Restaurants</span>
          ${cartCount() > 0 ? `<button class="sd-cart-badge" onclick="window._sdGo('cart')">\u{1F6D2} ${cartCount()}</button>` : '<span></span>'}
        </div>
        <div class="sd-content">
          ${RESTAURANTS.map(r => `
            <div class="sd-restaurant-card" onclick="window._sdOpenMenu('${r.id}')">
              <span class="sd-rest-emoji">${r.emoji}</span>
              <div class="sd-rest-info">
                <div class="sd-rest-name">${r.name}</div>
                <div class="sd-rest-meta">
                  ${r.tags.map(t => `<span class="sd-tag">${t}</span>`).join('')}
                </div>
                <div class="sd-rest-bottom">
                  <span class="sd-rest-rating">\u2B50 ${r.rating}</span>
                  <span class="sd-rest-time">\u{1F552} ${r.time}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderMenu() {
    const rest = RESTAURANTS.find(r => r.id === selectedRestaurant);
    if (!rest) { screen = 'restaurants'; render(); return; }
    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <button class="sd-back" onclick="window._sdGo('restaurants')">\u2190</button>
          <span class="sd-header-title">${rest.emoji} ${rest.name}</span>
          ${cartCount() > 0 ? `<button class="sd-cart-badge" onclick="window._sdGo('cart')">\u{1F6D2} ${cartCount()}</button>` : '<span></span>'}
        </div>
        <div class="sd-content">
          ${rest.items.map((item, idx) => `
            <div class="sd-menu-item">
              <div class="sd-item-top">
                <span class="sd-item-emoji">${item.emoji}</span>
                <div class="sd-item-info">
                  <div class="sd-item-name">${item.name}</div>
                  <div class="sd-item-desc">${item.desc}</div>
                  <div class="sd-item-price">${item.price} coins</div>
                </div>
              </div>
              ${item.addOns.length ? `<div class="sd-addons" id="sd-addons-${idx}">${item.addOns.map((a, ai) => `<button class="sd-addon-pill" data-idx="${idx}" data-ai="${ai}" onclick="this.classList.toggle('sd-addon-active')">${a}</button>`).join('')}</div>` : ''}
              <button class="sd-add-btn" onclick="window._sdAddToCart('${rest.id}', ${idx})">+ Add to Cart</button>
            </div>
          `).join('')}
        </div>
        ${cartCount() > 0 ? `<div class="sd-cart-footer" onclick="window._sdGo('cart')">\u{1F6D2} View Cart (${cartCount()} items) \u2014 ${cartTotal()} coins</div>` : ''}
      </div>`;
  }

  function renderCart() {
    if (cart.length === 0) {
      body.innerHTML = `
        <div class="sd-wrap">
          <div class="sd-header">
            <button class="sd-back" onclick="window._sdGo('restaurants')">\u2190</button>
            <span class="sd-header-title">Your Cart</span>
            <span></span>
          </div>
          <div class="sd-content sd-empty">
            <div class="sd-empty-emoji">\u{1F6D2}</div>
            <div>Your cart is empty!</div>
            <div class="sd-empty-sub">Go pick some ridiculous food.</div>
          </div>
        </div>`;
      return;
    }

    const tipEmojis = ['\u{1F44D}', '\u{1F44F}', '\u{1F64C}', '\u{1F929}', '\u{1F451}'];
    const total = cartTotal() + tipLevel;

    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <button class="sd-back" onclick="window._sdGo('${selectedRestaurant ? 'menu' : 'restaurants'}')">\u2190</button>
          <span class="sd-header-title">Your Cart</span>
          <span></span>
        </div>
        <div class="sd-content">
          ${cart.map((item, i) => `
            <div class="sd-cart-item">
              <span class="sd-cart-item-emoji">${item.emoji}</span>
              <div class="sd-cart-item-info">
                <div class="sd-cart-item-name">${item.name}</div>
                ${item.addOns.length ? `<div class="sd-cart-item-addons">${item.addOns.join(', ')}</div>` : ''}
                <div class="sd-cart-item-price">${item.price * item.qty} coins</div>
              </div>
              <div class="sd-qty-controls">
                <button class="sd-qty-btn" onclick="window._sdQty(${i}, -1)">\u2212</button>
                <span class="sd-qty-num">${item.qty}</span>
                <button class="sd-qty-btn" onclick="window._sdQty(${i}, 1)">+</button>
              </div>
            </div>
          `).join('')}

          <div class="sd-section-label">Pay With</div>
          <div class="sd-currency-row">
            ${CURRENCIES.map((c, i) => `<button class="sd-currency-pill ${selectedCurrency === i ? 'sd-currency-active' : ''}" onclick="window._sdCurrency(${i})">${c.emoji} ${c.name}</button>`).join('')}
          </div>

          <div class="sd-section-label">Tip Your Driver</div>
          <div class="sd-tip-row">
            ${tipEmojis.map((e, i) => `<button class="sd-tip-btn ${tipLevel === (i + 1) ? 'sd-tip-active' : ''}" onclick="window._sdTip(${i + 1})">${e}<br>${i + 1}</button>`).join('')}
          </div>

          <div class="sd-total">
            <span>Total</span>
            <strong>${total} ${CURRENCIES[selectedCurrency].emoji}</strong>
          </div>

          <button class="sd-pay-btn" onclick="window._sdPay()">\u{1F4B0} Pay ${total} ${CURRENCIES[selectedCurrency].name}</button>
          <div class="sd-disclaimer">* No real money. No real food. No refunds on imaginary orders.</div>
        </div>
      </div>`;
  }

  function renderPaying() {
    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <span class="sd-header-title">Processing...</span>
        </div>
        <div class="sd-content sd-paying-screen">
          <div class="sd-pay-spinner" id="sd-pay-spinner">${CURRENCIES[selectedCurrency].emoji}</div>
          <div class="sd-pay-msg" id="sd-pay-msg">${pick(PAYMENT_MSGS)}</div>
        </div>
      </div>`;

    // Cycle messages
    let msgCount = 0;
    const msgEl = () => body ? body.querySelector('#sd-pay-msg') : null;
    const msgInterval = setInterval(() => {
      const el = msgEl();
      if (el) el.textContent = pick(PAYMENT_MSGS);
      msgCount++;
      if (msgCount >= 3) clearInterval(msgInterval);
    }, 800);

    payTimeout = setTimeout(() => {
      clearInterval(msgInterval);
      startTracking();
    }, 3000);
  }

  function startTracking() {
    const driver = pick(DRIVERS);
    activeOrder = {
      driver,
      waypointIdx: 0,
      items: [...cart],
      restaurant: selectedRestaurant,
      currency: CURRENCIES[selectedCurrency],
      total: cartTotal() + tipLevel,
    };
    cart = [];
    screen = 'tracking';
    render();

    trackingInterval = setInterval(() => {
      if (!activeOrder) { clearInterval(trackingInterval); return; }
      activeOrder.waypointIdx++;
      if (activeOrder.waypointIdx >= WAYPOINTS.length) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        completeDelivery();
      } else {
        render();
      }
    }, 4000);
  }

  function renderTracking() {
    if (!activeOrder) { screen = 'home'; render(); return; }
    const d = activeOrder.driver;
    const wpIdx = activeOrder.waypointIdx;
    const remaining = (WAYPOINTS.length - 1 - wpIdx) * 4;

    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <span class="sd-header-title">\u{1F4E6} Delivery Tracker</span>
        </div>
        <div class="sd-content">
          <div class="sd-driver">
            <span class="sd-driver-emoji">${d.emoji}</span>
            <div class="sd-driver-info">
              <div class="sd-driver-name">${d.name}</div>
              <div class="sd-driver-vehicle">On ${d.vehicle}</div>
            </div>
            <div class="sd-driver-eta">${remaining > 0 ? `~${remaining}s` : 'HERE!'}</div>
          </div>

          <div class="sd-timeline">
            ${WAYPOINTS.map((wp, i) => {
              let cls = 'sd-wp-future';
              if (i < wpIdx) cls = 'sd-wp-done';
              else if (i === wpIdx) cls = 'sd-wp-current';
              return `<div class="sd-waypoint ${cls}">
                <div class="sd-wp-dot"></div>
                <div class="sd-wp-info">
                  <span class="sd-wp-emoji">${wp.emoji}</span>
                  <div>
                    <div class="sd-wp-place">${wp.place}</div>
                    ${i === wpIdx ? `<div class="sd-wp-msg">${wp.msg}</div>` : ''}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>

          <button class="sd-honk-btn" onclick="window._sdHonk()">
            ${honkAnim ? '<span class="sd-honk-text">HONK HONK!</span>' : '\u{1F4E3} Honk!'}
          </button>
        </div>
      </div>`;
  }

  function completeDelivery() {
    // Award points
    const points = 50 + Math.floor(Math.random() * 50) + (mood * 20);
    persisted.snackPoints += points;
    persisted.totalOrders++;

    if (activeOrder.restaurant && !persisted.orderedFrom.includes(activeOrder.restaurant)) {
      persisted.orderedFrom.push(activeOrder.restaurant);
    }

    // Save order history (keep last 5)
    persisted.orderHistory.unshift({
      items: activeOrder.items.map(i => i.name),
      restaurant: activeOrder.restaurant,
      total: activeOrder.total,
      currency: activeOrder.currency.name,
      date: new Date().toLocaleDateString(),
      points,
    });
    if (persisted.orderHistory.length > 5) persisted.orderHistory.length = 5;

    // Check badges
    const newBadges = checkBadges();
    saveState();

    // Show delivered screen
    screen = 'delivered';
    renderDeliveredWith(points, newBadges);
  }

  function renderDelivered() {
    renderDeliveredWith(0, []);
  }

  function renderDeliveredWith(points, newBadges) {
    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <span class="sd-header-title">\u{1F389} Delivered!</span>
        </div>
        <div class="sd-content sd-delivered">
          <div class="sd-delivered-emoji">\u{1F389}</div>
          <div class="sd-delivered-title">Your food arrived!</div>
          <div class="sd-delivered-driver">${activeOrder ? activeOrder.driver.emoji + ' ' + activeOrder.driver.name + ' says bye!' : ''}</div>
          ${points > 0 ? `<div class="sd-delivered-points">+${points} SnackPoints!</div>` : ''}
          ${newBadges.length > 0 ? `<div class="sd-delivered-badges">
            <div>New Badge${newBadges.length > 1 ? 's' : ''} Unlocked!</div>
            ${newBadges.map(b => `<div class="sd-new-badge">${b.emoji} ${b.name}</div>`).join('')}
          </div>` : ''}
          <button class="sd-big-btn" onclick="window._sdDone()">\u{1F44D} Done</button>
        </div>
      </div>`;
  }

  function renderVault() {
    const uniqueCount = [...new Set(persisted.orderedFrom)].length;
    const earnedBadges = BADGES.filter(b => persisted.badges.includes(b.id));

    body.innerHTML = `
      <div class="sd-wrap">
        <div class="sd-header">
          <button class="sd-back" onclick="window._sdGo('home')">\u2190</button>
          <span class="sd-header-title">\u{1F3C6} Snack Vault</span>
          <span></span>
        </div>
        <div class="sd-content">
          <div class="sd-vault-stats">
            <div class="sd-vault-stat">
              <div class="sd-vault-stat-num">${persisted.totalOrders}</div>
              <div class="sd-vault-stat-label">Orders</div>
            </div>
            <div class="sd-vault-stat">
              <div class="sd-vault-stat-num">${persisted.snackPoints}</div>
              <div class="sd-vault-stat-label">Points</div>
            </div>
            <div class="sd-vault-stat">
              <div class="sd-vault-stat-num">${uniqueCount}</div>
              <div class="sd-vault-stat-label">Restaurants</div>
            </div>
          </div>

          ${earnedBadges.length > 0 ? `
            <div class="sd-section-label">Badges</div>
            <div class="sd-vault-badges">
              ${earnedBadges.map(b => `<div class="sd-vault-badge">${b.emoji}<br><small>${b.name}</small></div>`).join('')}
            </div>
          ` : ''}

          <div class="sd-section-label">Recent Orders</div>
          ${persisted.orderHistory.length > 0 ? persisted.orderHistory.map(o => `
            <div class="sd-order-card">
              <div class="sd-order-top">
                <span>${o.date}</span>
                <span>+${o.points} pts</span>
              </div>
              <div class="sd-order-items">${o.items.join(', ')}</div>
              <div class="sd-order-total">${o.total} ${o.currency}</div>
            </div>
          `).join('') : '<div class="sd-empty-sub">No orders yet! Go get some snacks.</div>'}
        </div>
      </div>`;
  }

  /* ---- Global Handlers ---- */
  window._sdGo = function(s) {
    screen = s;
    render();
  };

  window._sdMood = function(m) {
    mood = m;
    render();
  };

  window._sdOpenMenu = function(restId) {
    selectedRestaurant = restId;
    screen = 'menu';
    render();
  };

  window._sdAddToCart = function(restId, itemIdx) {
    // Collect active add-ons
    const addOns = [];
    const pills = body ? body.querySelectorAll(`#sd-addons-${itemIdx} .sd-addon-active`) : [];
    pills.forEach(p => addOns.push(p.textContent));
    addToCart(restId, itemIdx, addOns);

    // Flash feedback
    const btn = body ? body.querySelectorAll('.sd-add-btn')[itemIdx] : null;
    if (btn) {
      btn.textContent = '\u2705 Added!';
      btn.classList.add('sd-added');
      setTimeout(() => { btn.textContent = '+ Add to Cart'; btn.classList.remove('sd-added'); }, 800);
    }
  };

  window._sdQty = function(cartIdx, delta) {
    if (!cart[cartIdx]) return;
    cart[cartIdx].qty += delta;
    if (cart[cartIdx].qty <= 0) cart.splice(cartIdx, 1);
    render();
  };

  window._sdCurrency = function(idx) {
    selectedCurrency = idx;
    render();
  };

  window._sdTip = function(level) {
    tipLevel = level;
    render();
  };

  window._sdPay = function() {
    if (cart.length === 0) return;
    screen = 'paying';
    render();
  };

  window._sdHonk = function() {
    honkAnim = true;
    render();
    setTimeout(() => { honkAnim = false; render(); }, 600);
  };

  window._sdDone = function() {
    activeOrder = null;
    screen = 'home';
    render();
  };

  /* ---- App Registration ---- */
  OS.registerApp('snackdash', {
    singleInstance: true,
    getWindowOpts() {
      return { id: 'snackdash', title: 'SnackDash', icon: '\u{1F6F5}', width: 420, height: 520, content: '' };
    },
    onOpen(id) {
      winId = id;
      body = document.getElementById('win-body-' + id);
      loadState();
      screen = 'home';
      cart = [];
      selectedRestaurant = null;
      selectedCurrency = 0;
      tipLevel = 3;
      mood = 1;
      activeOrder = null;
      honkAnim = false;
      bannerIdx = Math.floor(Math.random() * BANNERS.length);
      render();

      // Rotate banner
      bannerInterval = setInterval(() => {
        bannerIdx = (bannerIdx + 1) % BANNERS.length;
        const el = body ? body.querySelector('#sd-banner') : null;
        if (el) el.textContent = BANNERS[bannerIdx];
      }, 5000);
    },
    onClose() {
      if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
      if (bannerInterval) { clearInterval(bannerInterval); bannerInterval = null; }
      if (payTimeout) { clearTimeout(payTimeout); payTimeout = null; }
      activeOrder = null;
      body = null;
    },
  });
})();
