// Engine test: drives a real 2-player match through the socket API.
// Server must be running with fast timers (BN_DECIDE_MS=600 BN_WRITE_MS=800 BN_DISCARD_MS=400).
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function mkClient(name) {
  const c = { name, socket: io(URL), state: null, hand: [], drawn: null };
  c.socket.on('state', s => c.state = s);
  c.socket.on('hand', h => { c.hand = h.hand; c.drawn = h.drawnSound; });
  c.ready = new Promise(r => c.socket.on('connect', () => { c.id = c.socket.id; r(); }));
  return c;
}

(async () => {
  const A = mkClient('Nate'), B = mkClient('TestMC');
  await Promise.all([A.ready, B.ready]);
  const created = await new Promise(r => A.socket.emit('create_room', { name: 'Nate' }, r));
  if (!created.ok) fail('create_room');
  const joined = await new Promise(r => B.socket.emit('join_room', { name: 'TestMC', code: created.code }, r));
  if (!joined.ok) fail('join_room');
  const started = await new Promise(r => A.socket.emit('start_match', r));
  if (!started.ok) fail('start_match');
  await wait(300);

  // --- setup assertions ---
  const s0 = A.state;
  if (!s0 || s0.phase !== 'playing') fail('not playing');
  if (Object.keys(s0.activeSounds).length !== 3) fail('setup must activate exactly 3 sound categories, got ' + Object.keys(s0.activeSounds).length);
  const opener = s0.turn.playerId === A.id ? A : B, other = s0.turn.playerId === A.id ? B : A;
  if (opener.hand.length !== 5 || other.hand.length !== 4) fail('opening hands must be 5 (opener, after turn draw) / 4, got ' + A.hand.length + '/' + B.hand.length);
  if (!opener.drawn) fail('opener must hold a drawn sound card');
  console.log('setup OK: 3 categories live —', Object.keys(s0.activeSounds).join(', '), '| hands 5/4 (opener drew)');

  // --- drive the match ---
  let submitted = 0, frozenSeen = 0, turns = 0, writingRounds = 0;
  const seenVerseCounts = () => A.state.players.map(p => p.bars);
  const deadline = Date.now() + 90000;
  let lastTurnKey = '';
  while (Date.now() < deadline) {
    const st = A.state;
    if (!st || st.phase === 'finished') break;
    if (!st.turn) { await wait(100); continue; }
    const key = st.turn.playerId + ':' + st.turn.stage + ':' + st.players.map(p => p.bars).join(',');
    if (key === lastTurnKey) { await wait(80); continue; }
    lastTurnKey = key;
    const me = st.turn.playerId === A.id ? A : B;
    if (st.turn.stage === 'sound') {
      turns++;
      if (!me.drawn) fail('current player has no drawn sound card at sound stage');
      me.socket.emit('sound_decision', { play: turns % 2 === 1 });
    } else if (st.turn.stage === 'action') {
      const bar = me.hand.find(c => c.type === 'bar');
      if (bar) me.socket.emit('play_card', { cardId: bar.id }, () => {});
      else me.socket.emit('end_turn');
    } else if (st.turn.stage === 'writing') {
      writingRounds++;
      if (writingRounds === 1) { me.socket.emit('submit_bar', { text: 'sirens in the rearview, cold blood in the cassette deck' }); submitted++; }
      // later writing rounds: stay silent -> timeout must lock a frozen bar
    } else if (st.turn.stage === 'discard') {
      const excess = me.hand.length - 4;
      if (excess > 0) me.socket.emit('discard_cards', { ids: me.hand.slice(0, excess).map(c => c.id) });
    }
    await wait(120);
    const counts = seenVerseCounts();
    const total = counts.reduce((a, b) => a + b, 0);
    const anyFrozen = A.state.players.some(p => p.verse.some(v => v.frozen));
    if (anyFrozen) frozenSeen = 1;
    if (submitted >= 1 && frozenSeen && turns >= 6 && total >= 2) break;
  }
  const st = A.state;
  if (!submitted) fail('no bar was ever submitted');
  if (!frozenSeen) fail('writing timeout never produced a frozen bar');
  console.log(`engine OK: turns=${turns} verses=${st.players.map(p => p.bars).join('/')} frozen bar observed, match still advancing`);
  process.exit(0);
})().catch(e => fail(e.message));
