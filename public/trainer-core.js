'use strict';
// BAR NONE Trainer — pure logic, shared by the browser client (trainer.js)
// and the node test suite. Follows the public/audio.js pattern: no DOM, no
// sockets, no server. The trainer is a writing room: the tool deals three
// candidate bars a turn (template frames x topic imagery), the writer keeps
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

// ---------- Tone packs ----------
// Frames use slots filled from the drawn topic's imagery bank (merged over
// the pack pool): {obj} {place} {verb} {det} and {T} = the topic name.
// Ghost-bank lines from server.js are adapted with {P} -> {T} where the
// flavor fits (DEAD MIC -> TALK SHIT, SUNNY D -> SUNNY SIDE, screened
// GHOST-9 lines -> DARK, NOT DEAD with the death imagery cut).

const TONE_PACKS = {

  // ===== DARK, NOT DEAD — dark pen, living horrors, NO death imagery =====
  darknotdead: {
    id: 'darknotdead',
    label: 'DARK, NOT DEAD',
    flavor: 'GHOST-9 energy, minus the graveyard',
    blurb: 'Dark, but everything in it is still breathing. Debt, paranoia, 4AM — the horrors with a pulse.',
    pool: {
      places: ['the kitchen', 'the hallway', 'the front steps', 'the parking lot at work', 'the mailbox', 'the couch', 'the night shift', 'the corner store', 'the bus stop', "the landlord's office"],
      objects: ['phone', 'rent letter', 'paystub', 'thermostat', 'car keys', 'work boots', 'empty fridge', 'alarm clock', 'front door', 'coffee cup'],
      verbs: ['sits unopened', 'rings again', 'waits on the counter', 'stares back', 'counts the hours', 'knows my name', "won't take no", 'glows at 4AM', 'leans on the door', 'keeps the score'],
      details: ['with my name spelled wrong', 'at 4AM with no apology', 'for the third time this week', 'like it pays rent here', 'while the whole street sleeps', 'in a voice too calm', 'before the coffee even hits', 'like clockwork, like a curse', 'with everybody watching', 'and nobody saying a word'],
    },
    topics: [
      { name: 'Debt Collectors', imagery: {
        objects: ['collection letter', 'unknown number', 'voicemail', 'credit report', 'payment plan', 'blocked number'],
        places: ['the mailbox', 'the kitchen table', 'the call log'],
        verbs: ['calls at dinner', 'leaves a message', 'knows my schedule', 'lowers its voice', 'adds a fee', 'waits me out'],
        details: ['for a card I cut up years ago', 'in a voice too calm', 'every day but Sunday', 'like we are old friends', 'with a reference number', 'before I finish my coffee'] } },
      { name: 'Eviction Notice', imagery: {
        objects: ['notice on the door', 'cardboard box', 'taped-up letter', 'lease', 'spare key', 'security deposit'],
        places: ['the front door', 'the hallway', 'the porch', 'the curb'],
        verbs: ['gives me thirty days', 'flutters in the wind', 'spells it out plain', "doesn't knock first", 'counts down quiet', 'waits for the tape to fail'],
        details: ['in bright legal orange', 'while the neighbors pretend not to look', 'with the rent already spent', 'dated yesterday', 'signed by a stranger', "like it's nothing personal"] } },
      { name: 'Being Watched', imagery: {
        objects: ['same gray car', 'curtain', 'security camera', 'footsteps', 'blocked caller', 'rearview mirror'],
        places: ['the end of the block', 'the parking garage', 'the stairwell', 'across the street'],
        verbs: ['idles too long', 'knows my route', 'matches my pace', 'never blinks', 'shows up twice', 'waits without waiting'],
        details: ['three nights running', 'with the headlights off', 'close enough to hear', 'never close enough to prove', 'in every reflection', 'like a song stuck on loop'] } },
      { name: '4AM Insomnia', imagery: {
        objects: ['ceiling fan', 'alarm clock', 'water bill', 'work shirt', 'phone at 2 percent', "tomorrow's shift"],
        places: ['the ceiling', 'the edge of the bed', 'the kitchenette', 'the dark living room'],
        verbs: ['ticks too loud', 'rehearses my mistakes', "won't let me under", 'runs the numbers again', 'keeps the light off', 'waits for the sun like a debt'],
        details: ['with four hours till the alarm', 'for the fifth night straight', 'while the pipes tick', 'and the whole block asleep', 'counting cracks like money', 'like sleep is ignoring my calls'] } },
      { name: 'Small-Town Rot', imagery: {
        objects: ['closed factory', 'empty theater', 'for-sale sign', 'rusted water tower', 'last pay phone', 'boarded diner'],
        places: ['main street', 'the plant gate', 'the old high school', 'the county line'],
        verbs: ['closed in ninety-eight', 'peels in the sun', 'employs nobody now', 'leans a little more each year', 'remembers everybody', "waits for a buyer who ain't coming"],
        details: ['where my grandfather worked', 'with the windows like eyes', 'and one stoplight blinking', 'since the highway moved', 'like the town exhaled and stopped', 'everybody here knows why'] } },
      { name: 'The Phone Only Rings Bad', imagery: {
        objects: ['phone', 'unknown number', 'hospital bracelet', 'tow truck', 'school office line', 'bail bondsman card'],
        places: ['the counter', 'the glove box', 'the nightstand', 'the break room'],
        verbs: ['rings at the worst time', 'never says hello first', 'starts with my full name', 'asks me to sit down', 'leaves silence first', 'only rings after midnight'],
        details: ['and I know before I answer', 'with that half-second of quiet', 'like the ring itself is sorry', 'for the third time this month', 'while dinner goes cold', 'and everybody looks at me'] } },
      { name: 'Digital Ghosts', imagery: {
        objects: ['read receipt', 'old profile', 'typing bubbles', 'deleted number', 'mutual friend', 'photo from 2019'],
        places: ['the message thread', 'the blocked list', 'the explore page', 'my lock screen'],
        verbs: ['types then stops', 'watches every story', 'likes a photo from years back', 'shows up online at 3AM', 'never says a word', 'haunts the notifications'],
        details: ['from an account that should be dead', 'after two years of nothing', 'with the typing dots dancing', 'like nothing ever happened', 'at exactly 2:22', 'and I just stare at it'] } },
    ],
    framesAny: [
      'the {obj} {verb}, {det}, and I just stand there doing math in my head',
      'another night with the {obj} glowing, rent due in my chest like a second heartbeat',
      'I know {T} by the sound it makes coming up the stairs',
      'they can keep the lights, I learned to see fine in this kind of dark',
      '{obj} on the counter, {obj} by the door, and me in the middle holding my breath',
      "I smile at work all day, come home and argue with the {obj}",
      "nobody coming to save me — that news got old, so I got moving",
      'the {place} knows my whole situation better than my family does',
      "I count what I owe on my fingers, then I count what I'm owed on the other hand",
      "this ain't rock bottom, it's the floor I'm building on",
      '{T} taught me patience the hard way — slow, daily, and personal',
      'I keep my head down and my receipts up, every single one',
      'the {obj} {verb} and the walls are too thin for pride',
      "sleep owes me money too, but sleep never answers either",
      'I rehearse being fine in the mirror at {place} till it almost sounds true',
      "everybody got advice, nobody got a spare room or a spare dollar",
      "the {obj} knows the truth: I'm not broke, I'm between miracles",
      "I laugh so the {obj} don't think it's winning",
      'hard times made appointments and they all showed up the same week',
      "I carry {T} like a toolbox — heavy, mine, and full of what I need",
      'the rent, the lights, the phone — a holy trinity of leave me alone',
      '{det}, the {obj} {verb}, and I answer like a man with options',
      "I stopped explaining my life to people who never missed a meal",
      'the {place} at midnight could write my biography better than me',
      'pressure made a schedule and moved into my spare room rent-free',
      "I ain't afraid of the dark, I'm afraid of what bills it's hiding",
      'I turned {T} into a prayer that the basement never answered',
      '{T} on my chest and I still walked in like I owned the dark',
      'they counted me out at {T}, now the whole room whispers it back',
      'I keep {T} in my pocket next to change I will never spend',
      'the beat bent sideways and {T} was the only thing standing',
      'I wrote {T} on the wall in chalk so the rain could read it twice',
      'no halo, no rescue, just {T} and a busted metronome heart',
      'they sold me {T} as a warning and I framed it like a diploma',
      'I have been running from {T} so long my shadow files complaints',
      'I put {T} on the scale and it outweighed every excuse I had',
      'the preacher said {T}, the congregation just checked the exits',
      'I stitched {T} into the lining so the cold stays honest',
      '{T} again — same ghost, new room, same locked door',
      'I traded sleep for {T} and the exchange rate is criminal',
      'they hear {T} in my voice before I even open my mouth',
      'somewhere under {T} there is a version of me still standing',
      'the mirror filed a report and the headline was {T}',
    ],
    framesHook: [
      "rent due, lights due, I'm still here — say it back",
      '{T} calling and I answer standing up',
      'no rescue coming, so I became the rescue',
      "dark house, loud heart, I ain't folding tonight",
      'count the bills, count my blessings, one list is longer',
      'the {obj} can wait, this moment is mine',
      "from the floor up — that's the only direction I know",
      'they want me quiet, I keep humming through the {place}',
    ],
    framesVerse: [
      'let me tell you how the {obj} {verb} while the check was still in the mail',
      'started with a letter, ended with me laughing in the {place}',
      "mama said the hard times visit but they don't get a key",
      'I watched the {obj} {verb} and took notes like a student',
      "first of the month and the hallway smells like everybody's business",
      'I learned bookkeeping from late fees and forgiveness from overdrafts',
      'the story is simple: the {obj} {verb}, and I refused the ending',
      'picture me at {place}, pockets loud with change and a plan',
    ],
  },

  // ===== TALK SHIT — funny, cocky, brag, battle talk (DEAD MIC lane) =====
  talkshit: {
    id: 'talkshit',
    label: 'TALK SHIT',
    flavor: 'DEAD MIC energy — cocky, funny, receipts out',
    blurb: 'Brag bars and punchlines. Funny, cocky, talking shit with a grin and the receipts to back it.',
    pool: {
      places: ['the booth', 'the group chat', 'the leaderboard', 'the comment section', 'the main stage', 'the cheap seats', 'the mirror', 'the scoreboard'],
      objects: ['pen', 'crown', 'receipts', 'highlight reel', 'trophy', 'contract', 'microphone', 'scoreboard'],
      verbs: ['does push-ups', 'signs autographs', 'collects rent', 'never misses', 'stays undefeated', 'talks first', 'backs it up', 'runs the table'],
      details: ['and I got the footage', 'in front of everybody', 'with the receipts laminated', 'while they watch from the cheap seats', "and it wasn't even close", 'like I do this every day', 'before breakfast', 'with one hand tied'],
    },
    topics: [
      { name: 'Payday Flex', imagery: {
        objects: ['paycheck', 'new shoes', 'full tank', 'steak', 'direct deposit', 'shopping bags'],
        places: ['the bank app', 'the mall', 'the dealership lot', 'the group chat'],
        verbs: ['hits different', 'cleared on time', 'made the group chat jealous', 'doubled since last year', 'talks loud', 'stays stacked'],
        details: ['and rent was early this time', 'with the bonus on top', 'while they still splitting appetizers', 'direct deposit, no drama', "and I didn't even check the price", 'like payday is my holiday'] } },
      { name: 'Worst to First', imagery: {
        objects: ['trophy', 'old yearbook', 'report card', 'first place ribbon', 'before photo', 'bottom bunk'],
        places: ['the bottom', 'the podium', 'the yearbook page', "the winner's circle"],
        verbs: ['kept the receipts', 'framed the failure', 'thanked the doubters', 'sold the story', 'wears it like a chain', 'laughs last'],
        details: ['from food stamps to first place', 'and the teachers saw it live', 'with the same shoes I started in', 'they wrote me off in pencil', 'now they spell my name right', 'front page, above the fold'] } },
      { name: 'My Pen vs Yours', imagery: {
        objects: ['pen', 'notebook', 'eraser', 'ink', 'dictionary', 'thesaurus'],
        places: ['the booth', 'the page', 'the cypher', 'the margins'],
        verbs: ['writes checks', 'does laps', 'never runs dry', 'needs no eraser', 'signs in permanent ink', 'outworks yours daily'],
        details: ['yours still on the first verse', 'and mine does push-ups', 'while yours googles rhymes', "in a font you can't afford", 'no ghostwriter, no training wheels', "check the handwriting, it's mine"] } },
      { name: 'Undefeated in the Group Chat', imagery: {
        objects: ['screenshot', 'voice note', 'poll results', 'pinned message', 'last word', 'reaction emoji'],
        places: ['the group chat', 'the thread', 'the comments', 'the family chat'],
        verbs: ['closed the thread', 'got pinned', 'ended the debate', 'collected the screenshots', 'never got answered', 'lives rent-free in the chat'],
        details: ['and nobody typed for an hour', 'with grandma cosigning', 'three dots appeared then vanished', 'they left the chat quietly', "I didn't even use caps", "the poll wasn't close"] } },
      { name: 'Landlord of the Booth', imagery: {
        objects: ['lease', 'keys', 'rent book', 'booth schedule', 'waiting list', 'late fee'],
        places: ['the booth', 'the studio', 'the session', 'the calendar'],
        verbs: ['collects on the first', 'keeps a waiting list', 'raised the standard', 'knows every tenant', 'never waits for a slot', 'owns the building now'],
        details: ['your session ends when I say', 'security deposit: your dignity', 'I used to rent this mic hourly', 'now they book around me', 'keys jingle when I walk in', 'late fee is a verse'] } },
      { name: 'Too Loud for the Library', imagery: {
        objects: ['librarian', 'late book', 'inside voice', 'bookmark', 'study room', 'whisper'],
        places: ['the library', 'the quiet floor', 'the reading room', 'the stacks'],
        verbs: ['got me shushed twice', "can't be shelved", "doesn't do whispers", 'got my own section', 'reads the room and ignores it', 'turned the page too loud'],
        details: ['they built a wing to contain me', 'my inside voice has bass', 'shushed and went louder', 'the books lean away', 'even the echo asked for quiet', 'catalogued under problems'] } },
    ],
    framesAny: [
      'I turned {T} into a headline, you are barely a footnote in it',
      '{T} is my warm-up, I do this half asleep with the rent due',
      'they study {T} in a lab somewhere and still cannot copy the recipe',
      'I made {T} look expensive, you make everything look borrowed',
      'put {T} on a shirt, I am selling merch off your favorite moment',
      'I body {T} so clean they should charge me for the cleanup',
      '{T} stepped up confident and left looking for its confidence',
      'my pen does push-ups, {T} never stood a chance on paper',
      'I turned {T} into a trophy and put it where the dust cant reach',
      'they chant {T} back at me now, I just nod like I planned it',
      'I am the plot twist in {T}, everybody else is an extra',
      '{T} wanted smoke, I brought the whole barbecue and the playlist',
      'I sign {T} in big letters, winners do not do small print',
      'call it {T}, call it light work, call it a warning to the next one',
      'the {obj} {verb}, {det}, and I\'m not even warmed up yet',
      "I don't chase nothing — the {obj} comes to me gift-wrapped",
      'they study my old verses like scripture and still flunk the test',
      'I make {T} look like light work and heavy money',
      "your favorite writer's favorite writer just took notes",
      'I walk in and the {obj} stands up straighter out of respect',
      "keep my name out your mouth unless it's followed by applause",
      'I been nice too long, the {obj} {verb} and so do I',
      "they want a feature, I want a percentage — we are not the same",
      'every bar I write raises the rent at {place}',
      'I turned doubters into a fan club with a membership fee',
      "the scoreboard don't lie and neither does my mirror",
      "I talk like this because the receipts let me, {det}",
      'put my worst verse against your best day and I still clear',
      'I sign my work in permanent ink, yours comes with an eraser',
      'legends get quoted, I get quoted at {place} daily',
    ],
    framesHook: [
      "say it loud — I'm the one they came to see",
      "{T}, that's me, undefeated and unbothered",
      "all that talking, where's your trophy at",
      "I don't compete, I collect — run it back",
      "crown heavy but my neck strong, let's go",
      'they whisper my name at {place} like a rumor that won',
      "talk is cheap and I'm expensive — say it with me",
      "winner's circle, my circle, same circle every time",
    ],
    framesVerse: [
      'let me walk you through the {obj} like a tour of your mistakes',
      "chapter one: I was broke, chapter two is why you're nervous",
      'I keep a list of doubters and the {obj} {verb} through every name',
      'heard your last song at {place} — the silence was the review',
      'I practiced in the mirror till the mirror started clapping',
      'every verse is a deposit and the {obj} {verb} like interest',
      'they laughed at the plan till the plan bought lunch for everybody',
      "I don't tell stories, I file reports — {det}",
    ],
  },
};

