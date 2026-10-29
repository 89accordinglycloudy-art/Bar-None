'use strict';
// BAR NONE Trainer — CONTENT BANK. This file is data only: tone packs,
// topics, imagery banks, and bar frames. No logic lives here — the engine
// is public/trainer-core.js, which reads this bank (window.BarNoneBank in
// the browser, a require() in Node) and refuses to boot without it.
//
// THE DROP RITUAL (the Living Bank): a fresh content drop edits ONLY this
// file. Append a dated DROP section at the bottom (push new frames /
// topics / imagery onto the packs, the way the 2026-10-28.1 drop below
// does), then bump bankMeta.version. The engine, the page, and the tests
// never change for a drop — that is the whole point of the split.
//
// Frames use slots {obj} {place} {verb} {det} filled from the pack's
// imagery (session dealing draws from the FLAT bank — every topic's
// imagery plus the pool; the drawn topic is a theme the writer aims at,
// never a tag on the dealt cards) and {T} = the drawn topic's name.
// Ghost-bank lines from the game are adapted with {P} -> {T} where the
// flavor fits (DEAD MIC -> TALK SHIT, SUNNY D -> SUNNY SIDE, screened
// GHOST-9 lines -> DARK, NOT DEAD with the death imagery cut).

const bankMeta = {
  version: '2026-10-28.1',
  note: 'Initial Living Bank split + first expansion drop: bank moved out of trainer-core.js; every pack grown to a 72-frame verse pool and 72-frame hook pool; 2 new topics each for TALK SHIT, SUNNY SIDE, CLUB CLASSICS; imagery widened across the three thin packs.',
};

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


// =====================================================================
// DROP 2026-10-28.1 — first Living Bank expansion
// =====================================================================
// Grows every pack to a 72-frame verse pool / 72-frame hook pool so a
// FULL SONG (48 verse + 12 hook candidates) never exhausts fresh frames,
// adds 2 topics each to TALK SHIT / SUNNY SIDE / CLUB CLASSICS, and
// widens imagery across the thin packs. Future drops: append another
// dated section exactly like this one and bump bankMeta.version.

// --- helpers for drops: widen one topic's imagery, in place ---
function dropWiden(pack, topicName, add) {
  const t = (pack.topics || []).find(x => x.name === topicName);
  if (!t) return;
  for (const key of Object.keys(add)) t.imagery[key].push(...add[key]);
}
function dropWidenPool(pack, add) {
  for (const key of Object.keys(add)) pack.pool[key].push(...add[key]);
}

// ===== DARK, NOT DEAD +27 frames (pools 51 -> 72) — still zero death imagery =====
TONE_PACKS.darknotdead.framesAny.push(
  'the {obj} {verb} and the whole room pretends not to hear it',
  'I budget my worries like groceries — the essentials only, and they still cost too much',
  '{T} got a forwarding address straight to my chest',
  'the {place} after midnight has a way of telling the truth',
  'I keep the {obj} where I can see it — trust is a luxury item now',
  'every month the math gets louder and the paycheck gets quieter',
  'I answer {T} the way you answer a knock at 3AM — careful, and already tired',
  'the walls at {place} are thin and my situation is not a secret',
  'I wear my worry like a work shirt — every day, washed, worn again',
  'the {obj} {verb}, {det}, and sleep stays on the other side of the door',
  'I stopped checking the mail like it owes me an apology — it just owes me',
  'hard times keep a calendar and my name is circled in red',
  'the quiet in this house has a weight and I carry it room to room',
  'I learned to read a shut-off notice like a weather report',
  'the {obj} by the door is the first thing the morning argues with',
);
TONE_PACKS.darknotdead.framesHook.push(
  'say it plain — the bills are loud but I am louder',
  '{T} knocking and I answer on my feet',
  'no sleep, no slack, still here — chant it back',
  'the dark is just a room and I know every corner of it',
  'count the hours, count me in — I do not clock out',
  'this house is heavy and I carry it singing',
);
TONE_PACKS.darknotdead.framesVerse.push(
  'it started with a letter I was scared to open for a week',
  'I did the math at {place} till the numbers started apologizing',
  'mama kept the envelopes in a drawer and her worries off her face',
  'the shift ended and the {obj} {verb} like it had a shift too',
  'I wrote my worries on a receipt and the receipt ran out of paper',
  'picture the kitchen at 4AM, just me and the arithmetic of almost',
);

