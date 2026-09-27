/* ===== Language layer =====
   The English text in the code is the key. A table gives the text of another language for it.
   This file has no page code, so a test can load it outside of a browser.

   App code:
     const t = OS.texts('memory');          one time for each app file, inside a block or a function:
                                            all app files share one scope, so a top-level const t
                                            in two files stops the second file
     t('New Game')                          text
     t('Score: {n}', { n: score })          text with values
     t('bank|Save')                         the same English word with another meaning:
                                            English shows "Save", the table has its own entry
     t.plural(n, 'day', 'days')             word form for a number
     t.list('kidflix.films', FILMS)         list of funny content, call it at the time of use

   Language file (js/lang/sr/memory.js):
     Lang.add('sr', 'memory', { 'New Game': 'Нова игра', 'day / days': ['дан', 'дана', 'дана'] },
       { 'kidflix.films': { 1: { title: 'Залеђено пиле' } },        list by id: text fields of each item
         'tinybank.news': ['Банка је затворена.'] });              list of texts: replaces the English list

   Lookup: table of the app, then table 'os' (shared words), then the English text.
   A text with no entry shows in English, and the layer records its key. */
const Lang = (() => {
  const LOCALES = { en: 'en', sr: 'sr-Cyrl-RS' };
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  let current = 'en';
  const tables = {};         // language -> app -> key -> text, or array of 3 plural forms
  const lists = {};          // language -> list name -> entry
  const missing = new Set(); // keys with no entry
  let rules = null;          // plural rules of the current language

  function valid(code) {
    return typeof code === 'string' && has(LOCALES, code) ? code : 'en';
  }

  function set(code) {
    current = valid(code);
    rules = null;
  }

  function add(code, app, table, content) {
    if (!has(LOCALES, code)) return;
    const byApp = has(tables, code) ? tables[code] : (tables[code] = {});
    if (!has(byApp, app)) byApp[app] = {};
    Object.assign(byApp[app], table);
    if (content) Object.assign(has(lists, code) ? lists[code] : (lists[code] = {}), content);
  }

  function find(app, key) {
    const byApp = has(tables, current) ? tables[current] : null;
    if (!byApp) return undefined;
    if (has(byApp, app) && has(byApp[app], key)) return byApp[app][key];
    if (has(byApp, 'os') && has(byApp.os, key)) return byApp.os[key];
    return undefined;
  }

  // 'bank|Save' -> 'Save'
  function plain(key) {
    const at = key.indexOf('|');
    return at < 0 ? key : key.slice(at + 1);
  }

  // A function as second parameter of replace: signs such as $& in a value stay text
  function fill(text, values) {
    if (!values) return text;
    return text.replace(/\{(\w+)\}/g, (all, name) => has(values, name) ? String(values[name]) : all);
  }

  function text(app, key, values) {
    let out = plain(key);
    if (current !== 'en') {
      const entry = find(app, key);
      if (typeof entry === 'string') out = entry;
      else missing.add(app + ': ' + key);
    }
    return fill(out, values);
  }

  function plural(app, n, one, other) {
    if (current !== 'en') {
      const key = one + ' / ' + other;
      const forms = find(app, key);
      if (Array.isArray(forms) && forms.length === 3 && forms.every(f => typeof f === 'string')) {
        rules = rules || new Intl.PluralRules(LOCALES[current]);
        const kind = rules.select(Math.abs(n));
        return forms[kind === 'one' ? 0 : kind === 'few' ? 1 : 2];
      }
      missing.add(app + ': ' + key);
    }
    return n === 1 ? one : other;
  }

  function list(name, english) {
    if (current === 'en') return english;
    const all = has(lists, current) ? lists[current] : {};
    if (!has(all, name)) {
      missing.add('list: ' + name);
      return english;
    }
    const entry = all[name];
    if (Array.isArray(entry)) return entry;
    return english.map(item => {
      if (!has(entry, item.id)) {
        missing.add('list: ' + name + ', item ' + item.id);
        return item;
      }
      return { ...item, ...entry[item.id] };
    });
  }

  // Search: true if the text holds the typed letters. In Serbian, a child with a Latin keyboard
  // can type a Cyrillic name with Latin letters ("tvrdjava", "tvrđava", "tvrdava"). English: plain search
  const LATIN = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'd', е: 'e', ж: 'z', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's', đ: 'd', ž: 'z', č: 'c', ć: 'c', š: 's' };
  const latin = s => s.toLowerCase().replace(/[а-џđžčćš]/g, c => has(LATIN, c) ? LATIN[c] : c).replace(/dj/g, 'd');
  function holds(text, typed) {
    const q = String(typed).trim().toLowerCase();
    if (!q || String(text).toLowerCase().includes(q)) return true;
    return current !== 'en' && latin(String(text)).includes(latin(q));
  }

  // The text function of one app
  function texts(app) {
    const t = (key, values) => text(app, key, values);
    t.plural = (n, one, other) => plural(app, n, one, other);
    t.list = list;
    return t;
  }

  return {
    set, add, valid, texts, holds,
    get code() { return current; },
    get locale() { return LOCALES[current]; },
    get missing() { return [...missing]; },
  };
})();