// ===== SUNNY SIDE — happy / funny / absurd bright (SUNNY D lane) =====
TONE_PACKS.sunnyside = {
  id: 'sunnyside',
  label: 'SUNNY SIDE',
  flavor: 'SUNNY D energy — bright, funny, cookout-certified',
  blurb: "Happy and absurd on purpose. The game's bright prompts with a grin — joy as a skill, not an accident.",
  pool: {
    places: ['the block party', 'the front porch', 'the cookout', 'the park', 'the driveway', 'the family reunion'],
    objects: ['paper plate', 'grill', 'speaker', 'lemonade', 'water balloon', 'folding chair'],
    verbs: ['goes for seconds', 'runs the aux cord', "knows everybody's name", 'stays golden', 'brings extra chairs', 'dances off-beat happily'],
    details: ['and grandma approved', 'with the whole street invited', 'before the ice even melted', 'and nobody checked their phone', 'with seconds and thirds', 'like summer pays us rent'],
  },
  topics: [
    { name: 'Payday Friday', imagery: {
      objects: ['paycheck', 'new shoes', 'full cart', 'fresh fade', 'gas tank on F', 'takeout bags'],
      places: ['the mall', 'the barbershop', 'the drive-thru', 'the group chat'],
      verbs: ['cleared early', 'made everybody smile', 'covered the whole table', 'said order what you want', 'filled the tank and the fridge', 'turned the music up'],
      details: ["and rent's already handled", 'with dessert, no debate', 'while the sun does overtime', 'like the week owed us one', 'and nobody split the bill', 'Friday did us a favor'] } },
    { name: 'Block Party', imagery: {
      objects: ['speaker', 'grill', 'folding table', 'jump rope', 'water balloons', 'paper plates'],
      places: ['the whole block', 'the cul-de-sac', 'the front lawns', 'the street they closed'],
      verbs: ['shut the street down', 'fed three generations', 'taught the kids the two-step', 'went till the streetlights', 'needed no invitation', "made the mailman stay for a plate"],
      details: ['and the DJ took requests', 'with the hydrant sprinkling', 'till the grill went cold', "and even the neighbors' neighbors came", 'like the block raised us right', 'one speaker, whole choir'] } },
    { name: 'Sunday Cookout', imagery: {
      objects: ['grill', 'potato salad', 'folding chair', 'dominoes', 'sweet tea', 'ribs'],
      places: ['the backyard', 'the porch', 'under the big tree', "grandma's house"],
      verbs: ['starts at noon', 'argues about dominoes', 'sends everybody home with plates', 'tells the same story better', 'saves me the good chair', 'ends with a prayer and a plate'],
      details: ['and uncle still undefeated at dominoes', 'with to-go plates stacked', 'like church but with ribs', 'and the playlist is all classics', "somebody's cousin brought a speaker", "and nobody wanted to leave"] } },
    { name: 'Emotional Support Alligator', imagery: {
      objects: ['leash', 'tiny vest', 'kiddie pool', 'sunglasses', 'emotional support paperwork', 'whole chicken'],
      places: ['the front yard', 'the waiting room', "the farmer's market", 'the splash pad'],
      verbs: ['wears a vest', 'calms the whole room', 'smiles with all his teeth', "doesn't judge anybody", 'takes up two chairs', 'supports me emotionally'],
      details: ['and his name is Pickles', 'with a vest that says do not pet', 'he pays no rent and full rent emotionally', 'the therapist approves somehow', "he's booked out for hugs", 'and he has never once texted back late'] } },
    { name: 'Haunted Self-Checkout', imagery: {
      objects: ['self-checkout', 'barcode', 'plastic bag', 'attendant button', 'unexpected item', 'coupon'],
      places: ['the grocery store', 'aisle nine', 'the express lane', 'the bagging area'],
      verbs: ['beeps at nothing', 'judges my snacks', 'calls the attendant', 'sees all my choices', 'needs approval for cough drops', 'knows what I did'],
      details: ['unexpected item in the bagging area', 'it beeped and I felt seen', 'the machine has seen things', 'please place the item and your dignity in the bag', 'it knows about the snacks', 'an attendant is coming, eventually'] } },
    { name: 'Gas Station Sushi', imagery: {
      objects: ['sushi tray', 'gas pump', 'slushie', 'receipt', 'hot dog roller', 'expiration date'],
      places: ['the gas station', 'the road trip', 'exit 42', 'the snack aisle'],
      verbs: ['glows under the light', 'dares me daily', 'costs three dollars', 'has survived everything', 'tempts the brave', 'rolls the dice for me'],
      details: ['and I lived to tell it', 'three dollars, zero regrets, some regrets', 'the expiration date is a rumor', 'road trip rules are different', 'it winked at me through the plastic', 'bravery tastes like spicy tuna'] } },
    { name: 'Found Money in Last Years Coat', imagery: {
      objects: ['twenty dollar bill', 'old coat', 'movie stub', 'peppermint', 'grocery list', 'concert ticket'],
      places: ['the coat pocket', 'the closet', 'the winter bin', 'the hallway hook'],
      verbs: ['paid for lunch', 'felt like a lottery', 'came with a movie stub', 'smelled like last winter', 'made the whole day', 'was folded like a secret'],
      details: ['past me looking out for present me', 'a crisp twenty, no note', 'and a peppermint from another era', "the coat knew I'd need it", 'like a time-travel tip', 'best plot twist of the season'] } },
    { name: 'Birthday Cake for Breakfast', imagery: {
      objects: ['birthday cake', 'candles', 'leftover frosting', 'party hat', 'balloons', 'ice cream'],
      places: ['the kitchen', 'the fridge door', 'the breakfast table', 'the morning after'],
      verbs: ['counts as breakfast', 'tastes better at 8AM', 'wears frosting proudly', 'starts the day correct', 'needed no permission', 'outranks every cereal'],
      details: ['frosting is a food group today', 'with a candle relit for luck', 'adulting can wait till noon', 'the cake said eat me first', 'milk counts as balance', 'and I blew out the candle again'] } },
  ],
  framesAny: [
    'I flipped {T} into a block party, everybody fed, everybody dancing',
    '{T} tried to rain on me, so I brought a slip-n-slide and a speaker',
    'I put {T} in the group chat and even grandma sent fire emojis',
    'turned {T} into lemonade and sold out the whole front porch',
    'I wear {T} like a new fit on the first warm day of the year',
    '{T} showed up gloomy, I introduced it to the cookout DJ',
    'I high-fived {T} so hard the whole neighborhood woke up smiling',
    'my recipe for {T}: extra seasoning, second helpings, no bad vibes',
    'I turned {T} into a parade and let the kids lead it',
    '{T} plus a little sunshine equals a story worth retelling',
    'I planted {T} in the yard and it grew back as a fruit tree',
    'we do not dodge {T} over here, we two-step right through it',
    'I put {T} on the fridge door, right next to the good drawings',
    '{T} came with clouds, I came with a kite and nowhere to be sad',
    'the {obj} {verb}, {det}, and the whole day leans sunny',
    'I brought {T} and the clouds clocked out early',
    'good news travels fast, but I jog next to it smiling',
    'the {obj} at {place} got everybody acting like family',
    'I keep a spare smile in my pocket for strangers and Mondays',
    'we turned an ordinary Tuesday into a story with a soundtrack',
    'the {obj} {verb} and even my worries took the day off',
    'sunshine follows me like it owes me money — the good kind',
    'I high-five the morning and the morning high-fives back',
    'put {T} on the calendar in pen, we celebrating properly',
    'the recipe is simple: good people, loud laugh, second helpings',
    '{det}, and the {obj} {verb} like it rehearsed it',
    'I dance in the kitchen and the floorboards keep the beat',
    'every cloud got a silver lining and I collect them like coupons',
  ],
  framesHook: [
    'hands up if the sun came out for you today',
    '{T} — say it like a celebration',
    'we up, we fed, we laughing — run it back',
    'good vibes only, and the vibes brought snacks',
    "it's a great day to have a great day, sing it",
    'whole crew shining and nobody dimming nobody',
    'joy looks good on us, wear it louder',
    'turn the music up, the neighbors already dancing',
  ],
  framesVerse: [
    'let me tell you about the {obj} at {place} and the day it saved',
    'started with a smile, ended with the whole street fed',
    'grandma said joy is a practice, so I practice daily',
    'the {obj} {verb} and I wrote it down before the feeling left',
    'we had nothing but time and made it taste like plenty',
    'picture this: {place}, everybody golden, nobody in a hurry',
    'I learned happiness has a sound and it sounds like this kitchen',
    'the moral of the story is seconds — always get seconds',
  ],
};