// ===== TALK SHIT +44 frames (pools 38 -> 72), +2 topics, imagery widened =====
TONE_PACKS.talkshit.framesAny.push(
  'I got fans in rooms I have never even walked into yet',
  'your whole personality is a feature you forgot to clear with me',
  'I make it look easy because hard is my natural habitat',
  'the {obj} {verb} — Google it, the results are just me',
  'I turned my haters into a street team, they promote me for free',
  'my warm-up verse got your album doing damage control',
  'I am not cocky, I am just correct in a loud voice',
  'they tried to rank me and the {obj} ran out of numbers',
  'I sign autographs with the hand I counted money with',
  'your best bar rents a room inside my throwaways',
  'I put {T} on a pedestal — mine, everything I touch goes up',
  'I do not argue with the scoreboard, the scoreboard argues for me',
  'they study my cadence like homework and still hand it in late',
  'I came from the cheap seats and bought the building, {det}',
  'my pen got a waiting list and your verse is not on it',
  'I make mirrors nervous — even they know I look better',
  'call the {obj} a witness, it saw the whole glow-up',
  'I turned doubters into groupies with one verse and a smirk',
  'your favorite song wishes it was my interlude',
  'I do victory laps in rooms I have not entered yet',
  'the crown is not heavy when your neck was built for it',
  'I talk cash and the {obj} {verb} like it agrees with me',
  'they want the blueprint, I charge by the brick',
  'I am the reason the group chat has a mute button and a fan club',
);
TONE_PACKS.talkshit.framesHook.push(
  'run it up — the scoreboard loves me back',
  'too nice with it, say it twice with it',
  'I win loud, I win often — put it on a shirt',
  'crown check, mirror check — still me, still winning',
  'they talk, I tally — say the tally with me',
  'undefeated and unbothered, chant it till it echoes',
  'my name in their mouth like a sponsor — free promo',
  'winners do not whisper — turn my hook up',
  'I make the {place} say my name like roll call',
  'talk shit, back it up — that is the whole chorus',
);
TONE_PACKS.talkshit.framesVerse.push(
  'verse one was a warning, this one is the invoice',
  'I keep my old doubters in a frame at {place} — labeled before',
  'the {obj} {verb} and even my shadow walks taller',
  'I practiced on the ones who laughed, now they quote the practice',
  'heard your freestyle in the car — the silence drove us home',
  'I do not count sheep, I count the ones who counted me out',
  'every verse is a brick and I just bought the whole block',
  'they asked who wrote it, I pointed at the mirror and it bowed',
  'I put my pen through college on verses alone, {det}',
  'the come-up was quiet, so the flex had to be loud',
);
TONE_PACKS.talkshit.topics.push(
  { name: 'Trophy Case Too Small', imagery: {
    objects: ['trophy case', 'gold plaque', 'ribbon wall', 'engraved plate', 'championship belt', 'display shelf', 'first-place medal', 'photo finish'],
    places: ['the hallway', 'the living room', 'the trophy wall', "the winner's wall", 'the office wall', 'above the fireplace'],
    verbs: ['ran out of room', 'needs an addition', 'gets dusted weekly', 'makes guests quiet', 'tells the whole story', 'still has space issues', 'glows under the light', 'argues with the new one'],
    details: ['the new one goes on top', 'we are adding a wing', 'dusting takes an afternoon', 'and the shelf bows a little', 'visitors ask, I just shrug', 'insurance knows about it'] } },
  { name: 'MVP of the Family Function', imagery: {
    objects: ['family poll', 'potato salad trophy', 'reunion shirt', "uncle's scorecard", 'grill tongs', 'cousin highlight reel', 'folding throne', "grandma's verdict"],
    places: ['the family reunion', 'the cookout', 'the group photo', 'the family chat', 'the head of the table', 'the photo wall'],
    verbs: ['got voted in early', 'never in doubt', 'gets announced yearly', 'runs the function', 'holds the record', 'signs the reunion shirts', 'wins without campaigning', 'collects the compliments'],
    details: ['grandma counted the votes herself', 'the cousins already conceded', 'three years running', 'and I did not even cook', 'the shirt says it so I do not have to', 'undefeated at functions'] } },
);
dropWiden(TONE_PACKS.talkshit, 'Payday Flex', {
  objects: ['overtime slip', 'bonus envelope'], places: ['the steakhouse', 'the shoe store'],
  verbs: ['got direct-deposited in style', 'made the budget jealous'],
  details: ['the waiter already knows my order', 'and the card never declined'] });
