'use strict';
// BAR NONE — authoritative game server. Rules: DECISIONS.md. Cards: data/cards.js.
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { buildActionDeck, buildSoundDeck, FLOW_CHALLENGES } = require('./data/cards');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));

const MAX_PLAYERS = 4;
const HAND_LIMIT = 4;
const VERSE_TARGET = Number(process.env.BN_VERSE_TARGET || 8);
const T = {
  decide: Number(process.env.BN_DECIDE_MS || 15000),
  write: Number(process.env.BN_WRITE_MS || 45000),
  discard: Number(process.env.BN_DISCARD_MS || 10000),
  vote: Number(process.env.BN_VOTE_MS || 60000),
};
const rooms = new Map();
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size }));

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
function makeCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 4 }, () => chars[rnd(chars.length)]).join(''); } while (rooms.has(code));
  return code;
}
function drawFrom(deck, discardPile) {
  if (!deck.length) { deck.push(...discardPile.splice(0)); for (let i = deck.length - 1; i > 0; i--) { const j = rnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
  return deck.pop() || null;
}
const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };

// ---------- state ----------
function newPlayer(id, name, streak) {
  return { id, name, streak: Number(streak) || 0, connected: true, hand: [], verse: [], shield: false, drawnSound: null, draft: '',
    pendingReqs: [], pendingUpgrade: false, turnExtraTime: 0, playedBar: false, playedTactical: false, currentPrompt: null };
}
function log(room, msg) { room.log.push(msg); if (room.log.length > 30) room.log.shift(); }

function publicState(room) {
  return {
    code: room.code, phase: room.phase, hostId: room.hostId, direction: room.direction,
    players: room.players.map(p => ({ id: p.id, name: p.name, streak: p.streak, bars: p.verse.length, handCount: p.hand.length, shield: p.shield, connected: p.connected, verse: p.verse })),
    matchId: room.matchId || 0,
    voting: room.phase === 'voting' ? { votedIds: Object.keys(room.votes || {}), deadline: room.deadline } : null,
    results: room.results || null,
    turn: room.turn ? { playerId: room.turn.playerId, stage: room.turn.stage, deadline: room.deadline, prompt: (room.players.find(p => p.id === room.turn.playerId) || {}).currentPrompt || null } : null,
    activeSounds: Object.fromEntries(Object.entries(room.activeSounds).map(([c, card]) => [c, { name: card.name, difficulty: card.difficulty, hits: card.hits }])),
    beat: room.beat || null,
    boardFx: room.boardFx, log: room.log.slice(-8),
    decks: { action: room.actionDeck.length, sound: room.soundDeck.length },
    winner: room.winner || null,
  };
}
function sendHands(room) {
  for (const p of room.players) io.to(p.id).emit('hand', { hand: p.hand, drawnSound: p.drawnSound });
}
function broadcast(room) { io.to(room.code).emit('state', publicState(room)); sendHands(room); }
function sync(room) { broadcast(room); }

// ---------- turn engine ----------
function setTimer(room, ms, fn) {
  clearTimeout(room.timer);
  room.deadline = Date.now() + ms;
  room.timer = setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, ms);
}
function cur(room) { return room.players[room.turnIndex]; }

function startMatch(room) {
  room.actionDeck = buildActionDeck(); room.actionDiscard = [];
  room.soundDeck = buildSoundDeck(); room.soundDiscard = [];
  room.activeSounds = {}; room.boardFx = null; room.winner = null; room.finalTurnsLeft = null;
  room.votes = {}; room.results = null; room.finishSeq = []; room.matchId = (room.matchId || 0) + 1;
  for (const p of room.players) { p.hand = []; p.verse = []; for (let i = 0; i < HAND_LIMIT; i++) p.hand.push(drawFrom(room.actionDeck, room.actionDiscard)); }
  // setup: 3 distinct sound categories; set-asides go to the bottom of the deck afterwards
  const aside = [];
  let guard = 0;
  while (Object.keys(room.activeSounds).length < 3 && guard++ < 200) {
    const c = drawFrom(room.soundDeck, room.soundDiscard);
    if (!c) break;
    if (c.type === 'sound' && !room.activeSounds[c.category]) room.activeSounds[c.category] = c;
    else aside.push(c);
  }
  room.soundDeck = [...aside, ...room.soundDeck];
  // Best current win streak opens (blueprint rule); random among tied streaks.
  const topStreak = Math.max(...room.players.map(p => p.streak));
  const candidates = room.players.map((p, i) => [p, i]).filter(([p]) => p.streak === topStreak);
  room.turnIndex = pick(candidates)[1];
  room.beat = { bpm: 92, startAt: Date.now() + 1500 }; // clients align their step clocks to this epoch
  room.phase = 'playing';
  log(room, `Match started. ${cur(room).name} opens${topStreak > 0 ? ` (streak ${topStreak})` : ''}.`);
  startTurn(room);
}

