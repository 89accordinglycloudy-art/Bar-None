'use strict';
// BAR NONE beat logic — pure functions, shared by the browser client and the
// node test suite. Patterns are step grids: 64 steps = 4 bars x 16 steps.
// A pattern is a list of hits: { s: step 0..63, n: midi note|null, l: length in steps, v: velocity }.

// Apply board effects that change WHICH patterns play (BEAT FLIP swaps two).
function effectivePatterns(activeSounds, fx) {
  const out = {};
  for (const [cat, snd] of Object.entries(activeSounds || {})) out[cat] = snd.hits || [];
  if (fx && fx.name === 'BEAT FLIP') {
    const cats = Object.keys(out);
    if (cats.length >= 2) { const tmp = out[cats[0]]; out[cats[0]] = out[cats[1]]; out[cats[1]] = tmp; }
  }
  return out;
}

// Hits that should sound on a given step, after MUTE / BREAKDOWN / REVERSE.
function hitsAtStep(activeSounds, fx, step) {
  const patterns = effectivePatterns(activeSounds, fx);
  const res = [];
  for (const [cat, hits] of Object.entries(patterns)) {
    if (fx && fx.name === 'MUTE' && fx.detail === cat) continue;
    if (fx && fx.name === 'BREAKDOWN' && fx.detail && fx.detail !== cat) continue;
    const s = fx && fx.name === 'REVERSE' && fx.detail === cat ? 63 - step : step;
    for (const h of hits) if (h.s === s) res.push({ cat, n: h.n, l: h.l, v: h.v });
  }
  return res;
}

function tempoFor(fx) {
  if (fx && fx.name === 'DOUBLE TIME') return 184;
  if (fx && fx.name === 'HALF TIME') return 46;
  return 92;
}

if (typeof window !== 'undefined') window.BarNoneAudio = { effectivePatterns, hitsAtStep, tempoFor };
if (typeof module !== 'undefined') module.exports = { effectivePatterns, hitsAtStep, tempoFor };