// ===== CLUB CLASSICS — the original Bar Card prompt flavors =====
TONE_PACKS.classics = {
  id: 'classics',
  label: 'CLUB CLASSICS',
  flavor: 'the original prompt deck, neutral ink',
  blurb: "The game's first prompt flavors — fire, night, borrowed time. Straight-ahead writing reps, no gimmick.",
  pool: {
    places: ['the basement', 'the late bus', 'the rooftop', 'the studio', 'the city', 'the last train'],
    objects: ['microphone', 'notebook', 'city light', 'old photograph', 'train ticket', 'payphone'],
    verbs: ['keeps the time', 'tells it plain', 'waits in the rain', 'holds the moment', 'never blinks', 'carries the weight'],
    details: ['like it happened yesterday', 'under a flickering light', 'with the city listening', 'before the beat drops', 'and nobody else knows', 'written in the margins'],
  },
  topics: [
    { name: 'Fire', imagery: {
      objects: ['match', 'candle', 'bonfire', 'sparks', 'kerosene heart'],
      places: ['the backyard', 'the barrel', 'the stage', 'the winter'],
      verbs: ['catches quick', 'spreads honest', 'warms the room', 'asks for more', 'refuses to die down'],
      details: ['struck in the dark', 'with everybody watching', 'and no water in reach', 'like it remembers being lightning'] } },
    { name: 'Night', imagery: {
      objects: ['streetlight', 'moon', 'last train', 'neon sign', 'owl hours'],
      places: ['the rooftop', 'the empty avenue', 'the all-night diner', 'the bridge'],
      verbs: ['belongs to us', 'hides the evidence', 'tells the truth', 'slows the city', 'keeps secrets'],
      details: ['after the city exhales', 'when the honest hours start', 'with the windows lit like dice', 'and the stars clocked in'] } },
    { name: 'Paranoia', imagery: {
      objects: ['rearview', 'locked door', 'static', 'silhouette', 'second shadow'],
      places: ['the stairwell', 'the parking lot', 'the hallway', 'the mirror'],
      verbs: ['checks twice', 'hears footsteps', 'trusts nothing', 'counts the exits', 'reads the room wrong'],
      details: ["and I can't prove a thing", 'with my back to the wall', 'every light a witness', 'for the third night running'] } },
    { name: 'Borrowed Time', imagery: {
      objects: ['loaned watch', 'library book', 'rented suit', 'spare key', 'hourglass'],
      places: ['the pawn shop', 'the waiting room', 'the borrowed car', 'the guest room'],
      verbs: ['ticks louder', 'comes due', 'fits like a promise', 'runs out politely', 'charges interest'],
      details: ['and the lender is patient', 'with the due date circled', 'every second signed for', 'like a song on its last chorus'] } },
    { name: 'Empty Pockets', imagery: {
      objects: ['lint', 'receipt', 'bus token', 'empty wallet', 'last dollar'],
      places: ['the checkout line', 'the payday loan window', 'the coat check', 'the corner'],
      verbs: ['tells the story', 'jingles like change', 'weighs nothing', 'remembers better days', 'still shows up'],
      details: ['and pride in the other pocket', 'turned out like a magic trick', 'with a receipt for proof', 'but the pen is full'] } },
    { name: 'Static', imagery: {
      objects: ['old TV', 'radio dial', 'dead channel', 'antenna', 'phone line'],
      places: ['the living room', 'the late dial', 'the rooftop antenna', 'the static hour'],
      verbs: ["says what words can't", 'fills the silence', 'crackles with memory', "won't tune in", 'broadcasts the feeling'],
      details: ['on a channel nobody owns', 'between two stations', 'like the past is calling', 'and I almost hear it clear'] } },
    { name: 'Bad Decisions', imagery: {
      objects: ['tattoo', "text sent at 2AM", 'last shot', 'car keys', "ex's number"],
      places: ['the parking lot', 'the last bar', 'the driveway', 'the group chat'],
      verbs: ['seemed right at midnight', 'ages like a story', 'still has my number', 'wears no regrets', 'taught the lesson twice'],
      details: ["and I'd probably do it again", 'with the evidence deleted', 'the story checks out', 'in permanent ink and hindsight'] } },
    { name: 'Concrete', imagery: {
      objects: ['sidewalk', 'high-rise', 'chalk drawing', 'curb', 'underpass', 'city block'],
      places: ['the corner', 'the underpass', 'the projects', 'the avenue'],
      verbs: ['keeps every secret', 'remembers every step', 'grows nothing but stories', 'holds the heat', 'never apologizes'],
      details: ['with our names carved in it', 'still wet with yesterday', 'under a thousand windows', 'and the city walking over it'] } },
  ],
  framesAny: [
    'the {obj} {verb}, {det}, and I write it down before it fades',
    'I came up through {place} with a pen and a reason',
    '{T} on my mind and the city humming under it',
    'every line I write is a brick, watch me build the house',
    'the {obj} at {place} knows the first draft of me',
    'I trade sleep for sentences and the exchange is worth it',
    'started with {T} and a notebook held together by hope',
    "the page don't judge, it just remembers everything",
    'I keep the {obj} close like a witness to the work',
    'some write for the charts, I write for the ones still listening',
    '{det}, the beat knocked and I let it in',
    "my story got chapters that the hook can't hold",
    "I put {T} in the first line so the verse can't run from it",
    'the {obj} {verb} and the pen just keeps up',
    'nights at {place} taught me more than any classroom',
    'I rhyme like rent is due because most months it is',
    'every lesson is a footnote and the story is the thesis',
    "I don't chase the moment, I document it honestly",
    "the {obj} in my pocket, a verse in my head, let's work",
    'they hear confidence, I hear practice — thousands of quiet hours',
    'I build the bar like a bridge: every word has to hold weight',
    "{T} again, because the first time I only scratched it",
    'the city writes half my material, I just take the credit',
    'I keep my circle small and my sentences smaller — say more with less',
    "a pen, a page, {place} — that's the whole studio",
    'when the beat goes quiet, the {obj} {verb} in my head',
  ],
  framesHook: [
    'this is for the ones still writing — say it back',
    "{T}, and we don't stop there",
    'pen up, head high, let the beat talk',
    'one more time for the back of the room',
    'we came to write, not to whisper',
    'hook it, loop it, live it — {T}',
    'the club is open and the page is warm',
    'say it like you mean it: {T}, again',
  ],
  framesVerse: [
    "verse two, and the {obj} {verb} like it's keeping score",
    'let the record show I started at {place} with nothing printed',
    'I annotate my life in the margins of the beat',
    'the first verse was the question, this one brought receipts',
    'I write the {obj} into every scene so the story stays honest',
    'pressure made the diamond and the diamond made the pen skip',
    'I catalog the nights at {place} like a librarian of almosts',
    'the outro is coming but the {obj} {verb} a little longer',
  ],
};

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
// Every word the topic discipline measure will credit: topic name words plus
// every word inside the topic's own imagery phrases.
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
//   verbs / details), built from the topic bank merged with the pack pool.
//   A bag empties before any image repeats, then it reshuffles.
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
  return shuffleCopy([...new Set(state.bank[key] || [])], state.rng);
}
function newSessionGen(packId, topicName, seed) {
  const pack = getPack(packId);
  if (!pack) return null;
  const topic = getTopic(pack, topicName);
  const bank = effectiveBank(pack, topic);
  const rng = seed === undefined || seed === null ? Math.random : mulberry32(seed);
  const state = {
    packId: pack.id, topicName: topic ? topic.name : '',
    rng, bank, bags: {},
    usedFrames: { hook: new Set(), verse: new Set() },
    dealt: [], // { pool, frame, bar, anchor } for every accepted candidate
  };
  for (const key of Object.values(SLOT_KEYS)) state.bags[key] = freshBag(state, key);
  return state;
}
function drawFromBag(state, key) {
  const src = state.bank[key] || [];
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
  const used = state.usedFrames[poolKey];
  if (used.size >= frames.length) used.clear(); // pool dealt through -> reshuffle
  const avail = [];
  for (let i = 0; i < frames.length; i++) if (!used.has(i)) avail.push(i);
  return avail[Math.floor(state.rng() * avail.length)];
}

