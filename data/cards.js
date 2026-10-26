'use strict';
// BAR NONE card data. Structured definitions only — the engine executes `fx`,
// never card text. Content per DECISIONS.md (52 bar prompts, 12 flow challenges,
// 36 tactical, 48 sound patterns + 8 manipulations).

// ---------- Bar Cards (prompts) ----------
const BAR_PROMPTS = {
  easy: ['Fire', 'Night', 'Cold Blood', 'Bad Decisions', 'No Way Out', 'All Alone', 'One Last Chance', 'Back Against the Wall', 'Concrete', 'Sirens', 'Empty Pockets', 'Last Cigarette', 'Gravel Road', 'Busted Knuckles', 'Motel Light', 'Cheap Whiskey', 'Rust', 'Static', 'Payday', 'Long Walk Home'],
  medium: ['Paranoia', 'Anonymous', 'Disconnected', 'Dead Weight', 'Beautiful Disaster', 'Behind the Curtain', 'The Price of Silence', 'Nothing to Lose', 'Static Confession', 'Borrowed Time', 'Velvet Guillotine', 'Half-Lit Halo', 'Neon Confessional', 'The Checkout Line at 3AM', 'Secondhand Smoke', 'A Letter Never Sent', 'Gravity', 'The Quiet Car', 'Invoice for My Soul', 'Smoke Alarm'],
  hard: ['Irreversible', 'Incomprehensible', 'Metamorphosis', 'Decomposition', 'An Unfamiliar Reflection', 'Buried Beneath the Evidence', 'A Cemetery Full of Promises', 'The Autopsy of a Phone Call', 'Interest Accrued on Grief', 'A Eulogy Written in Pencil', 'Sediment of a Former Life', 'The Cartography of Scar Tissue'],
};

// ---------- Flow Challenges ----------
const FLOW_CHALLENGES = [
  { name: 'Internal Rhyme', req: 'Land at least two rhymes inside the line, not just at the end.' },
  { name: 'Multisyllabic Rhyme', req: 'End the bar on a rhyme of three or more syllables.' },
  { name: 'Alliteration', req: 'Start at least four words with the same sound.' },
  { name: 'Setup and Payoff', req: 'First half sets a scene, second half flips it.' },
  { name: 'Perspective Shift', req: 'Write the bar as someone — or something — else.' },
  { name: 'Avoid the Obvious Rhyme', req: 'The expected rhyme word is banned. Take the side door.' },
  { name: 'Storytelling', req: 'Something must happen in this bar. Move the story.' },
  { name: 'Rhythm Switch', req: 'Break your pattern: change the cadence mid-bar.' },
  { name: 'Tongue Twister', req: 'Stack sounds until the bar is hard to say out loud.' },
  { name: 'Say It Without Saying It', req: 'Never state the subject directly. All implication.' },
  { name: 'Internal Rhyme II', req: 'Land at least two rhymes inside the line, not just at the end.' },
  { name: 'Multisyllabic Rhyme II', req: 'End the bar on a rhyme of three or more syllables.' },
];

