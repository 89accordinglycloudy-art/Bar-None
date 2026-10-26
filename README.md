# BAR NONE

An underground writing fight. A multiplayer lyric-writing card game by Noctis Ritus Productions.

Players race to write an 8-bar verse off prompt cards while a shared beat mutates under them — Sound Cards swap the patterns in the beat, tactical cards help, sabotage, and shield, and every turn runs against a clock that resolves without you if you freeze. First to 8 bars triggers the last round; then the room votes on the verses.

## Run it

```
npm install
npm start        # http://localhost:3000
```

Create a room, share the 4-letter code, start the fight from a second device. Press **Sound: OFF** in the Beat panel to turn the beat on (browsers require one tap before audio).

## Tests

```
node test/audio.test.js   # beat effect logic
node test/smoke.js        # rooms / lobby / turns
node test/smoke2.js       # full match engine (needs server running with fast timers)
node test/smoke3.js       # streak start + voting (BN_VERSE_TARGET=2)
```

## Deploy (Render)

The repo carries a `render.yaml` blueprint: on Render, **New → Blueprint** (or New → Web Service pointed at this repo) and it configures itself — Node runtime, `npm install`, `npm start`, health check at `/health`. Free tier sleeps when idle; the first hit after a nap takes ~30s to wake.

## Rules

The design's single source of truth is `DECISIONS.md`. The short version is on the game's front page as the House Rules.