dropWiden(TONE_PACKS.talkshit, 'Worst to First', {
  objects: ['last-place photo', 'most improved plaque'], places: ['the reunion', 'the old classroom'],
  verbs: ['autographed the yearbook', 'thanks the rankings'],
  details: ['the before photo does the talking', 'seated with the champions now'] });
dropWiden(TONE_PACKS.talkshit, 'My Pen vs Yours', {
  objects: ['fountain pen', 'spiral notebook'], places: ['the library', 'the battle stage'],
  verbs: ['writes in calligraphy', 'never needs a draft two'],
  details: ['yours ran out of ink mid-verse', 'mine signed the margin too'] });
dropWiden(TONE_PACKS.talkshit, 'Undefeated in the Group Chat', {
  objects: ['muted thread', 'victory screenshot'], places: ['the cousin chat', 'the work chat'],
  verbs: ['took the last word and framed it', 'got reacted into legend'],
  details: ['the lurkers saw everything', "somebody's still typing since Tuesday"] });
dropWiden(TONE_PACKS.talkshit, 'Landlord of the Booth', {
  objects: ['master key', 'tenant list'], places: ['the hallway', 'the control room'],
  verbs: ['approves every session', 'collects verses as rent'],
  details: ['quiet hours do not apply to me', 'the deposit was your best verse'] });
dropWiden(TONE_PACKS.talkshit, 'Too Loud for the Library', {
  objects: ['megaphone', 'overdue notice'], places: ['the front steps', 'the youth section'],
  verbs: ['got a section named after the problem', 'echoes past the stacks'],
  details: ['the shush has given up', 'story time asked for an encore'] });

