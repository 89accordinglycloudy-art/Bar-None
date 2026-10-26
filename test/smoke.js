const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };
const states = { A: [], B: [] };

function client(tag) {
  const s = io(URL);
  s.on('state', st => states[tag].push(st));
  return s;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const A = client('A'), B = client('B');
  await Promise.all([new Promise(r => A.on('connect', r)), new Promise(r => B.on('connect', r))]);

  const created = await new Promise(r => A.emit('create_room', { name: 'Nate' }, r));
  if (!created.ok) fail('create_room: ' + JSON.stringify(created));
  const joined = await new Promise(r => B.emit('join_room', { name: 'TestMC', code: created.code }, r));
  if (!joined.ok) fail('join_room: ' + JSON.stringify(joined));
  await wait(200);
  let st = states.B.at(-1);
  if (!st || st.players.length !== 2) fail('B did not see 2 players');
  if (st.phase !== 'lobby') fail('phase should be lobby, got ' + st.phase);

  const bad = await new Promise(r => B.emit('start_match', r));
  if (bad.ok) fail('non-host start should be rejected');
  const started = await new Promise(r => A.emit('start_match', r));
  if (!started.ok) fail('host start: ' + JSON.stringify(started));
  await wait(200);
  st = states.A.at(-1);
  if (st.phase !== 'playing' || st.turnIndex !== 0) fail('match not playing at turn 0');

  B.emit('end_turn'); // out of turn — must be ignored
  await wait(200);
  if (states.A.at(-1).turnIndex !== 0) fail('out-of-turn end_turn was honored');
  A.emit('end_turn');
  await wait(200);
  if (states.B.at(-1).turnIndex !== 1) fail('turn did not pass to player 2');

  console.log('SMOKE OK — room', created.code, '| 2 players joined, host-only start enforced, turn order advances, out-of-turn rejected');
  process.exit(0);
})().catch(e => fail(e.message));
