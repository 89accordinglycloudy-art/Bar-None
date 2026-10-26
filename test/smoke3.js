// Voting + streak-start test. Server env: BN_VERSE_TARGET=2, fast timers, BN_VOTE_MS=8000.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function mkClient(name, streak) {
  const c = { name, socket: io(URL), state: null, hand: [], drawn: null };
  c.socket.on('state', s => c.state = s);
  c.socket.on('hand', h => { c.hand = h.hand; c.drawn = h.drawnSound; });
  c.ready = new Promise(r => c.socket.on('connect', () => { c.id = c.socket.id; r(); }));
  c.streak = streak;
  return c;
}

(async () => {
  const A = mkClient('Nate', 0), B = mkClient('TestMC', 5);
  await Promise.all([A.ready, B.ready]);
  const created = await new Promise(r => A.socket.emit('create_room', { name: 'Nate', streak: 0 }, r));
  if (!created.ok) fail('create_room');
  const joined = await new Promise(r => B.socket.emit('join_room', { name: 'TestMC', code: created.code, streak: 5 }, r));
  if (!joined.ok) fail('join_room');
  const started = await new Promise(r => A.socket.emit('start_match', r));
  if (!started.ok) fail('start_match');
  await wait(250);
  if (A.state.turn.playerId !== B.id) fail('highest streak (B=5) must open the match');
  console.log('streak-start OK: B opens on a 5-streak');

  let firstFinisher = null, lastKey = '';
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const st = A.state;
    if (!st) { await wait(80); continue; }
    if (!firstFinisher) { const f = st.players.find(p => p.bars >= 2); if (f) firstFinisher = f.id; }
    if (st.phase === 'voting') break;
    if (!st.turn) { await wait(80); continue; }
    const key = st.turn.playerId + ':' + st.turn.stage + ':' + st.players.map(p => p.bars).join(',');
    if (key === lastKey) { await wait(70); continue; }
    lastKey = key;
    const me = st.turn.playerId === A.id ? A : B;
    if (st.turn.stage === 'sound') me.socket.emit('sound_decision', { play: true });
    else if (st.turn.stage === 'action') {
      const bar = me.hand.find(c => c.type === 'bar');
      if (bar) me.socket.emit('play_card', { cardId: bar.id }, () => {});
      else me.socket.emit('end_turn');
    } else if (st.turn.stage === 'writing') me.socket.emit('submit_bar', { text: 'a bar for the vote test, written under pressure' });
    else if (st.turn.stage === 'discard') {
      const ex = me.hand.length - 4;
      if (ex > 0) me.socket.emit('discard_cards', { ids: me.hand.slice(0, ex).map(c => c.id) });
    }
    await wait(70);
  }
  if (!A.state || A.state.phase !== 'voting') fail('match never reached voting (phase=' + (A.state && A.state.phase) + ')');
  if (!firstFinisher) fail('no player finished 2 bars');
  console.log('voting phase reached; first finisher:', firstFinisher === A.id ? 'A' : 'B');

  const selfVote = await new Promise(r => A.socket.emit('vote', { targetId: A.id }, r));
  if (selfVote.ok) fail('self-vote was accepted');
  const v1 = await new Promise(r => A.socket.emit('vote', { targetId: B.id }, r));
  const v2 = await new Promise(r => B.socket.emit('vote', { targetId: A.id }, r));
  if (!v1.ok || !v2.ok) fail('cross votes rejected');
  await wait(300);
  const st = A.state;
  if (st.phase !== 'finished') fail('not finished after all votes, phase=' + st.phase);
  if (!st.results) fail('no results');
  const counts = Object.values(st.results.counts);
  if (counts.length !== 2 || counts.some(c => c !== 1)) fail('vote counts should be 1-1, got ' + JSON.stringify(st.results.counts));
  if (st.results.winnerId !== firstFinisher) fail('tie must break to the first finisher');
  console.log('VOTING OK: self-vote rejected, 1-1 tie broken to the first finisher, winner =', st.results.winnerId === A.id ? 'A' : 'B');
  process.exit(0);
})().catch(e => fail(e.message));
