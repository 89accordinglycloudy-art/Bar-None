'use strict';
// BAR NONE Trainer — pure logic, shared by the browser client (trainer.js)
// and the node test suite. Follows the public/audio.js pattern: no DOM, no
// sockets, no server. The trainer is a writing room: the tool deals three
// candidate bars a turn (template frames x pack-wide imagery), the writer keeps
// one, edits it or writes their own, and every fifth bar carries a challenge.
// Scoring is measurements only — syllables, end-rhyme matching, topic words,
// challenges — never vibes.

// ---------- Syllables ----------
// Vowel-group heuristic. Honest approximation: good enough to compare bars
// against each other, which is all the scorecard claims to do.
function countSyllables(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let s = w.replace(/(?:[^laeiouy]e|ed|es)$/, '').replace(/^y/, '');
  const groups = s.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}
function barSyllables(bar) {
  return String(bar || '').split(/\s+/).filter(Boolean).reduce((n, w) => n + countSyllables(w), 0);
}
function endWord(bar) {
  const words = String(bar || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  return words.length ? words[words.length - 1].replace(/^'+|'+$/g, '') : '';
}
// Rhyme-family key for an end word: shared suffix is the approximation, and
// the scorecard says so ("end-rhyme matching").
function rhymeKey(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return w;
  return w.slice(-3);
}

// ---------- Small seeded RNG (tests stay deterministic) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Tone packs (content lives in trainer-bank.js) ----------
// The bank — every frame, topic, and imagery list — is content, and it
// lives in public/trainer-bank.js so a fresh drop is a one-file swap with
// zero engine risk (see bankMeta there for the drop ritual). In the
// browser the bank's script tag loads first and lands on
// window.BarNoneBank; in Node it is required directly. This file is logic
// only and refuses to boot without the bank.
let BarNoneBank = null;
if (typeof window !== 'undefined' && window.BarNoneBank) BarNoneBank = window.BarNoneBank;
else if (typeof require === 'function') { try { BarNoneBank = require('./trainer-bank.js'); } catch (e) { BarNoneBank = null; } }
if (!BarNoneBank || !BarNoneBank.TONE_PACKS)
  throw new Error('BAR NONE Trainer: content bank missing — trainer-bank.js must load before trainer-core.js');
const TONE_PACKS = BarNoneBank.TONE_PACKS;
const BANK_META = BarNoneBank.bankMeta || null;

// ---------- Imagery banks ----------
const SLOT_KEYS = { obj: 'objects', place: 'places', verb: 'verbs', det: 'details' };
function getPack(packId) { return TONE_PACKS[packId] || null; }
function getTopic(pack, topicName) {
  if (!pack) return null;
  return pack.topics.find(t => t.name === topicName) || pack.topics[0] || null;
}
// Topic imagery first (doubled, so the drawn topic's flavor dominates),
// pack pool underneath as the generic fallback.
function effectiveBank(pack, topic) {
  const bank = { topicName: topic ? topic.name : '' };
  for (const key of Object.values(SLOT_KEYS)) {
    const own = topic && topic.imagery && topic.imagery[key] ? topic.imagery[key] : [];
    const pool = pack && pack.pool && pack.pool[key] ? pack.pool[key] : [];
    bank[key] = [...own, ...own, ...pool];
  }
  return bank;
}
// The session dealing bank: imagery from EVERY topic in the pack plus the
// pack pool, merged and deduped per slot type. Dealing is not categorized
// by topic (Nate's ruling) — a session aimed at one theme can draw any
// image in the pack. The drawn topic's own bank survives only as the
// scoring theme reference (topicWords below), never as a dealing
// constraint and never as a tag on a dealt card.
function flatBank(pack) {
  const bank = {};
  for (const key of Object.values(SLOT_KEYS)) {
    const seen = new Set(), out = [];
    const push = (arr) => { for (const v of arr || []) if (!seen.has(v)) { seen.add(v); out.push(v); } };
    if (pack) {
      push(pack.pool && pack.pool[key]);
      for (const t of pack.topics || []) push(t.imagery && t.imagery[key]);
    }
    bank[key] = out;
  }
  return bank;
}
// Does a dealt bar name the topic outright? Word-boundary match on the
// literal topic name — the {T} fill, or a rare imagery collision.
function namesTopic(bar, topicName) {
  const name = String(topicName || '').trim();
  if (!name) return false;
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${esc}\\b`, 'i').test(String(bar || ''));
}
// Every word the topic discipline measure will credit: topic name words plus
// every word inside the topic's own imagery phrases. Scoring reference ONLY.
function topicWords(pack, topic) {
  const words = new Set();
  const add = (s) => String(s || '').toLowerCase().split(/[^a-z0-9']+/).forEach(w => { if (w.length >= 3) words.add(w.replace(/^'+|'+$/g, '')); });
  if (topic) {
    add(topic.name);
    if (topic.imagery) for (const key of Object.values(SLOT_KEYS)) (topic.imagery[key] || []).forEach(add);
  }
  return [...words].filter(Boolean);
}
function barOnTopic(bar, words) {
  const text = ' ' + String(bar || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ') + ' ';
  return words.some(w => text.includes(' ' + w) || text.includes(' ' + w + 's ') || text.includes(' ' + w + "'"));
}

// ---------- Candidate generation ----------
function fillFrame(frame, bank, rng) {
  const picked = {};
  return frame.replace(/\{(obj|place|verb|det|T)\}/g, (m, slot) => {
    if (slot === 'T') return bank.topicName;
    const key = SLOT_KEYS[slot];
    if (!(slot in picked)) {
      const arr = bank[key] || [];
      picked[slot] = arr.length ? arr[Math.floor(rng() * arr.length)] : '';
    }
    return picked[slot];
  });
}
// ---------- Session generation state ----------
// One state per writing session, created by newSessionGen. It gives the
// generator a memory, which is what keeps a whole session from feeling like
// the same bar reworded:
// - Frames are dealt WITHOUT replacement per section pool (hook pool =
//   shared + hook frames; verse pool = shared + verse frames). A frame can
//   only come back after its whole pool has been dealt; then the pool
//   reshuffles and dealing continues.
// - Imagery comes off shuffle-bags, one per slot type (objects / places /
//   verbs / details), built from the pack's FLAT bank — every topic's
//   imagery plus the pool (see flatBank). Dealing is not categorized by
//   topic: the drawn topic sets the theme, it does not fence the images.
//   A bag empties before any image repeats, then it reshuffles.
// - At most ONE candidate per hand names the topic outright (the {T}
//   fill); the rest of the hand works the imagery without the label. A
//   {T} frame the cap turns away is HELD — excluded from picks for the
//   rest of the pool cycle, released when the pool reshuffles — rather
//   than spent, so it can still be a later hand's one named card.
// - Within one turn, the 3 candidates never share the same {obj} anchor
//   when their frames carry one (see generateCandidates).
// Re-deals consume the same state — variety is the point, so asking for a
// fresh hand never deals the old one back.
function shuffleCopy(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function framesForSection(pack, section) {
  const frames = [...(pack.framesAny || [])];
  if (section === 'hook') frames.push(...(pack.framesHook || []));
  else frames.push(...(pack.framesVerse || []));
  return frames;
}
function poolKeyFor(section) { return section === 'hook' ? 'hook' : 'verse'; }
function freshBag(state, key) {
  return shuffleCopy([...new Set(state.dealBank[key] || [])], state.rng);
}
function newSessionGen(packId, topicName, seed) {
  const pack = getPack(packId);
  if (!pack) return null;
  const topic = getTopic(pack, topicName);
  // bank: the drawn topic's own bank — kept only for the topic name ({T}
  // fills). dealBank: the flat pack-wide bank the imagery bags deal from.
  const bank = effectiveBank(pack, topic);
  const dealBank = flatBank(pack);
  const rng = seed === undefined || seed === null ? Math.random : mulberry32(seed);
  const state = {
    packId: pack.id, topicName: topic ? topic.name : '',
    rng, bank, dealBank, bags: {},
    usedFrames: { hook: new Set(), verse: new Set() },
    heldFrames: { hook: new Set(), verse: new Set() }, // {T} frames the cap is holding this cycle
    heldEverFrames: { hook: new Set(), verse: new Set() }, // every frame ever held (rotation accounting)
    dealt: [], // { pool, frame, bar, anchor } for every accepted candidate
  };
  for (const key of Object.values(SLOT_KEYS)) state.bags[key] = freshBag(state, key);
  return state;
}
function drawFromBag(state, key) {
  const src = state.dealBank[key] || [];
  if (!src.length) return '';
  let bag = state.bags[key];
  if (!bag || !bag.length) bag = state.bags[key] = freshBag(state, key);
  const v = bag.pop();
  if (!bag.length) state.bags[key] = freshBag(state, key); // refill for the next draw
  return v;
}
// Fill one frame off the session bags. Each slot type is drawn once per bar,
// so a slot repeated inside a frame reuses the same image (fillFrame
// semantics). The anchor is the bar's {obj} image, if the frame has one.
function fillFrameFromGen(frame, state) {
  const picked = {};
  const bar = frame.replace(/\{(obj|place|verb|det|T)\}/g, (m, slot) => {
    if (slot === 'T') return state.bank.topicName;
    if (!(slot in picked)) picked[slot] = drawFromBag(state, SLOT_KEYS[slot]);
    return picked[slot];
  });
  return { bar, anchor: picked.obj || '' };
}
function pickFrameIndex(state, frames, poolKey) {
  const used = state.usedFrames[poolKey], held = state.heldFrames[poolKey];
  let avail = [];
  for (let i = 0; i < frames.length; i++) if (!used.has(i) && !held.has(i)) avail.push(i);
  if (!avail.length) {
    // Pool cycle complete: every frame is spent or cap-held. Reshuffle
    // both sets and deal on. Bars still can't repeat (the session's
    // dealt-bar check sees to that); frames alone recycle.
    used.clear(); held.clear();
    for (let i = 0; i < frames.length; i++) avail.push(i);
  }
  if (!avail.length) return -1;
  return avail[Math.floor(state.rng() * avail.length)];
}

// Deal 3 distinct candidate bars for one turn. Frames are section-aware
// (hook turns draw hook + shared frames; verse turns draw verse + shared).
// Bars are aimed at 8-14 syllables; the generator retries fills to land in
// range and falls back to the closest attempt rather than stalling.
// With opts.gen (a session state from newSessionGen) the deal draws from
// the session's frame pools and imagery bags, so nothing repeats across
// the session until it has to. Imagery comes from the whole pack, not the
// drawn topic's bank, and at most one candidate per hand names the topic
// outright. Without one, the deal is a one-off that dedupes frames within
// the call only (original behavior).
function generateCandidates(packId, topicName, section, opts = {}) {
  const pack = getPack(packId);
  if (!pack) return [];
  const exclude = opts.exclude || new Set();
  const frames = framesForSection(pack, section);

  if (opts.gen) {
    const state = opts.gen, poolKey = poolKeyFor(section);
    const out = [], anchors = new Set();
    const seen = new Set(state.dealt.map(d => d.bar)); // no exact bar twice in a session
    let topicNamed = false; // one candidate per hand may name the topic outright
    let attempts = 0;
    while (out.length < 3 && attempts < 150) {
      attempts++;
      const fi = pickFrameIndex(state, frames, poolKey);
      if (fi < 0) break;
      state.usedFrames[poolKey].add(fi);
      // Work the frame before giving it up: refill it with fresh imagery
      // until a fill lands in syllable range with a free anchor, keeping
      // the first clean out-of-range fill as the fallback (range is a
      // target, not a wall). One fill per frame starved the long classic
      // frames, whose fills run long — this is what burned pools early.
      // A fill that names the topic is refused once this hand already has
      // its one named candidate (a {T} frame can never refill around it).
      let accepted = null, fallback = null, capBlocked = false;
      for (let r = 0; r < 6 && !accepted; r++) {
        const filled = fillFrameFromGen(frames[fi], state);
        if (!filled.bar || out.includes(filled.bar) || exclude.has(filled.bar) || seen.has(filled.bar)) continue;
        if (topicNamed && namesTopic(filled.bar, state.bank.topicName)) { capBlocked = true; continue; } // one named card per hand
        if (filled.anchor && anchors.has(filled.anchor)) continue; // anchors stay split
        const syl = barSyllables(filled.bar);
        if (syl >= 8 && syl <= 14) accepted = filled;
        else if (!fallback) fallback = filled;
      }
      const chosen = accepted || fallback;
      if (!chosen) {
        // A frame turned away ONLY by the {T} cap was never really dealt:
        // hold it (out of this cycle's picks, released at the reshuffle)
        // instead of spending it, so a later hand can still use it as
        // its one named card. (Frames rejected for any other reason stay
        // spent — that is what keeps dead one-bar frames from stalling
        // the pool.)
        if (capBlocked && frames[fi].includes('{T}')) {
          state.usedFrames[poolKey].delete(fi);
          state.heldFrames[poolKey].add(fi);
          state.heldEverFrames[poolKey].add(fi);
        }
        continue;
      }
      if (namesTopic(chosen.bar, state.bank.topicName)) topicNamed = true;
      out.push(chosen.bar); seen.add(chosen.bar);
      if (chosen.anchor) anchors.add(chosen.anchor);
      state.dealt.push({ pool: poolKey, frame: frames[fi], bar: chosen.bar, anchor: chosen.anchor });
      // A shared (framesAny) frame spent in one pool is spent for the whole
      // session: mark it in the other pool too (the shared frames sit at the
      // same indices in both pools). Its slot-free bars would be exact
      // session duplicates anyway, and the other pool shouldn't burn picks
      // discovering that.
      if (fi < (pack.framesAny || []).length)
        state.usedFrames[poolKey === 'hook' ? 'verse' : 'hook'].add(fi);
    }
    return out;
  }

  const rng = opts.rng || Math.random;
  const topic = getTopic(pack, topicName);
  const bank = effectiveBank(pack, topic);
  const out = [], usedFrames = new Set();
  let attempts = 0;
  while (out.length < 3 && attempts < 90) {
    attempts++;
    let fi = Math.floor(rng() * frames.length);
    if (usedFrames.has(fi) && attempts < 45) continue;
    usedFrames.add(fi);
    const bar = fillFrame(frames[fi], bank, rng);
    if (!bar || out.includes(bar) || exclude.has(bar)) continue;
    const syl = barSyllables(bar);
    if (syl >= 8 && syl <= 14) out.push(bar);
    else if (attempts > 60) out.push(bar); // range is a target, not a wall
  }
  return out;
}

// ---------- Challenges ----------
// Dealt onto bars 5, 10, 15, 20. Countable checks return true/false from
// checkChallenge; the rest return null and ride on the honor system
// (self-attest checkbox in the client).
const CHALLENGE_DEFS = [
  { id: 'syllables', name: 'SYLLABLE LOCK', deal(rng) { const n = 10 + Math.floor(rng() * 4); return { check: { kind: 'syllables', n }, text: `Land exactly ${n} syllables in this bar. Count them out.` }; } },
  { id: 'startswith', name: 'FIRST WORD', deal(rng) { const words = ['and', 'but', 'still', 'so', 'look', 'yeah']; const word = words[Math.floor(rng() * words.length)]; return { check: { kind: 'startsWith', word }, text: `Start the bar with the word "${word}". No warm-up words before it.` }; } },
  { id: 'question', name: 'END ON A QUESTION', deal() { return { check: { kind: 'question' }, text: 'The bar has to end on a question. Make the room answer it.' }; } },
  { id: 'newend', name: 'FRESH ENDING', deal() { return { check: { kind: 'newEnd' }, text: "End on a different word than your last bar ended on. No repeats at the tail." }; } },
  { id: 'noi', name: 'NO "I" IN IT', deal() { return { check: { kind: 'noI' }, text: 'Write the whole bar without the word "I". The scene talks, not you.' }; } },
  { id: 'topicword', name: 'SAY THE TOPIC', deal(rng, ctx) { const w = ctx && ctx.topicKey ? ctx.topicKey : ''; return { check: { kind: 'containsWord', word: w }, text: `Name the topic outright — the word "${w}" has to appear in the bar.` }; } },
  { id: 'talkto', name: 'TALK TO THEM', deal() { return { check: { kind: 'containsWord', word: 'you' }, text: 'Talk straight to somebody — the bar has to speak to a "you".' }; } },
  { id: 'internal', name: 'INTERNAL RHYME', deal() { return { check: null, text: 'Land at least two rhymes INSIDE the bar, not just at the end.' }; } },
  { id: 'place', name: 'NAME A PLACE', deal() { return { check: null, text: 'Name one specific real place in this bar — a street, a town, a store, your block.' }; } },
  { id: 'senses', name: 'SENSE CHECK', deal() { return { check: null, text: 'Put a sound AND a smell or a touch in this bar. Make the room feel it.' }; } },
];
function dealChallenge(rng, ctx = {}) {
  const r = rng || Math.random;
  const def = CHALLENGE_DEFS[Math.floor(r * CHALLENGE_DEFS.length)];
  const inst = def.deal(r, ctx);
  return { id: def.id, name: def.name, text: inst.text, check: inst.check };
}
function makeChallenge(id, rng, ctx = {}) {
  const def = CHALLENGE_DEFS.find(d => d.id === id);
  if (!def) return null;
  const inst = def.deal(rng || Math.random, ctx);
  return { id: def.id, name: def.name, text: inst.text, check: inst.check };
}
// true = passed, false = failed, null = can't be counted (honor system).
function checkChallenge(challenge, bar, prevBar) {
  if (!challenge || !challenge.check) return null;
  const c = challenge.check, text = String(bar || '');
  if (c.kind === 'syllables') return barSyllables(text) === c.n;
  if (c.kind === 'startsWith') {
    const first = text.trim().toLowerCase().replace(/^[^a-z]+/, '').split(/\s+/)[0] || '';
    return first === c.word;
  }
  if (c.kind === 'question') return text.trim().endsWith('?');
  if (c.kind === 'newEnd') {
    if (!prevBar) return true;
    const a = endWord(text), b = endWord(prevBar);
    return !!a && a !== b;
  }
  if (c.kind === 'noI') return !/\bi\b/i.test(text);
  if (c.kind === 'containsWord') {
    if (!c.word) return null;
    return new RegExp(`\\b${c.word.replace(/[^a-z0-9' ]/gi, '')}\\b`, 'i').test(text);
  }
  return null;
}

// ---------- Session shapes ----------
// hook: 8 hook bars. verse: 8 verse bars. song: 4 hook + 8 verse + reprise
// (the 4 hook bars return; the writer may swap ONE) + 8 verse-2 bars = 20
// bars in the finished song. Challenges land on bars 5, 10, 15, 20.
function sessionPlan(shape) {
  const every5 = (n) => { const out = []; for (let i = 5; i <= n; i += 5) out.push(i); return out; };
  if (shape === 'hook') return { shape, label: 'Hook session', totalBars: 8, sections: Array(8).fill('hook'), repriseAt: 0, challengeBars: every5(8) };
  if (shape === 'verse') return { shape, label: 'Verse session', totalBars: 8, sections: Array(8).fill('verse'), repriseAt: 0, challengeBars: every5(8) };
  return {
    shape: 'song', label: 'Full song', totalBars: 20,
    sections: [...Array(4).fill('hook'), ...Array(8).fill('verse'), ...Array(8).fill('verse 2')],
    repriseAt: 12, challengeBars: every5(20),
  };
}
// Swap one hook bar inside a finished/in-progress song array (indices 0..3).
function applyReprise(songBars, hookIndex, newBar) {
  const out = [...songBars];
  if (hookIndex >= 0 && hookIndex < 4 && hookIndex < out.length) out[hookIndex] = newBar;
  return out;
}

// ---------- Scoring ----------
// Weights, printed on the card so the total is visibly just the sum:
// syllable steadiness 25 · end-rhyme matching 25 · topic discipline 20 ·
// challenges 20 · completion 10.
const DRILLS = {
  syllables: { name: 'METRONOME BARS', text: 'Write 8 bars at exactly 11 syllables each. Count on your fingers like a drummer until it stops feeling like math.' },
  rhyme: { name: 'RHYME FAMILY TREE', text: 'Pick one end word. Write 8 bars that all end inside its rhyme family — same tail sound, different words.' },
  topic: { name: 'TOPIC TAPE', text: "Write 8 bars where every single bar names the topic or one of its images. If a bar could be about anything, it doesn't count." },
  challenges: { name: 'CONSTRAINT ROUNDS', text: 'Run a verse session and take every challenge cold — no re-deals, no skipping. Constraints are sparring partners.' },
  completion: { name: 'FINISH THE ROOM', text: 'Run a full-song session start to finish in one sitting. A finished draft beats a perfect fragment.' },
};
function scoreSong(input) {
  const bars = (input.bars || []).map(b => typeof b === 'string' ? { text: b, section: '' } : b);
  const planned = input.planned || bars.length || 1;
  const words = input.topicWords || [];
  const syls = bars.map(b => barSyllables(b.text));
  const mean = syls.length ? syls.reduce((a, b) => a + b, 0) / syls.length : 0;
  const spread = syls.length ? syls.reduce((a, s) => a + Math.abs(s - mean), 0) / syls.length : 0;
  const steadiness = Math.max(0, Math.round(25 * (1 - spread / 4)));

  const ends = bars.map(b => endWord(b.text));
  const keys = ends.map(rhymeKey);
  const keyCount = {};
  keys.forEach(k => { if (k) keyCount[k] = (keyCount[k] || 0) + 1; });
  const rhymed = keys.map(k => k && keyCount[k] >= 2);
  const rhymeDensity = bars.length ? rhymed.filter(Boolean).length / bars.length : 0;
  const rhymeScore = Math.round(25 * rhymeDensity);

  const onTopic = bars.map(b => words.length ? barOnTopic(b.text, words) : false);
  const topicPct = bars.length ? onTopic.filter(Boolean).length / bars.length : 0;
  const topicScore = Math.round(20 * topicPct);

  const ch = input.challenges || { dealt: 0, passed: 0 };
  const challengeScore = ch.dealt ? Math.round(20 * (ch.passed / ch.dealt)) : 20;
  const completionScore = Math.round(10 * Math.min(1, bars.length / planned));

  // Per-bar quality from the same three measures: close to the song's own
  // syllable average, ends in a rhyme family, carries the topic.
  const quality = bars.map((b, i) => {
    const close = 1 - Math.min(1, Math.abs(syls[i] - mean) / 6);
    return close * 0.5 + (rhymed[i] ? 0.3 : 0) + (onTopic[i] ? 0.2 : 0);
  });
  const idxOf = (wantMax) => bars.reduce((best, b, i) => (wantMax ? quality[i] > quality[best] : quality[i] < quality[best]) ? i : best, 0);
  const reason = (i, strong) => {
    const bits = [];
    bits.push(`${syls[i]} syllables${Math.abs(syls[i] - mean) <= 1 ? ", dead on the song's average (" + Math.round(mean) + ')' : `, off the song's average of ${Math.round(mean)}`}`);
    bits.push(rhymed[i] ? `ends "${ends[i]}" inside a rhyme family that runs through the song` : `ends "${ends[i]}", a tail sound nothing else in the song answers`);
    bits.push(onTopic[i] ? 'names the topic or its imagery outright' : 'never touches the topic or its imagery');
    return (strong ? 'Strongest because it ' : 'Weakest because it ') + bits.join(' · ') + '.';
  };
  const strongestI = bars.length ? idxOf(true) : -1;
  const weakestI = bars.length ? idxOf(false) : -1;

  const measures = { syllables: steadiness, rhyme: rhymeScore, topic: topicScore, challenges: challengeScore, completion: completionScore };
  const weakestKey = Object.entries(measures).sort((a, b) => (a[1] / ({ syllables: 25, rhyme: 25, topic: 20, challenges: 20, completion: 10 }[a[0]])) - (b[1] / ({ syllables: 25, rhyme: 25, topic: 20, challenges: 20, completion: 10 }[b[0]])))[0][0];
  return {
    total: steadiness + rhymeScore + topicScore + challengeScore + completionScore,
    measures,
    syllables: { mean: Math.round(mean * 10) / 10, spread: Math.round(spread * 10) / 10, perBar: syls },
    rhyme: { density: Math.round(rhymeDensity * 100) / 100, rhymedCount: rhymed.filter(Boolean).length },
    topic: { pct: Math.round(topicPct * 100) / 100, onTopicCount: onTopic.filter(Boolean).length },
    challenges: { dealt: ch.dealt, passed: ch.passed },
    completion: { locked: bars.length, planned },
    strongest: strongestI >= 0 ? { index: strongestI, bar: bars[strongestI].text, reason: reason(strongestI, true) } : null,
    weakest: weakestI >= 0 ? { index: weakestI, bar: bars[weakestI].text, reason: reason(weakestI, false) } : null,
    drill: DRILLS[weakestKey],
    perBar: bars.map((b, i) => ({ index: i, text: b.text, section: b.section || '', syllables: syls[i], endWord: ends[i], rhymed: !!rhymed[i], onTopic: !!onTopic[i] })),
  };
}

// ---------- Copy-out format (same shape as the 4h verse footer) ----------
function formatSongText(input) {
  const bars = input.bars || [];
  const head = [
    `${input.shapeLabel || 'Trainer session'} — BAR NONE Trainer`,
    `Tone: ${input.packLabel || ''} · Topic: ${input.topicName || ''}`,
    '',
  ];
  const lines = [];
  let lastSection = null;
  bars.forEach((b, i) => {
    const sec = typeof b === 'string' ? '' : (b.section || '');
    if (sec && sec !== lastSection) { lines.push('', sec.toUpperCase()); lastSection = sec; }
    lines.push(`${i + 1}. ${typeof b === 'string' ? b : b.text}`);
  });
  return head.join('\n') + lines.join('\n') +
    '\n\nWritten in the BAR NONE Trainer · Underground Write Club — play free: https://bar-none.onrender.com';
}

const TrainerCore = {
  TONE_PACKS, bankMeta: BANK_META, CHALLENGE_DEFS, DRILLS,
  countSyllables, barSyllables, endWord, rhymeKey, mulberry32,
  getPack, getTopic, effectiveBank, flatBank, namesTopic, topicWords, barOnTopic,
  newSessionGen, generateCandidates, dealChallenge, makeChallenge, checkChallenge,
  sessionPlan, applyReprise, scoreSong, formatSongText,
};
if (typeof window !== 'undefined') window.BarNoneTrainer = TrainerCore;
if (typeof module !== 'undefined') module.exports = TrainerCore;

// ---------- Beat source state ----------
// Two sources: 'club' (the built-in looping board) or 'mine' (the writer's
// own uploaded instrumental). The file itself never leaves the device — the
// DOM layer holds the object URL; core only tracks the choice, the file
// meta, loop and BPM. BPM is display/session-notes only in v1: no beat
// detection is attempted and nothing pretends otherwise.
const BEAT_FILE_EXTS = ['mp3', 'wav', 'm4a', 'ogg'];
function beatFileOk(name) {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || '').trim());
  return !!m && BEAT_FILE_EXTS.includes(m[1].toLowerCase());
}
function createBeatState() {
  return { source: 'club', loop: true, bpm: null, fileName: '', ready: false, error: '' };
}
function setBeatFile(state, file) {
  if (!file || !beatFileOk(file.name))
    return { ...state, ready: false, error: "That file type won't play — use an mp3, wav, m4a, or ogg." };
  return { ...state, ready: true, fileName: file.name, error: '' };
}
function selectBeatSource(state, source) {
  if (source === 'mine' && !state.ready)
    return { ...state, source: 'club', error: 'Pick an instrumental file first — the club beat stays on till then.' };
  return { ...state, source: source === 'mine' ? 'mine' : 'club', error: '' };
}
function setBeatLoop(state, loop) { return { ...state, loop: !!loop }; }
function setBeatBpm(state, raw) {
  const n = parseInt(raw, 10);
  return { ...state, bpm: Number.isFinite(n) && n >= 40 && n <= 240 ? n : null };
}
Object.assign(TrainerCore, { BEAT_FILE_EXTS, beatFileOk, createBeatState, setBeatFile, selectBeatSource, setBeatLoop, setBeatBpm });