function startTurn(room) {
  const p = cur(room);
  room.turn = { playerId: p.id, stage: 'sound' };
  p.playedBar = false; p.playedTactical = false; p.currentPrompt = null; p.draft = '';
  p.drawnSound = drawFrom(room.soundDeck, room.soundDiscard);
  const bonus = drawFrom(room.actionDeck, room.actionDiscard);
  if (bonus) p.hand.push(bonus);
  log(room, `${p.name}'s turn.`);
  tickBoardFx(room);
  setTimer(room, T.decide, () => { // timeout: random legal resolution
    if (room.turn && room.turn.stage === 'sound') resolveSound(room, Math.random() < 0.5);
  });
  sync(room);
}

function tickBoardFx(room) {
  if (room.boardFx) { room.boardFx.turnsLeft--; if (room.boardFx.turnsLeft <= 0) { log(room, `${room.boardFx.name} wears off.`); room.boardFx = null; } }
}
function setBoardFx(room, name, detail) { room.boardFx = { name, detail: detail || null, turnsLeft: 8 }; }

function resolveSound(room, playIt) {
  const p = cur(room);
  const card = p.drawnSound; p.drawnSound = null;
  if (card && playIt) {
    if (card.type === 'sound') {
      const replaced = room.activeSounds[card.category];
      room.activeSounds[card.category] = card;
      log(room, `${p.name} plays ${card.name} (${card.category})${replaced ? `, replacing ${replaced.name}` : ''}.`);
    } else if (card.type === 'manipulation') {
      applyManipulation(room, p, card);
    }
    const bonus = drawFrom(room.actionDeck, room.actionDiscard);
    if (bonus) p.hand.push(bonus);
  } else if (card) {
    room.soundDiscard.push(card);
    log(room, `${p.name} bins the sound card.`);
  }
  room.turn.stage = 'action';
  setTimer(room, T.decide, () => { if (room.turn && room.turn.stage === 'action') endActionPhase(room); });
  sync(room);
}

function applyManipulation(room, p, card) {
  const cats = Object.keys(room.activeSounds);
  switch (card.fx) {
    case 'doubleTime': setBoardFx(room, 'DOUBLE TIME'); break;
    case 'halfTime': setBoardFx(room, 'HALF TIME'); break;
    case 'reverse': setBoardFx(room, 'REVERSE', pick(cats)); break;
    case 'mute': setBoardFx(room, 'MUTE', pick(cats)); break;
    case 'glitch': setBoardFx(room, 'GLITCH'); break;
    case 'beatFlip': setBoardFx(room, 'BEAT FLIP'); break;
    case 'breakdown': setBoardFx(room, 'BREAKDOWN', pick(cats)); break;
    case 'wildSound': {
      const others = ['DOUBLE TIME', 'HALF TIME', 'REVERSE', 'MUTE', 'GLITCH', 'BEAT FLIP', 'BREAKDOWN'];
      const name = pick(others);
      setBoardFx(room, name, ['REVERSE', 'MUTE', 'BREAKDOWN'].includes(name) ? pick(cats) : null);
      log(room, `WILDCARD AUDIO fires as ${name}.`);
      return;
    }
  }
  log(room, `${p.name} drops ${card.name} on the beat.`);
}

function endActionPhase(room) {
  const p = cur(room);
  if (p.currentPrompt) beginWriting(room);
  else finishTurn(room);
}

function beginWriting(room) {
  const p = cur(room);
  room.turn.stage = 'writing';
  const ms = T.write + (p.turnExtraTime || 0) * 1000;
  p.turnExtraTime = 0;
  setTimer(room, ms, () => { if (room.turn && room.turn.stage === 'writing') submitBar(room, p, p.draft || '', true); });
  sync(room);
}

