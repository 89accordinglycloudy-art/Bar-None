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
  discard: Number(process.env.BN_DISCARD_MS || 10000),
  vote: Number(process.env.BN_VOTE_MS || 60000),
};
// Pace modes (playtest call, Oct 26): basement = room to read your cards;
// competition = pressure. Host picks in the lobby.
const MODES = {
  basement:    { decide: Number(process.env.BN_DECIDE_MS || 45000), write: Number(process.env.BN_WRITE_MS || 60000) },
  competition: { decide: 12000, write: 40000 },
};
const modeTimers = (room) => MODES[room.mode] || MODES.basement;
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
const DIFF_RANK = { easy: 0, happy: 0, medium: 1, absurd: 1, hard: 2 };

// ---------- Solo mode: ghost writers ----------
// Server-side bot writers so one human can play a full match alone: same
// decks, same beat, same sabotage, same vote. Bots assemble their bars from
// a template bank keyed to the prompt they drew — they are sparring partners
// (practice + learning the game + content clips), not poets.
const BRAG_BARS = [
  'I turned {P} into a headline, you are barely a footnote in it',
  '{P} is my warm-up, I do this half asleep with the rent due',
  'they study {P} in a lab somewhere and still cannot copy the recipe',
  'I made {P} look expensive, you make everything look borrowed',
  'put {P} on a shirt, I am selling merch off your favorite moment',
  'I body {P} so clean they should charge me for the cleanup',
  '{P} stepped up confident and left looking for its confidence',
  'my pen does push-ups, {P} never stood a chance on paper',
  'I turned {P} into a trophy and put it where the dust cant reach',
  'they chant {P} back at me now, I just nod like I planned it',
  'I am the plot twist in {P}, everybody else is an extra',
  '{P} wanted smoke, I brought the whole barbecue and the playlist',
  'I sign {P} in big letters, winners do not do small print',
  'call it {P}, call it light work, call it a warning to the next one',
];
const SUNNY_BARS = [
  'I flipped {P} into a block party, everybody fed, everybody dancing',
  '{P} tried to rain on me, so I brought a slip-n-slide and a speaker',
  'I put {P} in the group chat and even grandma sent fire emojis',
  'turned {P} into lemonade and sold out the whole front porch',
  'I wear {P} like a new fit on the first warm day of the year',
  '{P} showed up gloomy, I introduced it to the cookout DJ',
  'I high-fived {P} so hard the whole neighborhood woke up smiling',
  'my recipe for {P}: extra seasoning, second helpings, no bad vibes',
  'I turned {P} into a parade and let the kids lead it',
  '{P} plus a little sunshine equals a story worth retelling',
  'I planted {P} in the yard and it grew back as a fruit tree',
  'we do not dodge {P} over here, we two-step right through it',
  'I put {P} on the fridge door, right next to the good drawings',
  '{P} came with clouds, I came with a kite and nowhere to be sad',
];
const SMOOTH_BARS = [
  'I whispered {P} slow and the whole room leaned in closer',
  '{P} sounds better in a low voice with the lights down soft',
  'I let {P} breathe between the notes, patience is the perfume',
  'velvet on the tongue, {P} goes down like the last slow song',
  'I poured {P} over ice and watched the whole table go quiet',
  '{P} in cursive, signed at the bottom with a steady hand',
  'I dance with {P} in the kitchen like nobody is filming',
  'the bassline said {P} and the candles just nodded along',
  'I keep {P} pressed like a good shirt, ready for the slow ride',
  '{P} after midnight, voice low, nowhere else to be',
  'I threaded {P} through the melody till it purred back at me',
  'smooth is a strategy, {P} never even saw the hook coming',
  'I served {P} warm with the good glasses nobody is allowed to touch',
  '{P} on vinyl, crackle in the background, hand on the small of the beat',
];
const GHOST_ROSTER = [
  { name: 'GHOST-9', bars: null }, // dark bank below (the original Glitchy-clone voice)
  { name: 'DEAD MIC', bars: BRAG_BARS },
  { name: 'SUNNY D', bars: SUNNY_BARS },
  { name: 'VELVET V', bars: SMOOTH_BARS },
];
const BOT_BARS = [
  'I turned {P} into a prayer that the basement never answered',
  '{P} on my chest and I still walked in like I owned the dark',
  'they counted me out at {P}, now the whole room whispers it back',
  'I keep {P} in my pocket next to change I will never spend',
  'the beat bent sideways and {P} was the only thing standing',
  'I wrote {P} on the wall in chalk so the rain could read it twice',
  'no halo, no rescue, just {P} and a busted metronome heart',
  'I buried {P} under the floorboards and it still knocks at night',
  '{P} tastes like copper and bad weather coming over the hill',
  'they sold me {P} as a warning and I framed it like a diploma',
  'I have been running from {P} so long my shadow files complaints',
  'every scar spells {P} if you read it under a black light',
  'I put {P} on the scale and it outweighed every excuse I had',
  'the preacher said {P}, the congregation just checked the exits',
  'I stitched {P} into the lining so the cold stays honest',
  '{P} again — same ghost, new room, same locked door',
  'my pen bleeds {P} every time the snare forgets to blink',
  'I traded sleep for {P} and the exchange rate is criminal',
  'they hear {P} in my voice before I even open my mouth',
  'I keep {P} loaded like the last round nobody talks about',
  'somewhere under {P} there is a version of me still standing',
  'the mirror filed a report and the headline was {P}',
];
GHOST_ROSTER[0].bars = BOT_BARS; // GHOST-9 keeps the original dark bank
function botBarText(p) {
  const bank = p.barBank && p.barBank.length ? p.barBank : BOT_BARS;
  const prompt = p.currentPrompt || 'Static';
  const fresh = bank.map((b, i) => i).filter(i => !(p.usedBars || []).includes(i));
  const idx = fresh.length ? pick(fresh) : rnd(bank.length);
  p.usedBars = [...(p.usedBars || []), idx];
  return bank[idx].replace('{P}', prompt.toLowerCase());
}
function humanPresent(room) { return room.players.some(p => !p.isBot && p.connected); }