// ===== SUNNY SIDE +46 frames (pools 36 -> 72), +2 topics, imagery widened =====
TONE_PACKS.sunnyside.framesAny.push(
  'I put sprinkles on a regular day and called it a holiday',
  'the {obj} {verb}, {det}, and my smile got there before me',
  'we measure wealth in plates passed and stories retold',
  'I taught the rain to wait till after the cookout',
  '{T} energy got the whole street doing the two-step',
  'I keep sunshine in the glove box for emergencies and Mondays',
  'the mailman stayed for a plate and now he is family',
  'I turned a traffic jam into a drum circle at the red light',
  'good mood so loud the neighbors asked for the playlist',
  'I water my plants and my friendships on the same schedule',
  'the {obj} at {place} started a rumor that today is a good day',
  'we do potluck like it is a competitive sport and everybody wins',
  'I laugh first, ask questions after dessert',
  'my umbrella is just confetti waiting for an excuse',
  'the kids drew me in chalk like a neighborhood landmark',
  'I bring extra chairs and main-character sunshine',
  '{T} plus my people equals a holiday nobody declared',
  'I wave at strangers till they forget why they were mad',
  'the grill smoke writes my name over the whole block',
  'we turned leftovers into a second party with better stories',
  'I keep a compliment loaded for whoever walks past',
  'the sprinkler is running and so is my good mood',
  'I put {T} on the group calendar with three exclamation points',
  'sunshine is free and I still tip generously',
  'the {obj} {verb} and even the grumpy neighbor cracked a smile',
  'I end every day like a cookout — full, loud, and grateful',
);
TONE_PACKS.sunnyside.framesHook.push(
  'sun is out, plates are full — sing it like you mean it',
  'we laugh loud over here — join in or enjoy the show',
  'good day, great people, no notes — run it back',
  'hands up for the ones who brought a chair and a story',
  'joy is the dress code and we all overdressed',
  '{T} — say it like the ice cream truck is coming',
  'we shining politely and dancing impolitely',
  'smile check, plate check — everybody passes',
  'the block is singing and the chorus is seconds',
  'turn it up — happiness sounds better loud',
);
TONE_PACKS.sunnyside.framesVerse.push(
  'it started with one folding chair and a speaker with opinions',
  'auntie judged the potato salad like an Olympic event',
  'the {obj} {verb} and I wrote the day down in marker',
  'we raced the streetlights home and let them win on purpose',
  'someone brought a karaoke machine and the porch became a stadium',
  'I learned the electric slide from a man in church shoes',
  'the story gets better every time grandpa tells it, {det}',
  'we had ice, we had time, we had everybody we needed',
  'picture {place} at golden hour — nobody reaching for a phone',
  'the moral of the cookout: bring a chair, leave with family',
);
TONE_PACKS.sunnyside.topics.push(
  { name: 'Ice Cream Truck Diplomacy', imagery: {
    objects: ['ice cream truck', 'rocket pop', 'change jar', 'menu picture', 'jingle', 'sprinkles', 'napkin stack', 'freezer chest'],
    places: ['the whole block', 'the corner', 'the cul-de-sac', 'every driveway', 'the playground fence', 'the apartment steps'],
    verbs: ['ends arguments', 'unites the block', 'takes exact change and IOUs', 'knows every kid by order', 'slows down for everybody', 'settles all debates', 'runs a fair line', 'makes change and peace'],
    details: ['the jingle is our national anthem', 'nobody argues holding a rocket pop', 'even the grumpy neighbor has a usual', 'diplomacy tastes like sprinkles', 'the line moves like a family', 'world peace, one block at a time'] } },
  { name: 'Sprinkler Season', imagery: {
    objects: ['lawn sprinkler', 'garden hose', 'wet sneakers', 'kiddie pool', 'beach towel', 'water bill', 'slip-n-slide', 'popsicle sticks'],
    places: ['the front yard', 'the driveway', 'the sidewalk', 'the whole block', 'the cul-de-sac', 'the porch'],
    verbs: ['opens the season', 'soaks everybody equally', 'turns the lawn into a park', 'runs till dinner', 'makes its own rainbow', 'drafts every kid on the block', 'keeps the grass and the mood green', 'splashes the mailman too'],
    details: ['shirts optional, joy mandatory', 'the grass has never been happier', 'we time it to the heat', 'and the dog supervises', 'official sport of the street', 'season tickets are free'] } },
);
dropWidenPool(TONE_PACKS.sunnyside, {
  places: ['the splash pad', 'the farmers market'], objects: ['kiddie pool', 'frisbee'],
  verbs: ['brings the good ice', 'knows the words to every chorus'],
  details: ['with sunscreen on one ear', 'and a cooler that never empties'] });
dropWiden(TONE_PACKS.sunnyside, 'Payday Friday', {
  objects: ['fresh socks', 'movie tickets'], places: ['the arcade', 'the ice cream stand'],
  verbs: ['treated the whole crew', 'said yes to dessert first'],
  details: ['the fridge did a happy dance', 'and tomorrow can wait its turn'] });
dropWiden(TONE_PACKS.sunnyside, 'Block Party', {
  objects: ['extension cord', 'cooler'], places: ['the alley', 'the church lot'],
  verbs: ['needed two grills', 'taught the mailman the two-step'],
  details: ['the permit was a handshake', 'rain checked itself out of respect'] });
dropWiden(TONE_PACKS.sunnyside, 'Sunday Cookout', {
  objects: ['apron', 'secret sauce'], places: ['the picnic table', 'the shade'],
  verbs: ['blesses the grill first', 'saves the last rib debate for dessert'],
  details: ['the sauce recipe stays classified', 'napkins are just formalities'] });
dropWiden(TONE_PACKS.sunnyside, 'Emotional Support Alligator', {
  objects: ['tiny hat', 'appointment card'], places: ['the dentist office', 'the bus stop'],
  verbs: ['accepts walk-ins', 'charges in snacks'],
  details: ['his schedule is booked through summer', 'emotional support, zero paperwork filed'] });
dropWiden(TONE_PACKS.sunnyside, 'Haunted Self-Checkout', {
  objects: ['loyalty card', 'paper receipt'], places: ['the frozen aisle', 'the parking lot'],
  verbs: ['remembers my usual', 'beeps in a judging tone'],
  details: ['it printed a receipt longer than my arm', 'the coupon expired out of spite'] });