function submitBar(room, p, text, auto) {
  const frozen = !text || !text.trim();
  p.verse.push({ prompt: p.currentPrompt, text: frozen ? '' : text.trim(), frozen, reqs: [...p.pendingReqs] });
  p.pendingReqs = [];
  log(room, frozen ? `${p.name} froze — bar locked empty.` : `${p.name} locks bar ${p.verse.length}.`);
  p.currentPrompt = null;
  if (p.verse.length >= VERSE_TARGET && !room.finishSeq.includes(p.id)) room.finishSeq.push(p.id);
  if (p.verse.length >= VERSE_TARGET && room.finalTurnsLeft === null) {
    room.finalTurnsLeft = room.players.length - 1;
    log(room, `${p.name} hit 8 bars — final round!`);
  }
  finishTurn(room);
}

function finishTurn(room) {
  const p = cur(room);
  if (p.hand.length > HAND_LIMIT) {
    room.turn.stage = 'discard';
    setTimer(room, T.discard, () => {
      if (room.turn && room.turn.stage === 'discard') {
        while (p.hand.length > HAND_LIMIT) room.actionDiscard.push(p.hand.splice(rnd(p.hand.length), 1)[0]);
        log(room, `${p.name} times out discarding — random cards dropped.`);
        advance(room);
      }
    });
    sync(room);
    return;
  }
  advance(room);
}

function advance(room) {
  clearTimeout(room.timer);
  if (room.finalTurnsLeft !== null) {
    if (room.finalTurnsLeft <= 0) return finishMatch(room);
    room.finalTurnsLeft--;
  }
  const n = room.players.length;
  room.turnIndex = ((room.turnIndex + room.direction) % n + n) % n;
  startTurn(room);
}

function finishMatch(room) {
  room.phase = 'voting'; room.turn = null; room.votes = {};
  log(room, 'Verses on the table — the room votes. No voting for yourself.');
  setTimer(room, T.vote, () => { if (room.phase === 'voting') tallyVotes(room); });
  sync(room);
}

function tallyVotes(room) {
  clearTimeout(room.timer);
  const counts = Object.fromEntries(room.players.map(p => [p.id, 0]));
  for (const target of Object.values(room.votes)) if (counts[target] !== undefined) counts[target]++;
  const max = Math.max(...Object.values(counts));
  let tied = room.players.filter(p => counts[p.id] === max);
  if (tied.length > 1) { // tie -> whoever finished their verse first
    const byFinish = tied.filter(p => room.finishSeq.includes(p.id))
      .sort((a, b) => room.finishSeq.indexOf(a.id) - room.finishSeq.indexOf(b.id));
    if (byFinish.length) tied = [byFinish[0]];
  }
  if (tied.length > 1) tied.sort((a, b) => b.verse.length - a.verse.length);
  const winner = tied[0];
  room.winner = winner.id;
  room.results = { counts, winnerId: winner.id };
  room.phase = 'finished';
  log(room, `${winner.name} takes the room (${counts[winner.id]} vote${counts[winner.id] === 1 ? '' : 's'}).`);
  sync(room);
}

