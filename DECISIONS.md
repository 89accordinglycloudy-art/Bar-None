# BAR NONE — Decisions Log

Single source of truth for build rules. If a rule isn't in here, it isn't in the game.
Status of section 1: LOCKED Oct 26, 2026 — Nate green-lit the build, framing BAR NONE as an NRP product. Individual calls stay changeable until code depends on them; any change gets logged here.

## 1. V1 locks (proposed)

- Players: 2–4 per room. Room codes, display names, no accounts. Win streaks in browser localStorage.
- Stack: Node + Socket.IO server (authoritative state), plain HTML/JS client, Tone.js for audio. Single Render service.
- Turn: draw 1 Sound + 1 Action → play or discard the Sound Card (playing it draws +1 Action) → card plays → write bar → end turn, hand limit 4.
- Card limits per turn: max 1 Bar Card + max 1 tactical (help/sabotage/defense/wild) card.
- Timers: 15s decisions, 45s writing (v1; tune in playtest).
- Timeout: typed text auto-submits; empty box locks a frozen bar ("[froze]"). Random timeout resolution only ever picks legal moves. The match can never stall.
- Every bar requires a Bar Card. Prompt use is honor system; voters enforce.
- Flow challenges attach to the player's next bar as a displayed requirement (honor system, judged by voters).
- Endgame: first to 8 bars triggers final round — every other player gets exactly one more turn — then voting. No self-votes. Tie → whoever completed their verse first wins.
- Beat: fixed 92 BPM, 4/4. Sound patterns are 4-bar step-grid data. Changes activate at the next bar boundary on a shared timeline.
- Sound replacement: a played Sound Card replaces the active pattern in its category, or adds the category if inactive. Setup deals 3 distinct categories.
- REVERSE = active pattern in the targeted category plays in reverse step order for one 4-bar cycle. Manipulation effects last one 4-bar cycle, do not stack with themselves, and fizzle (card spent, no effect) if their target category is inactive.
- Defense cards: played on your own turn, persist as a shield that blocks one sabotage, then are consumed. (No out-of-turn reaction windows in v1.)
- Decks: empty deck reshuffles its discard pile.
- Card content v1: 52 Bar Card prompts (20 easy / 20 medium / 12 hard), 12 flow challenges, tactical cards (help 10 / sabotage 14 / defense 6 / wild 6) implemented as ~10 parameterized effect types. Sound deck: 48 pattern cards (8 categories × 6: 3 standard, 2 unstable, 1 cursed) + 8 manipulation cards.
- Deadline reality: playable + deployed by Oct 30 (Oct 31 = Springfield haul; Nov 1 = submission buffer).

## 2. Day-2 build clarifications (Oct 26, 2026 — from implementation)

- Playing a Bar Card moves the turn straight into the writing phase. A tactical card must be played BEFORE the Bar Card if the player wants both in one turn.
- A played Flow Challenge attaches its requirement to the player's next bar (this turn's if they write one, otherwise the next bar they write).
- Manipulation/board effects are tracked by the engine with an 8-turn duration as a proxy for "one 4-bar cycle" until the Day-4 audio engine counts real bars.
- Timeout on the sound decision = coin flip play/discard; timeout discarding at hand limit = random discards. Both only ever pick legal resolutions.
- Endgame trigger is live (first to 8 → each other player gets one final turn). Winner by vote lands Day 5; until then the finisher is the placeholder winner.
- Audio sync model (Day 4): the server stamps a beat epoch at match start; every client starts its step clock against that epoch at 92 BPM, and pattern/effect changes promote on each client's next bar line. Phase alignment is as tight as the devices' clock skew (fine on one network); the effect logic (mute/breakdown/reverse/flip/tempo) is unit-tested, the synth voices get their verdict in the first two-device playtest.

## 3. Presentation + brief requirements (Oct 26, 2026)

- **Card materials (Nate, Oct 26): the Action deck is sticky notes; the Sound deck is index cards.** Bar prompts are scrawled sticky notes (handwritten-style type, tape strip, crooked), tactical/flow cards are tinted stickies by kind; sound cards and the beat board are ruled index cards with the red header rule — the beat is catalogued like a crate, the bars are scribbled and stuck to the wall.
- **Style direction (Nate): Fight Club / underground grime.** Basement palette (coal black, bone paper, blood red), condensed stencil-style headers, typewriter mono body, torn-paper cards, stamped board effects. No slime/ooze (standing art rule).
- **Handshake brief (from Nate's screenshots of the mission):** (1) at least two players join from separate devices; (2) the game has real rules a player can follow without the host explaining them → the client carries a House Rules panel on the entry screen; (3) it must be live at a URL other people can actually reach → Render deploy is a hard requirement, not polish.
- The mission flow runs through ChatGPT Work on Nate's side (design/checklist/publish steps in Handshake); this build supplies the game + live URL that the mission publishes.

## 4. Deferred past v1

- Accounts / Supabase / persistent cross-session stats
- Out-of-turn counter-play windows
- Casual/competitive timer modes
- Card art; physical-print export