dropWiden(TONE_PACKS.sunnyside, 'Gas Station Sushi', {
  objects: ['energy drink', 'lottery ticket'], places: ['pump three', 'the cooler door'],
  verbs: ['pairs well with bad decisions', 'has its own fan club of truckers'],
  details: ['the cashier raised one eyebrow', 'five stars from a man named Skeeter'] });
dropWiden(TONE_PACKS.sunnyside, 'Found Money in Last Years Coat', {
  objects: ['gift card', 'chapstick'], places: ['the glove compartment', 'the coat check'],
  verbs: ['expired but still spent', 'smelled like cedar and luck'],
  details: ['the gift card had four dollars of destiny', 'past me deserves a thank-you note'] });
dropWiden(TONE_PACKS.sunnyside, 'Birthday Cake for Breakfast', {
  objects: ['sprinkles', 'second candle'], places: ['the couch', 'the porch steps'],
  verbs: ['pairs with coffee like a pro', 'makes cereal jealous'],
  details: ['the frosting mustache is mandatory', 'breakfast of champions, literally'] });

// ===== CLUB CLASSICS +48 frames (pools 34 -> 72), +2 topics, imagery widened =====
TONE_PACKS.classics.framesAny.push(
  'the {obj} {verb}, {det}, and the night files it under true',
  'I learned the city by its shortcuts and its closed doors',
  '{T} in the headline, my name in the fine print — for now',
  'every streetlight is a period at the end of a long sentence',
  'I write on the last train with the city half asleep',
  'the page is a witness and it has never once lied for me',
  'I carry {place} in my walk, you can hear it in the cadence',
  'borrowed light, borrowed time, owned outright by the verse',
  'the {obj} in my hand weighs more than the story so far',
  'I trade verses for memories and keep the change in metaphors',
  'some nights the beat is just the city breathing through a vent',
  'I put the whole block in a couplet and the couplet held',
  'the pen is honest even when the mirror negotiates',
  'I stack plain truths till they look like a skyline',
  '{T} started as a rumor and ended as the record',
  'I do not decorate the truth, I just give it better lighting',
  'the {obj} {verb} while the avenue holds its breath',
  'every writer I respect started with a borrowed pen',
  'I keep the receipts of my life in rhyme form',
  'the city is a draft and I am still revising my district',
  'night school taught me: {T}, then everything after',
  'I measure the year in songs I almost did not write',
  'a plain line at the right moment outshines a loud one',
  'the {place} after hours belongs to whoever is still writing',
  'I put my name on the margin and the margin made room',
  'truth sounds better unmixed, straight off the notebook',
  'I chase the sentence, not the spotlight — it finds me anyway',
  'when the words run out, the {obj} {verb} one more time',
);
TONE_PACKS.classics.framesHook.push(
  'for the ones who write it down — say it back',
  'one city, one pen, one more chorus',
  'we keep it plain, we keep it true — run it',
  '{T} — then say what comes after',
  'the night is listening, give it something honest',
  'page warm, city loud — that is the whole hook',
  'say it like a headline: we were here, we wrote it',
  'no gimmicks, just the record — sing it plain',
  'the club remembers every honest line',
  'ink first, everything else second — chorus rules',
);
TONE_PACKS.classics.framesVerse.push(
  'the second verse opens at {place} where the first one left off',
  'I file the night under lessons and the lessons under lyrics',
  'the {obj} {verb} like a metronome with a memory',
  'I wrote the address of my youth in the margin of the beat',
  'every chorus I ever loved started as a voice note',
  'the record shows a borrowed pen and an owned voice',
  'I cross the city with a notebook like a passport',
  'the outro waits its turn while the {obj} keeps time',
  'I argue with the first draft till the second one wins',
  'plain ink, heavy meaning — that is the family recipe',
);
TONE_PACKS.classics.topics.push(
  { name: 'Encore', imagery: {
    objects: ['house lights', 'raised hands', 'last song', 'set list', 'stage door', 'echoing room', 'one more chant', 'mic stand'],
    places: ['the stage', 'the front row', 'the doorway', 'the lit exit', 'the balcony', 'backstage'],
    verbs: ['was not in the plan', 'brings the lights back', 'asks for one more', 'makes the night longer', 'answers the chant', 'refuses to be the ending', 'stands up on its own', 'echoes after the doors'],
    details: ['nobody reached for their coat', 'the room decided, not the set list', 'one more means one more', 'and the singer smiled like a witness', 'the night signed its name twice', 'written in raised hands'] } },
  { name: 'Half-Light', imagery: {
    objects: ['porch light', 'long shadows', 'screen door', 'first star', 'streetlight waking', 'last bus window', 'dinner smoke', 'quiet avenue'],
    places: ['the porch', 'the avenue', 'the kitchen window', 'the walk home', 'the stoop', 'the bridge'],
    verbs: ['splits the day in two', 'makes everything honest', 'slows the block down', 'turns the city gold', 'asks nothing loudly', 'lets the noise settle', 'stretches every shadow', 'belongs to nobody and everybody'],
    details: ['between the shift and the song', 'when the honest hour clocks in', 'half day, half promise', 'and the streetlights take the night shift', 'the color of almost', 'written in gold and gray'] } },
);
dropWidenPool(TONE_PACKS.classics, {
  places: ['the night market', 'the platform edge'], objects: ['paperback', 'street map'],
  verbs: ['keeps a steady hand', 'tells it twice, better'],
  details: ['in the second draft of the night', 'with the margins full'] });
