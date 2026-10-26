// Unit tests for the beat logic (public/audio.js).
const assert = require('assert');
const { hitsAtStep, tempoFor } = require('../public/audio.js');

const kick = { name: 'K', hits: [{ s: 0, n: null, l: 1, v: 0.9 }, { s: 16, n: null, l: 1, v: 0.9 }] };
const snare = { name: 'S', hits: [{ s: 4, n: null, l: 1, v: 0.9 }] };
const board = { KICK: kick, SNARE: snare };

// plain playback
assert.deepStrictEqual(hitsAtStep(board, null, 0).map(h => h.cat), ['KICK']);
assert.deepStrictEqual(hitsAtStep(board, null, 4).map(h => h.cat), ['SNARE']);
assert.deepStrictEqual(hitsAtStep(board, null, 1), []);
// MUTE silences its target only
assert.deepStrictEqual(hitsAtStep(board, { name: 'MUTE', detail: 'KICK' }, 0), []);
assert.deepStrictEqual(hitsAtStep(board, { name: 'MUTE', detail: 'KICK' }, 4).map(h => h.cat), ['SNARE']);
// BREAKDOWN keeps only its target
assert.deepStrictEqual(hitsAtStep(board, { name: 'BREAKDOWN', detail: 'SNARE' }, 0), []);
assert.deepStrictEqual(hitsAtStep(board, { name: 'BREAKDOWN', detail: 'SNARE' }, 4).map(h => h.cat), ['SNARE']);
// REVERSE mirrors the target's steps (kick hit at 0 sounds at 63, at 16 -> 47)
assert.deepStrictEqual(hitsAtStep(board, { name: 'REVERSE', detail: 'KICK' }, 63).map(h => h.cat), ['KICK']);
assert.deepStrictEqual(hitsAtStep(board, { name: 'REVERSE', detail: 'KICK' }, 47).map(h => h.cat), ['KICK']);
assert.deepStrictEqual(hitsAtStep(board, { name: 'REVERSE', detail: 'KICK' }, 0), []);
// BEAT FLIP swaps patterns between the first two categories
const flipped0 = hitsAtStep(board, { name: 'BEAT FLIP' }, 0);
assert.ok(flipped0.length === 1, 'flip still plays a hit at step 0');
// tempo map
assert.strictEqual(tempoFor(null), 92);
assert.strictEqual(tempoFor({ name: 'DOUBLE TIME' }), 184);
assert.strictEqual(tempoFor({ name: 'HALF TIME' }), 46);
console.log('AUDIO LOGIC OK — mute/breakdown/reverse/flip/tempo all behave');