// ---------- tactical effects ----------
function applyTactical(room, actor, card, targetId, discardId) {
  const target = room.players.find(p => p.id === targetId) || null;
  if (card.targeted) {
    if (!target || target.id === actor.id) return 'Pick another player as target';
    if (target.shield) { target.shield = false; log(room, `${target.name}'s shield eats ${card.name}.`); return null; }
  }
  switch (card.fx) {
    case 'draw': for (let i = 0; i < (card.n || 1); i++) { const c = drawFrom(room.actionDeck, room.actionDiscard); if (c) actor.hand.push(c); } break;
    case 'swapCard': {
      const idx = actor.hand.findIndex(c => c.id === discardId);
      if (idx < 0) return 'Choose a card to discard for the swap';
      room.actionDiscard.push(actor.hand.splice(idx, 1)[0]);
      const c = drawFrom(room.actionDeck, room.actionDiscard); if (c) actor.hand.push(c);
      break;
    }
    case 'extraTime': actor.turnExtraTime += card.sec || 20; break;
    case 'shield': actor.shield = true; break;
    case 'cleanse': actor.pendingReqs = []; actor.pendingUpgrade = false; break;
    case 'upgradePrompt': target.pendingUpgrade = true; log(room, `${target.name}'s next prompt just got harder.`); break;
    case 'attachReq': {
      const req = card.reqOverride ? FLOW_CHALLENGES.find(f => f.name === card.reqOverride) : pick(FLOW_CHALLENGES);
      target.pendingReqs.push(`${req.name}: ${req.req}`); log(room, `${target.name}'s next bar carries ${req.name}.`);
      break;
    }
    case 'swapBarCard': {
      const mine = actor.hand.filter(c => c.type === 'bar'), theirs = target.hand.filter(c => c.type === 'bar');
      if (!mine.length || !theirs.length) { log(room, `${card.name} fizzles — no bar cards to swap.`); break; }
      const a = pick(mine), b = pick(theirs);
      actor.hand[actor.hand.indexOf(a)] = b; target.hand[target.hand.indexOf(b)] = a;
      log(room, `${actor.name} jacked a bar card from ${target.name}.`);
      break;
    }
    case 'stealCard': if (target.hand.length) actor.hand.push(target.hand.splice(rnd(target.hand.length), 1)[0]); break;
    case 'forceDiscard': if (target.hand.length) room.actionDiscard.push(target.hand.splice(rnd(target.hand.length), 1)[0]); break;
    case 'randomSound': {
      const cats = Object.keys(room.activeSounds); if (!cats.length) break;
      const cat = pick(cats); let drawn = null, guard = 0;
      while (guard++ < 60) { const c = drawFrom(room.soundDeck, room.soundDiscard); if (!c) break; if (c.type === 'sound') { drawn = c; break; } room.soundDiscard.push(c); }
      if (drawn) { room.activeSounds[cat] = drawn; log(room, `The ${cat} gets hijacked: ${drawn.name}.`); }
      break;
    }
    case 'wildSound': applyManipulation(room, actor, { name: 'WILDCARD AUDIO', fx: 'wildSound' }); break;
    case 'flowSelf': actor.pendingReqs.push(`${card.name}: ${card.req}`); log(room, `${actor.name} takes on ${card.name} for the next bar.`); break;
  }
  return null;
}