dropWiden(TONE_PACKS.classics, 'Fire', {
  objects: ['ember', 'strike-anywhere match', 'ash line'], places: ['the fire escape', 'the winter stoop'],
  verbs: ['keeps a coal alive', 'writes in sparks', 'outlives the rain'],
  details: ['smoke signals from the block', 'and the cold took notes'] });
dropWiden(TONE_PACKS.classics, 'Night', {
  objects: ['blinds', 'curfew bell', 'blue hour'], places: ['the viaduct', 'the rooftop garden'],
  verbs: ['pays in quiet', 'keeps the ledger of stars', 'walks without a map'],
  details: ['when the city dreams out loud', 'and the moon co-signs'] });
dropWiden(TONE_PACKS.classics, 'Paranoia', {
  objects: ['peep hole', 'deadbolt', 'window latch'], places: ['the landing', 'the back stairs'],
  verbs: ['triple-checks the lock', 'maps every exit', 'hears the house settle wrong'],
  details: ['with the chain on the door', 'and the lights rehearsed'] });
dropWiden(TONE_PACKS.classics, 'Borrowed Time', {
  objects: ['borrowed ladder', 'library card', 'rented room'], places: ['the loan office', 'the layaway counter'],
  verbs: ['runs on credit and nerve', 'signs for every hour', 'spends it like it matters'],
  details: ['with the meter always running', 'and no refunds on yesterday'] });
dropWiden(TONE_PACKS.classics, 'Empty Pockets', {
  objects: ['button', 'bus schedule', 'borrowed pen'], places: ['the dollar store', 'the night window'],
  verbs: ['makes change out of nothing', 'still tips in kindness', 'counts what counts'],
  details: ['rich in everything but money', 'and the notebook stays full'] });
dropWiden(TONE_PACKS.classics, 'Static', {
  objects: ['rabbit ears', 'shortwave', 'cracked screen'], places: ['the basement couch', 'the garage radio'],
  verbs: ['talks in weather reports', 'keeps the old songs', 'fuzzes at the edges'],
  details: ['a voice from the county over', 'and the dial remembers'] });
dropWiden(TONE_PACKS.classics, 'Bad Decisions', {
  objects: ['casino chip', 'matching tattoo', 'voicemail'], places: ['the tattoo parlor', 'the courthouse steps'],
  verbs: ['doubles down smiling', 'tells the story first', 'never learns on schedule'],
  details: ['the group chat has the footage', 'in the permanent record of stories'] });
dropWiden(TONE_PACKS.classics, 'Concrete', {
  objects: ['chalk line', 'manhole cover', 'front stoop'], places: ['the basketball court', 'the loading dock'],
  verbs: ['holds a thousand summers', 'grows legends in the cracks', 'never sleeps, just settles'],
  details: ['initials in the wet pour', 'and the block signs its name daily'] });

// ---------- Exports (same dual pattern as the engine) ----------
const BarNoneBank = { bankMeta, TONE_PACKS };
if (typeof window !== 'undefined') window.BarNoneBank = BarNoneBank;
if (typeof module !== 'undefined') module.exports = BarNoneBank;
