# 🎵 HITBACK

> The live music quiz where every round is a power play.

HITBACK is a single-device party game for 2–8 players. A **Game Master** controls the app while everyone else plays physically — listening to song clips, placing bets, and using physical cards to flip the scoreboard.

---

## How It Works

One GM. One phone. Everyone competes out loud.

```
Select players → Bet tokens → Hear the clip → Question appears → GM awards the point
```

A short audio clip plays. Then a question appears on screen. The first player to answer correctly out loud wins the point — the GM decides who got it and taps their name. That's the core loop.

---

## Requirements

| Tool | Min Version |
|------|-------------|
| Node.js | 18+ |
| npm | 9+ |
| Expo CLI | 52+ |
| iOS / Android | Any recent version |

---

## Getting Started

### Frontend

```bash
cd hitback
npm install
npx expo start
```

| Key | Action |
|-----|--------|
| `i` | iOS Simulator |
| `a` | Android Emulator |
| Scan QR | Expo Go on your device |

### Backend

```bash
cd server
npm install
npm run dev
```

Runs on `http://localhost:3000`. Both must be running at the same time.

---

## Project Structure

```
hitback/
├── app/
│   ├── (tabs)/
│   │   ├── game.tsx              ← Main game screen (Game Master view)
│   │   ├── index.tsx             ← Lobby
│   │   └── settings.tsx
├── components/
│   ├── game/                     ← In-game UI components
│   ├── modal/                    ← Reaction card & game modals
│   ├── powercard/                ← Power card inventory & QR scanner
│   └── rewards/                  ← Combo notifications
├── constants/
│   ├── ReactionCard.ts           ← Card types & definitions
│   └── Game.ts                   ← Global constants
├── hooks/
│   ├── useGameFlow.ts            ← Round state machine
│   ├── useComboFlow.ts           ← Hot streak → QR scan → next turn
│   └── usePointsActions.ts       ← Points, alliances, featuring logic
├── services/
│   └── GameSessionService.ts     ← HTTP client to backend
├── store/
│   └── slices/                   ← Zustand state (slice pattern)
└── types/
    └── game.types.ts
```

---

## Round Flow

```
  ┌──────────┐    ┌───────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
  │  Betting  │ →  │ Audio │ →  │ Question │ →  │  Answer  │ →  │ Next Turn │
  └──────────┘    └───────┘    └──────────┘    └──────────┘    └───────────┘
```

Betting is optional and only available from round 2 onwards — always before the audio plays.

---

## Betting System

Before each round (starting from round 2), players can place one token bet:

| Token | Effect |
|-------|--------|
| **+1** | Adds 1pt to the value of a correct answer |
| **+2** | Adds 2pts to the value of a correct answer |
| **−3** | Adds 3pts to the value of a correct answer — high risk |

Each player starts with one of each token. **Once a token is used, it's gone for the rest of the game.** Wrong answer? The token is still consumed.

The final score for a correct answer is: `base points + token value`.

---

## Hot Streak & Power Cards

Answer 3 questions **correctly in a row** to trigger a **Hot Streak**.

- The streak must be consecutive — if another player answers first, the streak resets to zero
- When a Hot Streak is detected, a modal notifies the GM
- The GM scans a **physical Power Card** (QR code from the card deck)
- The card is added to that player's inventory
- The player can activate it at any time during the game

### Available Power Cards

| Card | Effect |
|------|--------|
| ⚡ **REPLAY** | Your next correct answer scores double |
| 🎪 **FESTIVAL** | All players gain +1pt instantly |

---

## Reaction Cards

After winning a round, a player draws a physical card from the Reaction Card deck. The GM selects the card type in the app and applies the effect immediately.

| Card | Target | Effect |
|------|--------|--------|
| ❄️ **MUTE** | Any player | Frozen for 1 round — skipped automatically |
| ⚔️ **DUEL** | One opponent | Only these two can score this round. Everyone else is locked out |
| 🛑 **STOP-BLAST** | Self | Only the holder can score the next round |
| 🎤 **FEATURING** | One player | If either player answers correctly, both receive 100% of the points |
| 🤝 **ALLIANCE** | One player | Points split 50/50 between allies for 3 rounds |
| 📜 **ROYALTIES** | Auto | Steal 1pt from the current leader |
| ©️ **COPYRIGHTS** | Last winner | That player loses 50% of the points they just earned |
| 🚫 **ARTIST HOLD** | Auto | The current leader is frozen for 2 rounds |
| 🎟️ **SOLD OUT** | Self | Gain +1pt instantly |
| 💔 **BAD REVIEW** | Any player | Target loses 1pt |
| 🤵 **MANAGEMENT FEE** | Self | Your manager takes their cut — you lose 1pt |
| 🎸 **CHARITY SHOW** | Auto | The leader donates 1pt to the player with the lowest score |

---

## Special Mechanics

### B-SIDE Comeback
After **4 consecutive scoreless rounds**, a player earns the B-SIDE badge. Their next correct answer automatically gets a **+1 bonus** on top of the normal points.

### DUEL
Two players go head-to-head for one round. Everyone else is locked out of scoring. Only the two dueling players appear in the answer selection screen.

### FEATURING
A one-time pact. If either featured player answers correctly, **both** receive the full points independently (100% each — not split).

### ALLIANCE
A 3-round pact. Points are split 50/50 between allies. A player cannot be in two active alliances simultaneously.

---

## Environment Variables

Create a `.env` file in `hitback/` to override the backend URL:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v2/game
```

Defaults to `localhost:3000`.

---

## Architecture Notes

- **Single-device GM model** — No WebSocket sync. One phone, one source of truth.
- **Reaction Cards are frontend-only** — Applied locally in Zustand, then synced to the backend via `PATCH /session/:id/players/:playerId/score` to prevent score drift on the next sync.
- **Power Cards are backend-validated** — Require QR scan → backend validation before being added to a player's inventory.
- **Audio** — 30-second previews via the Deezer API. The backend handles all Deezer integration; the frontend never calls Deezer directly.
- **ID mapping** — The backend uses sequential IDs (`player_1`, `player_2`). The frontend generates UUIDs. `playerIdMap` bridges the two at runtime.

For full architecture docs, sync patterns, and debugging guide:

**→ [HITBACK_DEV_GUIDE.md](../HITBACK_DEV_GUIDE.md)**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Expo 52 · React Native · TypeScript |
| State | Zustand (slice pattern) |
| Navigation | Expo Router (file-based) |
| Audio | expo-av |
| Camera | expo-camera (QR scanning) |
| Backend | Node.js · Express |
| Music | Deezer API |

---
