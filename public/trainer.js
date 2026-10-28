'use strict';
// BAR NONE Trainer — DOM wiring. All rules live in trainer-core.js; this
// file only paints and forwards clicks. Fully client-side: no sockets, no
// server calls, and an uploaded instrumental never leaves the device (it is
// played from a local object URL — not uploaded, not stored anywhere).
(function () {
  const T = window.BarNoneTrainer;
  if (!T) return;
  const t$ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let S = null;               // active writing session
  let beat = T.createBeatState();
  let beatOn = false;

  const fmtClock = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ================= Entry / exit =================
  t$('trainerBtn').onclick = () => {
    t$('join').style.display = 'none';
    t$('trainer').style.display = 'block';
    window.scrollTo(0, 0);
  };
  function exitTrainer() {
    stopBeat();
    if (S && S.clockInt) clearInterval(S.clockInt);
    t$('trainer').style.display = 'none';
    t$('join').style.display = 'block';
  }
  t$('trExit').onclick = exitTrainer;
  t$('trExit2').onclick = exitTrainer;

  // ================= Setup =================
  let selShape = 'song', selPack = 'darknotdead', selTopic = null;
  function drawTopic() {
    const pack = T.getPack(selPack);
    return pack.topics[Math.floor(Math.random() * pack.topics.length)].name;
  }
  function paintSetup() {
    t$('trShapeNote').textContent = { hook: 'Hook — 8 bars', verse: 'Verse — 8 bars', song: 'Full song — 20 bars: hook, verse, the hook comes back, verse 2' }[selShape];
    document.querySelectorAll('#trShapes button').forEach(b => { b.style.outline = b.dataset.shape === selShape ? '3px solid var(--blood)' : ''; });
    const pack = T.getPack(selPack);
    t$('trPacks').innerHTML = '';
    for (const p of Object.values(T.TONE_PACKS)) {
      const b = document.createElement('button');
      b.className = 'alt';
      b.textContent = p.label;
      if (p.id === selPack) b.style.outline = '3px solid var(--blood)';
      b.onclick = () => { selPack = p.id; selTopic = drawTopic(); paintSetup(); };
      t$('trPacks').appendChild(b);
    }
    t$('trPackNote').textContent = pack.blurb + ' Flavor: ' + pack.flavor + '.';
    t$('trTopicName').textContent = selTopic || '—';
  }
  document.querySelectorAll('#trShapes button').forEach(b => b.onclick = () => { selShape = b.dataset.shape; paintSetup(); });
  t$('trRedraw').onclick = () => { selTopic = drawTopic(); paintSetup(); };
  selTopic = drawTopic();
  paintSetup();
  t$('trStart').onclick = startSession;
  t$('trAgain').onclick = () => {
    if (S && S.clockInt) clearInterval(S.clockInt);
    S = null;
    t$('trScore').style.display = 'none';
    t$('trWrite').style.display = 'none';
    t$('trSoFar').style.display = 'none';
    t$('trSetupPanel').style.display = 'block';
    paintSetup();
  };

  // ================= Session flow =================
  function startSession() {
    S = {
      plan: T.sessionPlan(selShape), packId: selPack, topic: selTopic,
      gen: T.newSessionGen(selPack, selTopic), // session variety memory (frames + imagery bags)
      bars: [], phase: 'write', repriseDone: false, swapIndex: null,
      cands: [], curChallenge: null, dealt: 0, passed: 0, lockWarned: false,
      startedAt: Date.now(), clockInt: null,
    };
    S.clockInt = setInterval(paintProgress, 500);
    t$('trSetupPanel').style.display = 'none';
    t$('trScore').style.display = 'none';
    t$('trWrite').style.display = 'block';
    t$('trSoFar').style.display = 'block';
    dealTurn();
  }
  const curSection = () => S.plan.sections[S.bars.length]; // bars.length == next bar index
  const nextBarNo = () => S.bars.length + 1;

  function dealTurn() {
    S.phase = 'write';
    S.lockWarned = false;
    S.curChallenge = null;
    t$('trReprise').style.display = 'none';
    t$('trCands').style.display = '';
    t$('trRedeal').style.display = '';
    if (S.plan.challengeBars.includes(nextBarNo())) {
      const pack = T.getPack(S.packId), topic = T.getTopic(pack, S.topic);
      const keyWord = (T.topicWords(pack, topic).find(w => S.topic.toLowerCase().includes(w)) || T.topicWords(pack, topic)[0] || 'topic');
      S.curChallenge = T.dealChallenge(Math.random, { topicKey: keyWord });
      S.dealt++;
    }
    paintChallenge();
    dealCandidates();
    t$('trEdit').value = '';
    t$('trAttest').checked = false;
    t$('trMsg').textContent = '';
    paintSyl(); paintProgress(); paintBars();
  }

  function dealCandidates() {
    S.cands = T.generateCandidates(S.packId, S.topic, S.phase === 'reprise' ? 'hook' : curSection(), { gen: S.gen });
    t$('trCands').innerHTML = '';
    S.cands.forEach((c) => {
      const d = document.createElement('div');
      d.className = 'card k-bar cand';
      d.innerHTML = `<div class="t">${T.barSyllables(c)} syllables</div><div class="n" style="font-size:15px"></div><div class="x">Tap to load it into the box — then make it yours.</div>`;
      d.querySelector('.n').textContent = c;
      d.onclick = () => {
        t$('trEdit').value = c;
        t$('trCands').querySelectorAll('.card').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        paintSyl();
      };
      t$('trCands').appendChild(d);
    });
  }
  t$('trRedeal').onclick = () => dealCandidates();

  function paintChallenge() {
    const box = t$('trChallenge');
    if (!S.curChallenge) { box.style.display = 'none'; t$('trAttestRow').style.display = 'none'; return; }
    box.style.display = 'block';
    box.innerHTML = `<span class="stamp">Challenge — bar ${nextBarNo()}</span> <b>${esc(S.curChallenge.name)}</b><br>${esc(S.curChallenge.text)}` +
      (S.curChallenge.check ? '<br><span style="font-size:12.5px">This one gets counted automatically when you lock.</span>' : '<br><span style="font-size:12.5px">Honor system — check the box when the bar does it.</span>');
    t$('trAttestRow').style.display = S.curChallenge.check ? 'none' : 'block';
  }

  function paintSyl() {
    const v = t$('trEdit').value;
    let note = v.trim() ? `${T.barSyllables(v)} syllables` : '';
    if (S && S.curChallenge && S.curChallenge.check && S.curChallenge.check.kind === 'syllables')
      note += ` · challenge wants exactly ${S.curChallenge.check.n}`;
    t$('trSyl').textContent = note;
  }
  t$('trEdit').addEventListener('input', paintSyl);

  function paintProgress() {
    if (!S) return;
    const pack = T.getPack(S.packId);
    const where = S.phase === 'reprise' ? 'HOOK REPRISE — the hook comes back'
      : S.phase === 'done' ? 'DONE'
      : `Bar ${nextBarNo()} of ${S.plan.totalBars} · ${curSection().toUpperCase()}`;
    t$('trProg').innerHTML = `<b>${esc(pack.label)}</b> · Topic: <b>${esc(S.topic)}</b> · ${where} · Time ${fmtClock(Date.now() - S.startedAt)} · Challenges ${S.passed}/${S.dealt} landed`;
  }

  function paintBars() {
    if (!S) return;
    let lastSec = null, html = '';
    S.bars.forEach((b, i) => {
      if (b.section !== lastSec) { html += `<div class="vhead" style="margin-top:6px">${esc(b.section.toUpperCase())}</div>`; lastSec = b.section; }
      html += `<div class="vbar">${i + 1}. ${esc(b.text)}</div>`;
    });
    t$('trBars').innerHTML = html || '<div class="vbar" style="color:#777">No bars yet — the page is clean.</div>';
  }

  t$('trLock').onclick = () => {
    if (!S) return;
    if (S.phase === 'reprise') return lockReprise();
    const text = t$('trEdit').value.trim();
    if (!text) { t$('trMsg').textContent = 'The box is empty — tap a card, or write your own bar in it.'; return; }
    if (S.curChallenge) {
      const inst = S.curChallenge;
      const res = T.checkChallenge(inst, text, S.bars.length ? S.bars[S.bars.length - 1].text : '');
      let status;
      if (res === null) status = t$('trAttest').checked ? 'passed' : 'missed';
      else status = res ? 'passed' : 'failed';
      if (status === 'failed' && !S.lockWarned) {
        S.lockWarned = true;
        t$('trMsg').textContent = `That bar doesn't land "${inst.name}" yet — the count says no. Fix it, or hit Lock again to take the miss.`;
        return;
      }
      if (status === 'passed') S.passed++;
      S.curChallenge = null;
    }
    t$('trMsg').textContent = '';
    S.bars.push({ text, section: curSection() });
    advance();
  };

  function advance() {
    paintBars();
    if (S.plan.repriseAt && S.bars.length === S.plan.repriseAt && !S.repriseDone) return paintReprise();
    if (S.bars.length >= S.plan.totalBars) return finish();
    dealTurn();
  }

  // ---- Hook reprise: the 4 hook bars return; swap ONE or keep all four ----
  function paintReprise() {
    S.phase = 'reprise';
    S.swapIndex = null;
    t$('trCands').innerHTML = '';
    t$('trRedeal').style.display = 'none';
    t$('trChallenge').style.display = 'none';
    t$('trAttestRow').style.display = 'none';
    t$('trEdit').value = '';
    paintSyl(); paintProgress();
    const box = t$('trReprise');
    box.style.display = 'block';
    box.innerHTML = '<b>The hook comes back.</b> Same four bars open the second half — swap ONE if it grew a better idea, or keep all four.<br>';
    S.bars.slice(0, 4).forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = 'alt';
      btn.textContent = `Swap ${i + 1}: ${b.text}`;
      btn.onclick = () => {
        S.swapIndex = i;
        box.querySelectorAll('button').forEach(x => x.style.outline = '');
        btn.style.outline = '3px solid var(--blood)';
        dealCandidates();
        t$('trMsg').textContent = '';
      };
      box.appendChild(btn);
    });
    const keep = document.createElement('button');
    keep.textContent = 'Keep all four';
    keep.onclick = () => {
      S.repriseDone = true;
      t$('trMsg').textContent = '';
      dealTurn();
    };
    box.appendChild(keep);
  }
  function lockReprise() {
    const text = t$('trEdit').value.trim();
    if (S.swapIndex === null || S.swapIndex === undefined) { t$('trMsg').textContent = 'Pick the hook bar to swap first — or hit Keep all four.'; return; }
    if (!text) { t$('trMsg').textContent = 'The box is empty — tap a card, or write the swap yourself.'; return; }
    S.bars = T.applyReprise(S.bars, S.swapIndex, { text, section: 'hook' });
    S.swapIndex = null;
    S.repriseDone = true;
    t$('trMsg').textContent = '';
    paintBars();
    dealTurn();
  }

  // ================= Scorecard =================
  function beatNote() {
    if (beat.source === 'mine' && beat.ready)
      return `Beat: your instrumental — ${beat.fileName}${beat.bpm ? ' · ' + beat.bpm + ' BPM' : ''}${beat.loop ? ' · looped' : ''}`;
    return 'Beat: club board — default loop, 92 BPM';
  }
  function finish() {
    S.phase = 'done';
    clearInterval(S.clockInt);
    const pack = T.getPack(S.packId), topic = T.getTopic(pack, S.topic);
    const score = T.scoreSong({
      bars: S.bars, planned: S.plan.totalBars,
      topicWords: T.topicWords(pack, topic),
      challenges: { dealt: S.dealt, passed: S.passed },
    });
    const m = score.measures;
    const row = (label, val, max, note) => `<div class="scorerow"><span>${label} <span style="color:var(--ash)">${note}</span></span><b>${val}/${max}</b></div>`;
    t$('trScoreBody').innerHTML =
      `<div style="font-family:Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif; font-size:44px; letter-spacing:.08em">${score.total}<span style="font-size:18px; color:var(--ash)">/100</span></div>` +
      `<div style="font-size:12.5px; color:var(--ash); margin-bottom:8px">${esc(S.plan.label)} · ${esc(pack.label)} · Topic: ${esc(S.topic)} · ${fmtClock(Date.now() - S.startedAt)} · ${esc(beatNote())}<br>The total is just these five measurements added up — nothing else is in it.</div>` +
      row('Syllable steadiness', m.syllables, 25, `— avg ${score.syllables.mean} syllables/bar, avg drift ${score.syllables.spread}`) +
      row('End-rhyme matching', m.rhyme, 25, `— ${score.rhyme.rhymedCount} of ${S.bars.length} bars end in a rhyme family another bar answers`) +
      row('Topic discipline', m.topic, 20, `— ${score.topic.onTopicCount} of ${S.bars.length} bars name the topic or its imagery`) +
      row('Challenges', m.challenges, 20, `— ${score.challenges.passed} of ${score.challenges.dealt} landed`) +
      row('Completion', m.completion, 10, `— ${score.completion.locked} of ${score.completion.planned} bars locked`) +
      (score.strongest ? `<p style="font-size:13.5px"><b>Strongest bar (${score.strongest.index + 1}):</b> “${esc(score.strongest.bar)}”<br><span style="color:var(--ash)">${esc(score.strongest.reason)}</span></p>` : '') +
      (score.weakest ? `<p style="font-size:13.5px"><b>Weakest bar (${score.weakest.index + 1}):</b> “${esc(score.weakest.bar)}”<br><span style="color:var(--ash)">${esc(score.weakest.reason)}</span></p>` : '') +
      `<p style="font-size:13.5px"><span class="stamp">Next drill</span> <b>${esc(score.drill.name)}</b> — ${esc(score.drill.text)}</p>`;
    t$('trSongText').textContent = T.formatSongText({ bars: S.bars, shapeLabel: S.plan.label, packLabel: pack.label, topicName: S.topic });
    t$('trWrite').style.display = 'none';
    t$('trSoFar').style.display = 'none';
    t$('trScore').style.display = 'block';
    window.scrollTo(0, 0);
  }
  t$('trCopy').onclick = async () => {
    const text = t$('trSongText').textContent;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove();
    }
    t$('trCopyMsg').textContent = ok ? 'Copied — paste it anywhere.' : 'Copy failed — long-press the song text instead.';
    setTimeout(() => { t$('trCopyMsg').textContent = ''; }, 3000);
  };

  // ================= Beat: club board OR your own instrumental =================
  // Club: one default board (Heartbeat / Backbeat / Eighth Pulse / Sub
  // Anchor) on a 92 BPM loop through the same samples the game uses.
  // Mine: your file, played from a local object URL by Tone.Player.
  function trBarsToHits(bars, notes, len = 1) {
    const hits = [];
    bars.forEach((bar, b) => { let ni = 0; [...bar].forEach((ch, i) => { if (ch === 'x' || ch === 'X') hits.push({ s: b * 16 + i, n: notes ? notes[ni++ % notes.length] : null, l: len, v: ch === 'X' ? 1 : 0.9 }); }); });
    return hits;
  }
  const CLUB_BOARD = {
    KICK: { name: 'Heartbeat', hits: trBarsToHits(['x.....x.........', 'x.....x.........', 'x.....x.....x...', 'x.....x.........']) },
    SNARE: { name: 'Backbeat', hits: trBarsToHits(['....x.......x...', '....x.......x...', '....x.......x...', '....x.......x.x.']) },
    HATS: { name: 'Eighth Pulse', hits: trBarsToHits(['x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.']) },
    BASS808: { name: 'Sub Anchor', hits: trBarsToHits(['x...............', 'x...............', 'x...............', 'x...........x...'], [33, 33, 36, 33, 38, 31, 33, 41], 12) },
  };
  let clubInst = null, clubSched = null, clubTimer = null;
  function buildClub() {
    const master = new Tone.Gain(0.9).toDestination();
    const mk = (urls, gain) => { const s = new Tone.Sampler({ urls, baseUrl: '/samples/' }); if (gain && gain !== 1) s.connect(new Tone.Gain(gain).connect(master)); else s.connect(master); return s; };
    clubInst = { KICK: mk({ C1: 'kick.wav' }), SNARE: mk({ C2: 'snare.wav' }), HATS: mk({ C3: 'hat.wav', D3: 'hat-open.wav' }, 0.85), BASS808: mk({ A1: 'bass808.wav' }) };
  }
  function clubFire(h, time) {
    const v = clubInst[h.cat];
    if (!v || !v.loaded) return;
    try {
      if (h.cat === 'HATS') v.triggerAttackRelease((h.l || 1) >= 2 ? 'D3' : 'C3', 0.1, time, h.v * 0.8);
      else if (h.cat === 'BASS808') v.triggerAttackRelease(Tone.Frequency(h.n || 33, 'midi').toNote(), Math.max(0.08, (h.l || 1) * (60 / 92 / 4) * 0.95), time, h.v);
      else v.triggerAttackRelease(h.cat === 'KICK' ? 'C1' : 'C2', 0.25, time, h.v);
    } catch (e) { /* audio must never break the writing */ }
  }
  function clubTick() {
    if (!beatOn || !clubInst) return;
    const stepMs = 60000 / 92 / 4;
    if (!clubSched) clubSched = { step: 0, nextAt: performance.now() + 80 };
    while (clubSched.nextAt < performance.now() + 140) {
      const t = Tone.now() + Math.max(0, (clubSched.nextAt - performance.now()) / 1000);
      for (const h of window.BarNoneAudio.hitsAtStep(CLUB_BOARD, null, clubSched.step % 64)) clubFire(h, t);
      clubSched.step++;
      clubSched.nextAt += stepMs;
      if (clubSched.nextAt < performance.now() - 400) clubSched.nextAt = performance.now() + 60;
    }
  }
  function startClub() { if (!clubInst) buildClub(); clubSched = null; if (!clubTimer) clubTimer = setInterval(clubTick, 40); }
  function stopClub() { if (clubTimer) { clearInterval(clubTimer); clubTimer = null; } clubSched = null; }

  let minePlayer = null, mineUrl = null;
  async function ensureMinePlayer() {
    if (minePlayer || !mineUrl) return;
    minePlayer = new Tone.Player({ url: mineUrl, loop: beat.loop }).toDestination();
    await minePlayer.load();
  }

  async function startBeat() {
    if (typeof Tone === 'undefined') { t$('trBeatMsg').textContent = 'The audio engine did not load — writing still works, the beat is just off.'; return; }
    await Tone.start();
    if (beat.source === 'mine') {
      if (!beat.ready || !mineUrl) { t$('trBeatMsg').textContent = 'Pick an instrumental file first.'; return; }
      t$('trBeatBtn').textContent = 'Beat: LOADING';
      try { await ensureMinePlayer(); minePlayer.loop = beat.loop; minePlayer.start(); }
      catch (e) { t$('trBeatMsg').textContent = "Couldn't read that file — try another export (mp3 or wav)."; t$('trBeatBtn').textContent = 'Beat: OFF'; return; }
    } else {
      if (!clubInst) { buildClub(); t$('trBeatBtn').textContent = 'Beat: LOADING'; await Promise.race([Tone.loaded(), new Promise(r => setTimeout(r, 9000))]); }
      startClub();
    }
    beatOn = true;
    t$('trBeatBtn').textContent = 'Beat: ON';
    t$('trBeatMsg').textContent = '';
  }
  function stopBeat() {
    stopClub();
    try { if (minePlayer && minePlayer.state === 'started') minePlayer.stop(); } catch (e) {}
    beatOn = false;
    t$('trBeatBtn').textContent = 'Beat: OFF';
  }
  t$('trBeatBtn').onclick = () => { if (beatOn) stopBeat(); else startBeat(); };

  function paintBeat() {
    t$('trSrcClub').style.outline = beat.source === 'club' ? '3px solid var(--blood)' : '';
    t$('trSrcMine').style.outline = beat.source === 'mine' ? '3px solid var(--blood)' : '';
    t$('trFileInfo').textContent = beat.ready ? `Loaded: ${beat.fileName}` : '';
    t$('trBeatNote').textContent = beat.source === 'mine' && beat.ready
      ? `Your instrumental${beat.bpm ? ' · ' + beat.bpm + ' BPM' : ''} · ${beat.loop ? 'looping' : 'plays once through'} · stays on your device`
      : 'Club beat — one default board, 92 BPM, on loop. Or write over your own instrumental.';
  }
  t$('trSrcClub').onclick = () => {
    const was = beatOn;
    if (was) stopBeat();
    beat = T.selectBeatSource(beat, 'club');
    paintBeat();
    if (was) startBeat();
  };
  t$('trSrcMine').onclick = () => {
    t$('trUploadRow').style.display = 'block';
    if (beat.ready) {
      const was = beatOn;
      if (was) stopBeat();
      beat = T.selectBeatSource(beat, 'mine');
      paintBeat();
      if (was) startBeat();
    } else {
      t$('trBeatMsg').textContent = 'Pick your instrumental below — the club beat stays on till it loads.';
    }
  };
  t$('trFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    beat = T.setBeatFile(beat, { name: f.name });
    if (!beat.ready) { t$('trBeatMsg').textContent = beat.error; paintBeat(); return; }
    if (mineUrl) URL.revokeObjectURL(mineUrl);
    mineUrl = URL.createObjectURL(f);
    if (minePlayer) { try { minePlayer.dispose(); } catch (err) {} minePlayer = null; }
    const was = beatOn;
    if (was) stopBeat();
    beat = T.selectBeatSource(beat, 'mine');
    t$('trBeatMsg').textContent = '';
    paintBeat();
    if (was) startBeat();
  });
  t$('trLoop').addEventListener('change', (e) => {
    beat = T.setBeatLoop(beat, e.target.checked);
    if (minePlayer) minePlayer.loop = beat.loop;
    paintBeat();
  });
  t$('trBpm').addEventListener('change', (e) => { beat = T.setBeatBpm(beat, e.target.value); paintBeat(); });
  paintBeat();
})();