// One driver per solo room, ticking like the watchdog. It acts once per
// stage (keyed by match + turn sequence + stage), after a human-feeling
// delay, and only while a human is actually in the room.
function startBotDriver(room) {
  room.botDriver = setInterval(() => {
    if (!rooms.has(room.code)) { clearInterval(room.botDriver); return; }
    if (!humanPresent(room)) return;
    try {
      if (room.phase === 'voting') {
        if (Date.now() - (room.votingStartedAt || 0) < 3000) return;
        const bot = room.players.find(p => p.isBot && !room.votes[p.id]);
        if (bot) botVote(room, bot);
        return;
      }
      if (room.phase !== 'playing' || !room.turn) return;
      const p = cur(room);
      if (!p || !p.isBot) return;
      const key = `${room.matchId}:${room.turnSeq || 0}:${room.turn.stage}`;
      if (room._botKey === key) return;
      room._botKey = key;
      const delay = room.turn.stage === 'writing' ? 2600 + rnd(2600)
        : room.turn.stage === 'discard' ? 900
        : 1300 + rnd(1400);
      setTimeout(() => {
        if (!rooms.has(room.code) || room.phase !== 'playing' || !room.turn) return;
        if (cur(room) !== p || room.turn.stage !== room._botStageOf(key)) return;
        try { botAct(room, p); } catch (e) { console.error('bot', e); }
      }, delay);
      room._botStageOf = (k) => k.split(':').pop();
    } catch (e) { console.error('bot driver', e); }
  }, 800);
}
function botVote(room, bot) {
  // Ghosts vote for the fullest verse that isn't theirs — write more, win more.
  const others = room.players.filter(p => p.id !== bot.id);
  const scored = others.map(p => ({ p, len: p.verse.reduce((a, v) => a + (v.text || '').length, 0) }));
  const max = Math.max(...scored.map(s => s.len));
  const top = scored.filter(s => s.len === max);
  room.votes[bot.id] = pick(top).p.id;
  log(room, `${bot.name} casts a vote from beyond.`);
  const connected = room.players.filter(p => p.connected);
  if (connected.every(p => room.votes[p.id])) tallyVotes(room); else sync(room);
}
function botPlayBar(room, p) {
  const idx = p.hand.findIndex(c => c.type === 'bar');
  if (idx < 0) return false;
  const card = p.hand.splice(idx, 1)[0];
  p.playedBar = true;
  let promptCard = card;
  if (p.pendingUpgrade) {
    p.pendingUpgrade = false;
    const better = drawBarUpgrade(room, DIFF_RANK[card.difficulty]);
    if (better) { room.actionDiscard.push(card); promptCard = better; log(room, `${p.name}'s prompt was upgraded to HARD territory: ${better.prompt}.`); }
  }
  p.currentPrompt = promptCard.prompt;
  log(room, `${p.name} takes the prompt: ${promptCard.prompt}.`);
  beginWriting(room);
  return true;
}
function botPlayTactical(room, p) {
  if (p.playedTactical) return;
  // Playable without a discard choice; swapCard is skipped (too fiddly to fake).
  const usable = p.hand.filter(c => c.type !== 'bar' && c.fx !== 'swapCard' && !(c.fx === 'shield' && p.shield));
  if (!usable.length || Math.random() < 0.3) return;
  const pref = ['shield', 'draw', 'extraTime', 'cleanse', 'flowSelf', 'wildSound', 'randomSound', 'upgradePrompt', 'attachReq', 'stealCard', 'forceDiscard', 'swapBarCard'];
  usable.sort((a, b) => pref.indexOf(a.fx) - pref.indexOf(b.fx));
  const card = usable[0];
  let targetId = null;
  if (card.targeted) {
    const others = room.players.filter(o => o.id !== p.id);
    const human = others.find(o => !o.isBot);
    targetId = (human && Math.random() < 0.7 ? human : pick(others)).id;
  }
  const idx = p.hand.indexOf(card);
  p.hand.splice(idx, 1);
  const err = applyTactical(room, p, card, targetId, null);
  if (err) { p.hand.splice(idx, 0, card); return; }
  p.playedTactical = true;
  room.actionDiscard.push(card);
  log(room, `${p.name} plays ${card.name}.`);
  sync(room);
}
function botAct(room, p) {
  const stage = room.turn.stage;
  if (stage === 'sound') { resolveSound(room, Math.random() < 0.75); return; }
  if (stage === 'action') {
    botPlayTactical(room, p);
    if (room.turn && room.turn.stage === 'action' && cur(room) === p) {
      if (!botPlayBar(room, p)) endActionPhase(room);
    }
    return;
  }
  if (stage === 'writing') {
    const text = botBarText(p);
    p.draft = text;
    submitBar(room, p, text, false);
    return;
  }
  if (stage === 'discard') {
    while (p.hand.length > HAND_LIMIT) room.actionDiscard.push(p.hand.splice(rnd(p.hand.length), 1)[0]);
    advance(room);
  }
}

