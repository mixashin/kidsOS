/* ===== Calculator App ===== */
OS.registerApp('calculator', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'calculator',
      title: 'Calculator',
      icon: '🔢',
      width: 300,
      height: 420,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="calc-wrap">
      <div class="calc-display">
        <div class="calc-expr" id="calc-expr"></div>
        <div class="calc-result" id="calc-result">0</div>
      </div>
      <div class="calc-buttons">
        <button class="calc-btn clear" onclick="CalcApp.press('clear')">C</button>
        <button class="calc-btn fn"    onclick="CalcApp.press('sign')">±</button>
        <button class="calc-btn fn"    onclick="CalcApp.press('pct')">%</button>
        <button class="calc-btn op"   onclick="CalcApp.press('/')">÷</button>

        <button class="calc-btn num"  onclick="CalcApp.press('7')">7</button>
        <button class="calc-btn num"  onclick="CalcApp.press('8')">8</button>
        <button class="calc-btn num"  onclick="CalcApp.press('9')">9</button>
        <button class="calc-btn op"   onclick="CalcApp.press('*')">×</button>

        <button class="calc-btn num"  onclick="CalcApp.press('4')">4</button>
        <button class="calc-btn num"  onclick="CalcApp.press('5')">5</button>
        <button class="calc-btn num"  onclick="CalcApp.press('6')">6</button>
        <button class="calc-btn op"   onclick="CalcApp.press('-')">−</button>

        <button class="calc-btn num"  onclick="CalcApp.press('1')">1</button>
        <button class="calc-btn num"  onclick="CalcApp.press('2')">2</button>
        <button class="calc-btn num"  onclick="CalcApp.press('3')">3</button>
        <button class="calc-btn op"   onclick="CalcApp.press('+')">+</button>

        <button class="calc-btn num zero" onclick="CalcApp.press('0')">0</button>
        <button class="calc-btn num"  onclick="CalcApp.press('.')">.</button>
        <button class="calc-btn eq"   onclick="CalcApp.press('=')">=</button>
      </div>
    </div>`;
  },

  onOpen() { CalcApp.reset(); },
  onClose() {},
});

/* Calculator Logic */
const CalcApp = (() => {
  let display = '0';
  let stored = null;
  let op = null;
  let justCalc = false;

  function update() {
    const r = document.getElementById('calc-result');
    const e = document.getElementById('calc-expr');
    if (r) r.textContent = display;
    if (e) e.textContent = stored !== null ? `${stored} ${opSymbol(op)}` : '';
  }

  function opSymbol(o) {
    return {'+':'+', '-':'−', '*':'×', '/':'÷'}[o] || o;
  }

  function press(key) {
    if (key === 'clear') {
      display = '0'; stored = null; op = null; justCalc = false;
    } else if (key === 'sign') {
      display = String(parseFloat(display) * -1);
    } else if (key === 'pct') {
      display = String(parseFloat(display) / 100);
    } else if (['+','-','*','/'].includes(key)) {
      if (op && !justCalc) calculate();
      stored = parseFloat(display);
      op = key; justCalc = false; display = '0';
    } else if (key === '=') {
      calculate(); op = null;
    } else if (key === '.') {
      if (justCalc) { display = '0'; justCalc = false; }
      if (!display.includes('.')) display += '.';
    } else {
      if (justCalc || display === '0') { display = key; justCalc = false; }
      else if (display.length < 15) display += key;
    }
    update();
  }

  function calculate() {
    if (stored === null || !op) return;
    const a = stored, b = parseFloat(display);
    let res;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') res = b === 0 ? 'Error' : a / b;

    display = res === 'Error' ? 'Error' : String(parseFloat(res.toFixed(10)));
    justCalc = true;
    stored = null;
  }

  function reset() { display = '0'; stored = null; op = null; justCalc = false; update(); }

  return { press, reset };
})();