// Deal 3 distinct candidate bars for one turn. Frames are section-aware
// (hook turns draw hook + shared frames; verse turns draw verse + shared).
// Bars are aimed at 8-14 syllables; the generator retries fills to land in
// range and falls back to the closest attempt rather than stalling.
// With opts.gen (a session state from newSessionGen) the deal draws from
// the session's frame pools and imagery bags, so nothing repeats across
// the session until it has to. Without one, the deal is a one-off that
// dedupes frames within the call only (original behavior).
function generateCandidates(packId, topicName, section, opts = {}) {
  const pack = getPack(packId);
  if (!pack) return [];
  const exclude = opts.exclude || new Set();
  const frames = framesForSection(pack, section);

  if (opts.gen) {
    const state = opts.gen, poolKey = poolKeyFor(section);
    const out = [], anchors = new Set();
    const seen = new Set(state.dealt.map(d => d.bar)); // no exact bar twice in a session
    let attempts = 0;
    while (out.length < 3 && attempts < 150) {
      attempts++;
      const fi = pickFrameIndex(state, frames, poolKey);
      state.usedFrames[poolKey].add(fi);
      // Work the frame before giving it up: refill it with fresh imagery
      // until a fill lands in syllable range with a free anchor, keeping
      // the first clean out-of-range fill as the fallback (range is a
      // target, not a wall). One fill per frame starved the long classic
      // frames, whose fills run long — this is what burned pools early.
      let accepted = null, fallback = null;
      for (let r = 0; r < 6 && !accepted; r++) {
        const filled = fillFrameFromGen(frames[fi], state);
        if (!filled.bar || out.includes(filled.bar) || exclude.has(filled.bar) || seen.has(filled.bar)) continue;
        if (filled.anchor && anchors.has(filled.anchor)) continue; // anchors stay split
        const syl = barSyllables(filled.bar);
        if (syl >= 8 && syl <= 14) accepted = filled;
        else if (!fallback) fallback = filled;
      }
      const chosen = accepted || fallback;
      if (!chosen) continue;
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
  TONE_PACKS, CHALLENGE_DEFS, DRILLS,
  countSyllables, barSyllables, endWord, rhymeKey, mulberry32,
  getPack, getTopic, effectiveBank, topicWords, barOnTopic,
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
