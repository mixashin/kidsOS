/* ===== Pebbles: the pet rock =====
   A painted rock lives in a small meadow. It breathes, blinks, sleeps at night, and thinks in bubbles.
   The child taps it, rubs it, gives it tricks, dresses it, and plays 2 small games with it.
   Nothing decays and nothing resets: the rock never needs the child.
   Pictures: art/pebbles/, all layers of the rock share one 1024 canvas (brief 11 of Astra). */
{
const t = OS.texts('pebbles');

var PebblesApp = (() => {
  const STORE_KEY = 'kidsOS_pebbles';

  /* ---- Rules with no screen. Node test: _work/pebbles.test.mjs ---- */
  const core = (() => {
    const PLACES = ['head', 'eyes', 'neck', 'back'];
    const ITEMS = {
      'top-hat': 'head', crown: 'head', 'flower-crown': 'head',
      sunglasses: 'eyes', 'googly-eyes': 'eyes',
      'bow-tie': 'neck', scarf: 'neck',
      cape: 'back',
    };
    const START_OPEN = ['top-hat', 'bow-tie'];
    const GIFT_ORDER = ['crown', 'sunglasses', 'scarf', 'cape', 'flower-crown', 'googly-eyes'];
    const GIFT_ACTIONS = ['roll', 'dead', 'jump', 'shake', 'rub', 'game'];
    // First version of the app: accessories opened at an XP value
    const OLD_ITEMS = { eyes: ['googly-eyes', 0], hat: ['top-hat', 30], bow: ['bow-tie', 75], sunglasses: ['sunglasses', 150], crown: ['crown', 300], cape: ['cape', 500] };
    const EYES = ['open', 'closed', 'happy', 'wide', 'x'];
    const MOUTHS = ['smile', 'open', 'flat'];
    const PICTURES = [
      'pebbles-body', 'pebbles-leaf', ...EYES.map(e => 'pebbles-eyes-' + e), ...MOUTHS.map(m => 'pebbles-mouth-' + m),
      'pebbles-blush', 'pebbles-shine', 'pebbles-shadow',
      ...Object.keys(ITEMS).map(id => 'wear-' + id),
      'pebbles-box-back', 'pebbles-box-front', 'pebbles-scene-day', 'pebbles-scene-night',
      ...['heart', 'star', 'zzz', 'question', 'exclaim', 'note', 'sparkle', 'drop', 'sun'].map(b => 'bubble-' + b),
      ...['sit', 'stay', 'play-dead', 'roll-over', 'jump', 'shake-hands'].map(k => 'trick-' + k),
      'hand-rock', 'hand-paper', 'hand-scissors', 'leaf-pile', 'critter-snail', 'critter-ladybug', 'fx-puff', 'gift',
    ].map(f => f + '.webp');
    // Rub: 3 changes of direction within 1.5 s, each part 12 px or longer. ponytail: first guess, tune on the tablet
    const RUB_TURNS = 3, RUB_TIME = 1500, RUB_PART = 12;

    const fresh = () => ({ v: 2, name: 'Pebbles', days: 0, lastDay: '', wear: { head: null, eyes: null, neck: null, back: null }, open: START_OPEN.slice(), firsts: [], muted: false });
    const count = n => Number.isFinite(Number(n)) && Number(n) > 0 ? Math.floor(Number(n)) : 0;
    const day = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
    const pad = n => String(n).padStart(2, '0');
    const dayKey = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    const isNight = date => date.getHours() >= 20 || date.getHours() < 7;
    const openItem = (s, id) => { if (ITEMS[id] && !s.open.includes(id)) s.open.push(id); };

    // A stored value of any form gives a working rock
    function load(raw) {
      let saved = null;
      try { saved = JSON.parse(raw); } catch (e) { /* broken value: new rock */ }
      const s = fresh();
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return s;
      if (typeof saved.name === 'string' && saved.name.trim()) s.name = saved.name.trim().slice(0, 20);
      if (saved.v === 2) {
        s.days = count(saved.days);
        s.lastDay = day(saved.lastDay);
        s.muted = saved.muted === true;
        if (Array.isArray(saved.open)) saved.open.forEach(id => openItem(s, id));
        if (Array.isArray(saved.firsts)) saved.firsts.forEach(a => { if (GIFT_ACTIONS.includes(a) && !s.firsts.includes(a)) s.firsts.push(a); });
        const wear = saved.wear && typeof saved.wear === 'object' ? saved.wear : {};
        PLACES.forEach(p => { if (ITEMS[wear[p]] === p && s.open.includes(wear[p])) s.wear[p] = wear[p]; });
        return s;
      }
      s.days = Math.max(count(saved.bestStreak), count(saved.streak));
      s.lastDay = day(saved.lastDate);
      if (s.lastDay) s.days = Math.max(s.days, 1);
      if ('xp' in saved) Object.values(OLD_ITEMS).forEach(([id, xp]) => { if (count(saved.xp) >= xp) openItem(s, id); });
      const worn = OLD_ITEMS[saved.currentAccessory];
      if (worn && saved.currentAccessory !== 'eyes' && s.open.includes(worn[0])) s.wear[ITEMS[worn[0]]] = worn[0];
      return s;
    }

    // One open of the app on this date: a new day together, and the greeting
    function visit(s, date) {
      const today = dayKey(date);
      if (!s.lastDay) { s.days = Math.max(s.days, 1); s.lastDay = today; return 'first'; }
      if (today <= s.lastDay) return null; // same day, or the clock went back
      const gap = Math.round((new Date(today + 'T12:00') - new Date(s.lastDay + 'T12:00')) / 86400000);
      s.days += 1;
      s.lastDay = today;
      if (gap >= 2) return 'back';
      return date.getHours() >= 7 && date.getHours() < 12 ? 'morning' : null;
    }

    // First try of a gift action: the next closed item of the gift order, or null
    function firstTry(s, action) {
      if (!GIFT_ACTIONS.includes(action) || s.firsts.includes(action)) return null;
      s.firsts.push(action);
      const item = GIFT_ORDER.find(id => !s.open.includes(id)) || null;
      if (item) s.open.push(item);
      return item;
    }

    // Put an open item on, or take it off when the rock wears it
    function wear(s, id) {
      const place = ITEMS[id];
      if (!place || !s.open.includes(id)) return false;
      s.wear[place] = s.wear[place] === id ? null : id;
      return true;
    }

    // The child against a rock. Pebbles always plays rock
    const rps = hand => hand === 'paper' ? 'win' : hand === 'rock' ? 'tie' : 'lose';

    function rubber() {
      let runs = null, turns = [];
      const run = v => ({ dir: 0, start: v, pos: v });
      function track(r, v, now) {
        const step = v - r.pos;
        if (!step) return;
        const dir = step > 0 ? 1 : -1;
        if (r.dir && dir !== r.dir) {
          if (Math.abs(r.pos - r.start) >= RUB_PART) turns.push(now);
          r.start = r.pos;
        }
        r.dir = dir;
        r.pos = v;
      }
      return {
        down(x, y) { runs = [run(x), run(y)]; turns = []; },
        move(x, y, now) {
          if (!runs) return false;
          track(runs[0], x, now);
          track(runs[1], y, now);
          turns = turns.filter(at => now - at <= RUB_TIME);
          if (turns.length < RUB_TURNS) return false;
          turns = [];
          return true;
        },
        up() { runs = null; },
      };
    }

    // A second press within ms after the last accepted press is a holdover (research): ignore it
    function guard(ms) {
      let last = -Infinity;
      return now => { if (now - last < ms) return false; last = now; return true; };
    }

    return { PLACES, ITEMS, START_OPEN, GIFT_ORDER, GIFT_ACTIONS, EYES, MOUTHS, PICTURES, fresh, load, dayKey, isNight, visit, firstTry, wear, rps, rubber, guard };
  })();

  return { core, STORE_KEY };
})();
}
