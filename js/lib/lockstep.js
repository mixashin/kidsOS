/* ===== Lockstep — keeps one game in step on two devices =====
   For games with a simulation that gives the same result from the same inputs (Pong).
   Each device sends only its own input, never the game state. Both devices run the same
   simulation with the same inputs, so both see the same game.

   How it works:
   - The input of a player at tick t is used in step t + delay. The delay hides the time
     that a message needs on the network.
   - A step runs only when the inputs of both players for that step are here.
   - Each message repeats the last inputs, so a lost message does no harm.

   This file has no network code. The caller gives a send function and calls receive.
   Messages are ArrayBuffer: 12 bytes head, then 2 bytes for each input. */
const Lockstep = (() => {
  const NONE = -32768;      // input "no target": the paddle stays
  const HEAD = 12;

  // player: 0 or 1. send(ArrayBuffer). delay in steps. repeat: inputs in each message.
  function create({ player, send, delay = 6, repeat = 16, maxRun = 4 }) {
    const mine = new Map();     // step -> my input
    const theirs = new Map();   // step -> input of the other player
    let step = 0;               // next step to run
    let planned = delay;        // next step that gets my input. Steps before it have no input.
    let known = delay - 1;      // inputs of the other player are here up to this step, with no gap
    let waiting = 0;            // ticks in a row with no step
    let lastHeard = 0, ticks = 0;
    let hashes = new Map();     // step -> state check value from the other device
    let outHash = null;

    for (let s = 0; s < delay; s++) { mine.set(s, NONE); theirs.set(s, NONE); }

    function pack() {
      const first = Math.max(0, planned - repeat);
      const count = planned - first;
      const buf = new ArrayBuffer(HEAD + count * 2);
      const v = new DataView(buf);
      v.setUint32(0, first);
      v.setUint16(4, count);
      v.setUint16(6, outHash ? outHash[1] & 0xffff : 0);
      v.setUint32(8, outHash ? outHash[0] : 0xffffffff);
      for (let i = 0; i < count; i++) v.setInt16(HEAD + i * 2, mine.get(first + i));
      return buf;
    }

    return {
      // Call one time in each tick of the game loop, with the input of this player (number or null).
      // Returns the steps that can run now: [[input of player 0, input of player 1], ...]
      tick(input) {
        ticks++;
        // Do not run ahead: my inputs are planned at most `delay` steps after the next step
        if (planned <= step + delay) {
          mine.set(planned, input === null || input === undefined ? NONE : Math.max(-32767, Math.min(32767, Math.round(input))));
          planned++;
        }
        send(pack());

        const run = [];
        while (run.length < maxRun && step < planned && step <= known) {
          const a = mine.get(step), b = theirs.get(step);
          const pair = player === 0 ? [a, b] : [b, a];
          run.push(pair.map(x => (x === NONE ? null : x)));
          mine.delete(step - repeat - 1);
          theirs.delete(step - repeat - 1);
          step++;
        }
        waiting = run.length ? 0 : waiting + 1;
        return run;
      },

      receive(buf) {
        if (!(buf instanceof ArrayBuffer) || buf.byteLength < HEAD) return;
        const v = new DataView(buf);
        const first = v.getUint32(0), count = v.getUint16(4);
        if (buf.byteLength !== HEAD + count * 2 || count > 1024) return;
        lastHeard = ticks;
        for (let i = 0; i < count; i++) {
          const s = first + i;
          if (s > known && !theirs.has(s)) theirs.set(s, v.getInt16(HEAD + i * 2));
        }
        while (theirs.has(known + 1)) known++;
        const hashStep = v.getUint32(8);
        if (hashStep !== 0xffffffff) hashes.set(hashStep, v.getUint16(6));
      },

      // The caller gives a check value of its state after a step. The other device compares.
      // Returns false when the two devices have a different state at that step.
      check(atStep, value) {
        outHash = [atStep, value & 0xffff];
        const other = hashes.get(atStep);
        for (const s of hashes.keys()) if (s < atStep - 600) hashes.delete(s);
        return other === undefined || other === (value & 0xffff);
      },

      get step() { return step; },
      get waiting() { return waiting; },          // ticks with no progress: the game shows "wait"
      get silent() { return ticks - lastHeard; }, // ticks with no message from the other device
    };
  }

  // Small check value of a game state, from its numbers
  function hash(values) {
    let h = 2166136261;
    for (const x of values) {
      const n = Math.round(x * 1024) | 0;
      h = Math.imul(h ^ (n & 0xff), 16777619);
      h = Math.imul(h ^ ((n >>> 8) & 0xff), 16777619);
      h = Math.imul(h ^ ((n >>> 16) & 0xff), 16777619);
      h = Math.imul(h ^ (n >>> 24), 16777619);
    }
    return (h >>> 0) & 0xffff;
  }

  return { create, hash };
})();