// ---------- Tactical cards ----------
// fx types the engine implements:
// draw{n} | swapCard | extraTime{sec} | shield | upgradePrompt(target) |
// attachReq(target) | swapBarCard(target) | randomSound | stealCard(target) |
// forceDiscard(target) | cleanse | wildSound | flowSelf (attach flow req to own bar)
const TACTICAL = [
  // Help (10)
  { name: 'MIC CHECK', kind: 'help', fx: 'swapCard', text: 'Discard a card from your hand, draw a replacement.' },
  { name: 'SECOND THOUGHT', kind: 'help', fx: 'swapCard', text: 'Discard a card from your hand, draw a replacement.' },
  { name: 'RHYME RESCUE', kind: 'help', fx: 'draw', n: 1, text: 'Draw a card.' },
  { name: 'BREATHING ROOM', kind: 'help', fx: 'extraTime', sec: 20, text: '+20 seconds on your writing timer this turn.' },
  { name: 'DEEP BREATH', kind: 'help', fx: 'extraTime', sec: 20, text: '+20 seconds on your writing timer this turn.' },
  { name: 'RESET', kind: 'help', fx: 'cleanse', text: 'Clear every pending effect aimed at you.' },
  { name: 'FRESH PAGE', kind: 'help', fx: 'draw', n: 1, text: 'Draw a card.' },
  { name: 'ENCORE FUND', kind: 'help', fx: 'draw', n: 2, text: 'Draw two cards.' },
  { name: 'STUDIO TIME', kind: 'help', fx: 'extraTime', sec: 30, text: '+30 seconds on your writing timer this turn.' },
  { name: 'OPEN MIC NIGHT', kind: 'help', fx: 'swapCard', text: 'Discard a card from your hand, draw a replacement.' },
  // Sabotage (14)
  { name: "WRITER'S BLOCK", kind: 'sabotage', fx: 'upgradePrompt', targeted: true, text: "Target's next Bar Card is replaced by a harder one." },
  { name: 'RHYME TAX', kind: 'sabotage', fx: 'attachReq', targeted: true, text: "Target's next bar carries a flow requirement." },
  { name: 'FORCED FLOW', kind: 'sabotage', fx: 'attachReq', targeted: true, text: "Target's next bar carries a flow requirement." },
  { name: 'FLOW SWITCH', kind: 'sabotage', fx: 'attachReq', targeted: true, text: "Target's next bar must switch rhythm mid-bar." , reqOverride: 'Rhythm Switch' },
  { name: 'BAR JACKER', kind: 'sabotage', fx: 'swapBarCard', targeted: true, text: 'Swap a random Bar Card from your hand with one from the target\'s.' },
  { name: 'MIC SNATCH', kind: 'sabotage', fx: 'forceDiscard', targeted: true, text: 'Target discards a random card.' },
  { name: "PRODUCER'S REVENGE", kind: 'sabotage', fx: 'randomSound', text: 'A random active sound is replaced from the Sound Deck.' },
  { name: 'HECKLER', kind: 'sabotage', fx: 'forceDiscard', targeted: true, text: 'Target discards a random card.' },
  { name: 'STAGE FRIGHT', kind: 'sabotage', fx: 'upgradePrompt', targeted: true, text: "Target's next Bar Card is replaced by a harder one." },
  { name: 'DEAD AIR', kind: 'sabotage', fx: 'randomSound', text: 'A random active sound is replaced from the Sound Deck.' },
  { name: 'POCKET PICK', kind: 'sabotage', fx: 'stealCard', targeted: true, text: 'Steal a random card from the target\'s hand.' },
  { name: 'STATIC BURST', kind: 'sabotage', fx: 'forceDiscard', targeted: true, text: 'Target discards a random card.' },
  { name: 'CURSED MIC', kind: 'sabotage', fx: 'upgradePrompt', targeted: true, text: "Target's next Bar Card is replaced by a harder one." },
  { name: 'TAPE EATER', kind: 'sabotage', fx: 'attachReq', targeted: true, text: "Target's next bar carries a flow requirement." },
  // Defense (6) — all shields in v1
  { name: 'EARPLUGS', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  { name: 'BOUNCER', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  { name: 'SOUNDPROOF BOOTH', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  { name: 'STAGE PRESENCE', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  { name: 'THICK SKIN', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  { name: 'NO COMMENT', kind: 'defense', fx: 'shield', text: 'Shield: block the next sabotage aimed at you.' },
  // Wild (6)
  { name: 'FREESTYLE FRENZY', kind: 'wild', fx: 'wildSound', text: 'Trigger a random sound manipulation.' },
  { name: 'DOUBLE OR NOTHING', kind: 'wild', fx: 'draw', n: 2, text: 'Draw two cards.' },
  { name: 'PLOT TWIST', kind: 'wild', fx: 'swapCard', text: 'Discard a card from your hand, draw a replacement.' },
  { name: 'SECOND WIND', kind: 'wild', fx: 'cleanse', text: 'Clear every pending effect aimed at you.' },
  { name: 'CHAOS BUTTON', kind: 'wild', fx: 'wildSound', text: 'Trigger a random sound manipulation.' },
  { name: 'GHOSTWRITER', kind: 'wild', fx: 'draw', n: 1, text: 'Draw a card.' },
];

// ---------- Sound patterns ----------
// 4 bars x 16 steps. hits: { s: step 0..63, n: midi note|null, l: length in steps, v: velocity 0..1 }
const SCALES = {
  bass: [33, 33, 36, 33, 38, 31, 33, 41],          // A1-rooted, dark movement
  piano: [57, 60, 64, 65, 64, 60, 69, 67],          // A minor
  strings: [69, 68, 64, 65, 69, 72, 68, 64],        // tension line, semitone rub
};
function hitsFromBars(bars, notes, len = 1) {
  const hits = [];
  bars.forEach((bar, b) => {
    let ni = 0;
    [...bar].forEach((ch, i) => {
      if (ch === 'x') {
        hits.push({ s: b * 16 + i, n: notes ? notes[ni++ % notes.length] : null, l: len, v: ch === 'x' ? 0.9 : 0.9 });
      } else if (ch === 'X') {
        hits.push({ s: b * 16 + i, n: notes ? notes[ni++ % notes.length] : null, l: len, v: 1.0 });
      }
    });
  });
  return hits;
}
// Per category: [name, difficulty, bar-strings, noteSet, noteLen]
const PATTERN_DEFS = {
  KICK: [
    ['Heartbeat', 'standard', ['x.....x.........', 'x.....x.........', 'x.....x.....x...', 'x.....x.........']],
    ['Boom Bap Basic', 'standard', ['x......x........', 'x......x........', 'x......x........', 'x......x....x...']],
    ['Four Corners', 'standard', ['x.......x.......', 'x.......x.......', 'x.......x.......', 'x.......x...x...']],
    ['Late Arrival', 'unstable', ['....x.......x...', '....x.......x...', '....x...........', '....x.......x.x.']],
    ['Stutter Step', 'unstable', ['x.x.........x...', 'x.x.............', 'x.x.........x...', '..........x.....']],
    ['Cardiac Arrest', 'cursed', ['x..x......x.....', '..x.......x..x..', 'x.......x.......', '....x..x......x.']],
  ],
  SNARE: [
    ['Backbeat', 'standard', ['....x.......x...', '....x.......x...', '....x.......x...', '....x.......x.x.']],
    ['Half-Time Giant', 'standard', ['........x.......', '........x.......', '........x.......', '........x.......']],
    ['March', 'standard', ['....x.......x...', '....x...x...x...', '....x.......x...', '....x.......xxxx']],
    ['Displaced', 'unstable', ['......x.......x.', '......x.......x.', '......x.........', '......x.......x.']],
    ['Missing Tooth', 'unstable', ['....x...........', '....x.......x...', '............x...', '....x.......x...']],
    ['Seizure Kit', 'cursed', ['....x..x....x...', '..x.......x.....', '....x.....x..x..', '......x.......x.']],
  ],
  HATS: [
    ['Eighth Pulse', 'standard', ['x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.']],
    ['Sixteenth Rain', 'standard', ['xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxx.x']],
    ['Offbeat Ghost', 'standard', ['..x...x...x...x.', '..x...x...x...x.', '..x...x...x...x.', '..x...x...x...x.']],
    ['Stutter Box', 'unstable', ['xxx.x.xxx.x.xxx.', 'xxx.x.xxx.x.xxx.', 'xxx.x...........', 'xxx.x.xxx.x.xxx.']],
    ['Broken Swing', 'unstable', ['x..x..x.x..x..x.', 'x..x..x.x..x....', 'x..x..x.x..x..x.', 'x..x..x.........']],
    ['Swarm', 'cursed', ['xxxxxxxxxxxxxxxx', 'xx.xx.xxxxx.x.xx', 'xxxxxxxxxxxxxxxx', 'x.xxxxxxxxxxxxxx']],
  ],
  BASS808: [
    ['Sub Anchor', 'standard', ['x...............', 'x...............', 'x...............', 'x...........x...'], 'bass', 12],
    ['Pulse Driver', 'standard', ['x.....x.........', 'x.....x.........', 'x.....x.........', 'x.....x.....x...'], 'bass', 6],
    ['Two-Note Menace', 'standard', ['x...............', '........x.......', 'x...............', '........x.......'], 'bass', 10],
    ['Slide Season', 'unstable', ['x.........x.....', 'x...............', '......x.........', 'x.........x.....'], 'bass', 8],
    ['Heartbeat Skip', 'unstable', ['x...........x...', '................', 'x...........x...', '..........x.....'], 'bass', 7],
    ['Sub Collapse', 'cursed', ['x................', '.....x..........', 'x...............', '..x........x....'], 'bass', 14],
  ],
  PIANO: [
    ['Minor Confession', 'standard', ['x.......x.......', '....x.......x...', 'x.......x.......', '....x........x..'], 'piano', 3],
    ['Repeating Motif', 'standard', ['x...x...x.......', 'x...x...x.......', 'x...x...x...x...', 'x...x...........'], 'piano', 2],
    ['Sparse Regret', 'standard', ['x................', '........x.......', '................', '....x...........'], 'piano', 6],
    ['Crooked Waltz', 'unstable', ['x.....x.....x...', 'x.....x.........', 'x.....x.....x...', '......x.........'], 'piano', 2],
    ['Stab Wounds', 'unstable', ['x.x.............', '........x.x.....', 'x.x.............', '............x.x.'], 'piano', 1],
    ['Possessed Music Box', 'cursed', ['x...x.x.....x...', '..x.......x.....', 'x.....x...x..x..', '....x.......x...'], 'piano', 2],
  ],
  STRINGS: [
    ['Sustained Dread', 'standard', ['x...............', 'x...............', 'x...............', 'x...............'], 'strings', 16],
    ['Tension Motif', 'standard', ['x.......x.......', 'x.......x.......', 'x.......x.......', 'x...............'], 'strings', 8],
    ['Slow Knife', 'standard', ['x...............', '................', 'x...............', '................'], 'strings', 16],
    ['Stab Section', 'unstable', ['x.x.............', '................', 'x.x.............', '........x.x.....'], 'strings', 2],
    ['Unsettled Air', 'unstable', ['x...............', '......x.........', 'x...............', '..........x.....'], 'strings', 12],
    ['Swarm of Teeth', 'cursed', ['x.x.x...........', '..x...x.x.......', 'x.....x...x.....', '....x.x.......x.'], 'strings', 3],
  ],
  GLITCH: [
    ['Sparse Static', 'standard', ['....x...........', '............x...', '........x.......', '................']],
    ['Rhythmic Interrupt', 'standard', ['..x...x...x.....', '..x...x...x.....', '..x...x.........', '..x...x...x.....']],
    ['Bit Rot', 'standard', ['x.....x.....x...', '................', 'x.....x.........', '............x...']],
    ['Buffer Underrun', 'unstable', ['xxx.............', '........xxx.....', 'xxx.............', '............xxx.']],
    ['Signal Tear', 'unstable', ['..xx......xx....', '................', '..xx............', '......xx........']],
    ['Kernel Panic', 'cursed', ['x.xxx.x...xx....', '..x....xxx......', 'xx....x..x..xxx.', '....xx......x.x.']],
  ],
  INDUSTRIAL: [
    ['Metallic Pulse', 'standard', ['x.......x.......', 'x.......x.......', 'x.......x.......', 'x.......x....x..']],
    ['Machine Groove', 'standard', ['x.....x...x.....', 'x.....x...x.....', 'x.....x...x.....', 'x.....x.........']],
    ['Foundry Beat', 'standard', ['x..x......x..x..', 'x..x......x..x..', 'x..x......x..x..', 'x..x......x.....']],
    ['Loose Bolt', 'unstable', ['x.........x.....', '....x........x..', 'x.........x.....', '........x.......']],
    ['Press Malfunction', 'unstable', ['x.......xx......', 'x...............', 'x.......xx......', 'x..........xx...']],
    ['Scrapyard Riot', 'cursed', ['x..x..x....x....', '....x..x......x.', 'x....x....x..x..', '..x.......x.....']],
  ],
};
const CATEGORIES = Object.keys(PATTERN_DEFS);

const MANIPULATIONS = [
  { name: 'DOUBLE TIME', fx: 'doubleTime', text: 'The beat doubles its step rate for one cycle.' },
  { name: 'HALF TIME', fx: 'halfTime', text: 'The beat drops to half rate for one cycle.' },
  { name: 'REVERSE', fx: 'reverse', text: 'A random active pattern plays backwards for one cycle.' },
  { name: 'MUTE', fx: 'mute', text: 'A random active sound is silenced for one cycle.' },
  { name: 'GLITCH', fx: 'glitch', text: 'Random hits are scattered across the beat for one cycle.' },
  { name: 'BEAT FLIP', fx: 'beatFlip', text: 'Two active sounds swap patterns for one cycle.' },
  { name: 'BREAKDOWN', fx: 'breakdown', text: 'Only one active sound survives for one cycle.' },
  { name: 'WILDCARD AUDIO', fx: 'wildSound', text: 'A random manipulation fires.' },
];

// ---------- Deck builders ----------
let uid = 0;
const nid = (p) => `${p}_${++uid}`;
function buildActionDeck() {
  const cards = [];
  for (const [diff, prompts] of Object.entries(BAR_PROMPTS))
    for (const prompt of prompts)
      cards.push({ id: nid('bar'), type: 'bar', difficulty: diff, prompt, text: `Write a bar using: ${prompt}` });
  for (const f of FLOW_CHALLENGES)
    cards.push({ id: nid('flow'), type: 'flow', name: f.name, req: f.req, fx: 'flowSelf', text: f.req });
  for (const t of TACTICAL)
    cards.push({ id: nid('tac'), type: t.kind, name: t.name, fx: t.fx, n: t.n, sec: t.sec, targeted: !!t.targeted, reqOverride: t.reqOverride, text: t.text });
  return shuffle(cards);
}
function buildSoundDeck() {
  const cards = [];
  for (const [cat, defs] of Object.entries(PATTERN_DEFS))
    for (const [name, difficulty, bars, noteSet, len] of defs)
      cards.push({ id: nid('snd'), type: 'sound', category: cat, name, difficulty, hits: hitsFromBars(bars, noteSet ? SCALES[noteSet] : null, len || 1) });
  for (const m of MANIPULATIONS)
    cards.push({ id: nid('man'), type: 'manipulation', name: m.name, fx: m.fx, text: m.text });
  return shuffle(cards);
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
module.exports = { buildActionDeck, buildSoundDeck, CATEGORIES, FLOW_CHALLENGES };