// ---------- sockets ----------
io.on('connection', (socket) => {
  let room = null, player = null;
  const me = () => player;
  const myTurn = () => room && room.turn && room.turn.playerId === socket.id;

  socket.on('create_room', ({ name, streak }, cb) => {
    const code = makeCode();
    room = { code, phase: 'lobby', hostId: socket.id, players: [], turnIndex: 0, direction: 1, turn: null, log: [], timer: null, deadline: 0, activeSounds: {}, boardFx: null, actionDeck: [], actionDiscard: [], soundDeck: [], soundDiscard: [], winner: null, finalTurnsLeft: null, votes: {}, results: null, finishSeq: [], matchId: 0 };
    player = newPlayer(socket.id, String(name || 'Player').slice(0, 20), streak);
    room.players.push(player); rooms.set(code, room); socket.join(code);
    cb && cb({ ok: true, code }); sync(room);
  });

  socket.on('join_room', ({ name, code, streak }, cb) => {
    room = rooms.get(String(code || '').toUpperCase());
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.phase !== 'lobby') return cb && cb({ ok: false, error: 'Match already started' });
    if (room.players.length >= MAX_PLAYERS) return cb && cb({ ok: false, error: 'Room is full' });
    player = newPlayer(socket.id, String(name || 'Player').slice(0, 20), streak);
    room.players.push(player); socket.join(room.code);
    cb && cb({ ok: true, code: room.code }); sync(room);
  });

  socket.on('start_match', (cb) => {
    if (!room || room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Only the host starts' });
    if (room.phase !== 'lobby' && room.phase !== 'finished') return cb && cb({ ok: false, error: 'Match in progress' });
    if (room.players.length < 2) return cb && cb({ ok: false, error: 'Need at least 2 players' });
    startMatch(room);
    cb && cb({ ok: true });
  });

  socket.on('vote', ({ targetId }, cb) => {
    if (!room || room.phase !== 'voting' || !player) return cb && cb({ ok: false, error: 'No vote open' });
    if (targetId === socket.id) return cb && cb({ ok: false, error: 'No voting for yourself' });
    if (!room.players.some(p => p.id === targetId)) return cb && cb({ ok: false, error: 'Unknown player' });
    room.votes[socket.id] = targetId;
    const connected = room.players.filter(p => p.connected);
    if (connected.every(p => room.votes[p.id])) tallyVotes(room); else sync(room);
    cb && cb({ ok: true });
  });

  socket.on('streak_update', ({ streak }) => { if (player) { player.streak = Number(streak) || 0; if (room) sync(room); } });

  socket.on('sound_decision', ({ play }) => { if (myTurn() && room.turn.stage === 'sound') { clearTimeout(room.timer); resolveSound(room, !!play); } });

  socket.on('play_card', ({ cardId, targetId, discardId }, cb) => {
    if (!myTurn() || room.turn.stage !== 'action') return cb && cb({ ok: false, error: 'Not the action phase' });
    const p = me();
    const idx = p.hand.findIndex(c => c.id === cardId);
    if (idx < 0) return cb && cb({ ok: false, error: 'Card not in hand' });
    const card = p.hand[idx];
    if (card.type === 'bar') {
      if (p.playedBar) return cb && cb({ ok: false, error: 'One bar card per turn' });
      p.hand.splice(idx, 1); p.playedBar = true;
      let promptCard = card;
      if (p.pendingUpgrade) {
        p.pendingUpgrade = false;
        const better = drawBarUpgrade(room, DIFF_RANK[card.difficulty]);
        if (better) { room.actionDiscard.push(card); promptCard = better; log(room, `${p.name}'s prompt was upgraded to HARD territory: ${better.prompt}.`); }
      }
      p.currentPrompt = promptCard.prompt;
      log(room, `${p.name} takes the prompt: ${promptCard.prompt}.`);
      beginWriting(room);
      return cb && cb({ ok: true });
    }
    if (p.playedTactical) return cb && cb({ ok: false, error: 'One tactical card per turn' });
    p.hand.splice(idx, 1);
    const err = applyTactical(room, p, card, targetId, discardId);
    if (err) { p.hand.splice(idx, 0, card); return cb && cb({ ok: false, error: err }); }
    p.playedTactical = true;
    room.actionDiscard.push(card);
    log(room, `${p.name} plays ${card.name}.`);
    sync(room);
    cb && cb({ ok: true });
  });

  socket.on('draft', ({ text }) => { if (myTurn() && room.turn.stage === 'writing') me().draft = String(text || '').slice(0, 300); });
  socket.on('submit_bar', ({ text }) => { if (myTurn() && room.turn.stage === 'writing') { clearTimeout(room.timer); submitBar(room, me(), String(text || ''), false); } });
  socket.on('end_turn', () => {
    if (!myTurn()) return;
    if (room.turn.stage === 'action') { clearTimeout(room.timer); endActionPhase(room); }
    else if (room.turn.stage === 'writing') { clearTimeout(room.timer); submitBar(room, me(), me().draft || '', false); }
  });
  socket.on('discard_cards', ({ ids }) => {
    if (!myTurn() || room.turn.stage !== 'discard') return;
    const p = me();
    for (const id of ids || []) { const i = p.hand.findIndex(c => c.id === id); if (i >= 0) room.actionDiscard.push(p.hand.splice(i, 1)[0]); }
    if (p.hand.length <= HAND_LIMIT) { clearTimeout(room.timer); advance(room); } else sync(room);
  });

  socket.on('disconnect', () => {
    if (!room || !player) return;
    player.connected = false;
    if (room.phase === 'lobby') {
      room.players = room.players.filter(p => p.id !== player.id);
      if (room.hostId === player.id && room.players.length) room.hostId = room.players[0].id;
    }
    if (room.players.every(p => !p.connected)) { clearTimeout(room.timer); rooms.delete(room.code); }
    else sync(room);
  });
});

function drawBarUpgrade(room, minRank) {
  const idx = room.actionDeck.findIndex(c => c.type === 'bar' && DIFF_RANK[c.difficulty] > minRank);
  if (idx < 0) return null;
  return room.actionDeck.splice(idx, 1)[0];
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`BAR NONE server on :${PORT}`));