// ---------- state ----------
function newPlayer(id, name, streak, isBot) {
  return { id, name, streak: Number(streak) || 0, connected: true, isBot: !!isBot, usedBars: [], hand: [], verse: [], shield: false, drawnSound: null, draft: '',
    pendingReqs: [], pendingUpgrade: false, turnExtraTime: 0, playedBar: false, playedTactical: false, currentPrompt: null };
}
function log(room, msg) { room.log.push(msg); if (room.log.length > 30) room.log.shift(); }

function publicState(room) {
  return {
    code: room.code, phase: room.phase, hostId: room.hostId, direction: room.direction, mode: room.mode || 'basement',
    players: room.players.map(p => ({ id: p.id, name: p.name, streak: p.streak, isBot: !!p.isBot, bars: p.verse.length, handCount: p.hand.length, shield: p.shield, connected: p.connected, verse: p.verse })),
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

// Turn watchdog: every stage sets a deadline via setTimer. If a deadline ever
// passes unfired (a dropped timer, a wedged callback), the watchdog forces
// that stage's timeout path — a match can never freeze on a dead turn.
function startWatchdog(room) {
  room.watchdog = setInterval(() => {
    if (!rooms.has(room.code)) { clearInterval(room.watchdog); return; }
    if (room.phase !== 'playing' || !room.turn) return;
    if (!humanPresent(room)) return; // empty room: frozen in grace, don't play it out (bots don't count)
    if (Date.now() < room.deadline + 2000) return;
    if (process.env.BN_DEBUG_WATCHDOG) console.log('WATCHDOG FIRE:', room.turn.stage, 'overdue by', Date.now() - room.deadline, 'ms');
    const p = cur(room);
    try {
      if (room.turn.stage === 'sound') resolveSound(room, Math.random() < 0.5);
      else if (room.turn.stage === 'action') endActionPhase(room);
      else if (room.turn.stage === 'writing') submitBar(room, p, p.draft || '', true);
      else if (room.turn.stage === 'discard') {
        while (p.hand.length > HAND_LIMIT) room.actionDiscard.push(p.hand.splice(rnd(p.hand.length), 1)[0]);
        log(room, `${p.name}'s discards were forced — the floor doesn't wait.`);
        advance(room);
      }
    } catch (e) { console.error('watchdog', e); }
  }, 2000);
}
// Beat stamps: every turn start and every board change re-stamps the beat.
// Clients cut the loop and restart it from step 0 at startAt (server time),
// so all devices hear the same updated board from the same downbeat.
function restamp(room, delay = 1200) {
  room.beat = { bpm: 92, startAt: Date.now() + delay, id: ((room.beat && room.beat.id) || 0) + 1 };
}

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
  restamp(room, 1500);
  room.phase = 'playing';
  log(room, `Match started. ${cur(room).name} opens${topStreak > 0 ? ` (streak ${topStreak})` : ''}.`);
  startTurn(room);
}

function startTurn(room) {
  const p = cur(room);
  room.turnSeq = (room.turnSeq || 0) + 1;
  room.turn = { playerId: p.id, stage: 'sound' };
  p.playedBar = false; p.playedTactical = false; p.currentPrompt = null; p.draft = '';
  p.drawnSound = drawFrom(room.soundDeck, room.soundDiscard);
  const bonus = drawFrom(room.actionDeck, room.actionDiscard);
  if (bonus) p.hand.push(bonus);
  log(room, `${p.name}'s turn.`);
  tickBoardFx(room);
  restamp(room); // the beat cuts here and restarts with the current board
  setTimer(room, modeTimers(room).decide, () => { // timeout: random legal resolution
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
    restamp(room, 900); // board changed — drop the beat and restart it updated
  } else if (card) {
    room.soundDiscard.push(card);
    log(room, `${p.name} bins the sound card.`);
  }
  room.turn.stage = 'action';
  setTimer(room, modeTimers(room).decide, () => { if (room.turn && room.turn.stage === 'action') endActionPhase(room); });
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
  const ms = modeTimers(room).write + (p.turnExtraTime || 0) * 1000;
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
  room.phase = 'voting'; room.turn = null; room.votes = {}; room.votingStartedAt = Date.now();
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
      if (drawn) { room.activeSounds[cat] = drawn; log(room, `The ${cat} gets hijacked: ${drawn.name}.`); restamp(room, 900); }
      break;
    }
    case 'wildSound': applyManipulation(room, actor, { name: 'WILDCARD AUDIO', fx: 'wildSound' }); restamp(room, 900); break;
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
    room = { code, phase: 'lobby', hostId: socket.id, players: [], turnIndex: 0, direction: 1, turn: null, log: [], timer: null, deadline: 0, activeSounds: {}, boardFx: null, actionDeck: [], actionDiscard: [], soundDeck: [], soundDiscard: [], winner: null, finalTurnsLeft: null, votes: {}, results: null, finishSeq: [], matchId: 0, mode: 'basement', beat: null };
    player = newPlayer(socket.id, String(name || 'Player').slice(0, 20), streak);
    room.players.push(player); rooms.set(code, room); socket.join(code);
    startWatchdog(room);
    cb && cb({ ok: true, code }); sync(room);
  });

  socket.on('create_solo', ({ name, streak, bots }, cb) => {
    const code = makeCode();
    room = { code, phase: 'lobby', hostId: socket.id, players: [], turnIndex: 0, direction: 1, turn: null, log: [], timer: null, deadline: 0, activeSounds: {}, boardFx: null, actionDeck: [], actionDiscard: [], soundDeck: [], soundDiscard: [], winner: null, finalTurnsLeft: null, votes: {}, results: null, finishSeq: [], matchId: 0, mode: 'basement', beat: null, solo: true };
    player = newPlayer(socket.id, String(name || 'Player').slice(0, 20), streak);
    room.players.push(player);
    const nBots = Math.max(1, Math.min(3, Number(bots) || 2));
    const roster = [...GHOST_ROSTER].sort(() => Math.random() - 0.5); // random lineup every match
    for (let i = 0; i < nBots; i++) {
      const g = roster[i % roster.length];
      const bot = newPlayer(`bot_${code}_${i}`, g.name, 0, true);
      bot.barBank = g.bars;
      room.players.push(bot);
    }
    rooms.set(code, room); socket.join(code);
    startWatchdog(room);
    startBotDriver(room);
    log(room, `${nBots} ghost writers slide into the booth. Solo run — same cards, same beat, they write back.`);
    cb && cb({ ok: true, code }); sync(room);
  });

  // Reclaim a seat after a drop (phone slept, browser refreshed, signal lost).
  // The seat — hand, verse, turn, shield — survives; only the socket id changes.
  socket.on('rejoin_room', ({ name, code }, cb) => {
    room = rooms.get(String(code || '').toUpperCase());
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    const seat = room.players.find(p => p.name === String(name || '').slice(0, 20) && !p.connected);
    if (!seat) return cb && cb({ ok: false, error: 'No seat to reclaim under that name' });
    const oldId = seat.id;
    seat.id = socket.id; seat.connected = true;
    if (room.hostId === oldId) room.hostId = socket.id;
    if (room.turn && room.turn.playerId === oldId) room.turn.playerId = socket.id;
    if (room.winner === oldId) room.winner = socket.id;
    if (room.votes && room.votes[oldId]) { room.votes[socket.id] = room.votes[oldId]; delete room.votes[oldId]; }
    room.finishSeq = (room.finishSeq || []).map(id => id === oldId ? socket.id : id);
    if (room.deathTimer) { clearTimeout(room.deathTimer); room.deathTimer = null; }
    player = seat; socket.join(room.code);
    log(room, `${seat.name} climbs back through the basement door.`);
    cb && cb({ ok: true, code: room.code }); sync(room);
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

  socket.on('set_mode', ({ mode }, cb) => {
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return cb && cb({ ok: false, error: 'Host picks the pace in the lobby' });
    if (!MODES[mode]) return cb && cb({ ok: false, error: 'Unknown pace' });
    room.mode = mode; sync(room); cb && cb({ ok: true });
  });

  // Clock sync: clients estimate the offset between their clock and the
  // server's so beat stamps land at the same instant on every device.
  socket.on('time_ping', (data, cb) => { if (typeof cb === 'function') cb({ t: Date.now() }); });

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

  socket.on('draft', ({ text }) => { if (myTurn() && room.turn.stage === 'writing') me().draft = String(text || '').slice(0, 600); });
  socket.on('submit_bar', ({ text }) => { if (myTurn() && room.turn.stage === 'writing') { clearTimeout(room.timer); submitBar(room, me(), String(text || '').slice(0, 600), false); } });
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
      const humans = room.players.filter(p => !p.isBot);
      if (!humans.length) { rooms.delete(room.code); return; } // solo lobby: ghosts leave with the human
      if (room.hostId === player.id) room.hostId = humans[0].id;
    }
    if (!humanPresent(room)) {
      clearTimeout(room.timer);
      if (room.phase === 'playing' || room.phase === 'voting') {
        // Grace window: keep the room (and every seat) alive for 3 minutes so
        // a dropped player can rejoin instead of losing the match.
        if (!room.deathTimer) room.deathTimer = setTimeout(() => rooms.delete(room.code), 180000);
      } else rooms.delete(room.code);
    }
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
