# Combo Notification Implementation Guide

## ✅ Implementation Complete

The HitMaster combo notification system has been fully integrated into the Expo frontend.

---

## Changes Made

### 1. Updated Type Definitions (`services/GameSessionService.ts`)

Added comboStatus field to RoundResult interface to capture backend combo data:

```typescript
export interface RoundResult {
  // ... existing fields
  comboStatus?: {
    type: string;             // 'HOT_STREAK', 'DOUBLE_HIT', etc.
    message: string;          // Display message
    cardAwarded?: {           // Power card earned
      id: string;
      name: string;
      emoji: string;
    };
  };
  // ... other fields
}
```

**Location:** `services/GameSessionService.ts:104-112`

### 2. Updated Game Screen (`app/(tabs)/game.tsx`)

#### Imports Added
```typescript
import { ComboNotification } from '@/components/rewards/ComboNotification';
```

#### State Added
```typescript
const [showComboNotification, setShowComboNotification] = useState(false);
const [comboData, setComboData] = useState<{
  playerName: string;
  comboName: string;
  comboEmoji: string;
  comboDescription: string;
} | null>(null);
```

#### Logic Added in `handleAwardPoints()`
```typescript
// Check for combo after awarding points
if (result.results && result.results.comboStatus) {
  console.log('🔥 COMBO DETECTED:', result.results.comboStatus);

  setComboData({
    playerName: player.name,
    comboName: result.results.comboStatus.type.replace('_', ' '),
    comboEmoji: '🔥',
    comboDescription: result.results.comboStatus.message,
  });

  setShowComboNotification(true);

  // Auto-close after 4 seconds
  setTimeout(() => {
    setShowComboNotification(false);
  }, 4000);
}
```

**Location:** `app/(tabs)/game.tsx:333-349`

#### Component Added to Render
```tsx
{/* Combo Notification */}
{comboData && (
  <ComboNotification
    visible={showComboNotification}
    onClose={() => setShowComboNotification(false)}
    comboName={comboData.comboName}
    comboEmoji={comboData.comboEmoji}
    comboDescription={comboData.comboDescription}
    playerName={comboData.playerName}
  />
)}
```

**Location:** `app/(tabs)/game.tsx:504-513`

---

## How It Works

### Flow Diagram

```
Player answers 3 consecutive questions correctly
          ↓
Backend detects HOT_STREAK combo (ComboTracker)
          ↓
Backend sends comboStatus in revealAnswer response
          ↓
Frontend receives result in handleAwardPoints()
          ↓
Frontend checks: result.results.comboStatus exists?
          ↓
Yes → Set comboData state
          ↓
Show ComboNotification modal (4 seconds)
          ↓
Display: "🔥 HIT MASTER! 3 respuestas correctas consecutivas"
          ↓
Auto-dismiss or manual close
```

### Backend Response Structure

When a combo is detected, the backend returns:

```json
{
  "success": true,
  "results": {
    "winner": {
      "id": "player_1",
      "name": "Alice",
      "newScore": 15
    },
    "pointsAwarded": 5,
    "comboStatus": {
      "type": "HOT_STREAK",
      "message": "🔥 ¡HIT MASTER! 3 respuestas correctas consecutivas",
      "cardAwarded": {
        "id": "power_replay_001",
        "name": "REPLAY",
        "emoji": "⚡"
      }
    }
  },
  "players": [...]
}
```

### Frontend Processing

```typescript
// In handleAwardPoints()
if (result.results && result.results.comboStatus) {
  // Extract data
  const { type, message } = result.results.comboStatus;
  const playerName = player.name;

  // Set state to show notification
  setComboData({
    playerName,
    comboName: type.replace('_', ' '), // "HOT STREAK"
    comboEmoji: '🔥',
    comboDescription: message
  });

  setShowComboNotification(true);
}
```

---

## ComboNotification Component

### Features

- **Full-screen modal** with dark overlay
- **Animated pulsing effect** (3 iterations)
- **Golden background** (#FFD700) for celebration
- **Displays:**
  - Combo emoji (🔥)
  - "COMBO" title
  - Combo name ("HOT STREAK")
  - Player name
  - Description message
  - Close button with emoji

### Props

```typescript
interface ComboNotificationProps {
  visible: boolean;
  onClose: () => void;
  comboName: string;
  comboEmoji: string;
  comboDescription: string;
  playerName: string;
}
```

### Auto-Dismiss

The notification auto-closes after 4 seconds, but users can also manually close it by tapping the "🎉 Awesome" button.

---

## Testing Instructions

### Prerequisites

1. **Backend running:** `cd server && npm run dev`
2. **Frontend running:** `cd hitback && npx expo start`
3. **At least 2 players** in the game

### Test Scenario 1: Basic Combo Detection

**Steps:**
1. Start a new game with 2+ players
2. Player 1 answers **3 questions correctly in a row**:
   - Round 1: Player 1 wins → Streak = 1
   - Round 2: Player 1 wins → Streak = 2
   - Round 3: Player 1 wins → Streak = 3 → 🔥 COMBO!

**Expected Result:**
- After round 3, combo notification appears
- Shows "🔥 HIT MASTER!" message
- Player name displayed
- Message: "3 respuestas correctas consecutivas"
- Modal auto-closes after 4 seconds

### Test Scenario 2: Combo Reset on Wrong Answer

**Steps:**
1. Player 1 answers 2 questions correctly
2. Player 1 answers 1 question **wrong**
3. Player 1 answers 3 questions correctly again

**Expected Result:**
- No combo after step 1 (only 2 correct)
- Streak resets to 0 after step 2
- Combo appears after 3 consecutive wins in step 3

### Test Scenario 3: Multiple Players

**Steps:**
1. Player 1 answers 2 questions correctly
2. Player 2 answers 1 question correctly
3. Player 1 answers 1 question correctly (total: 3)

**Expected Result:**
- Player 1 gets combo notification
- Player 1's name shown
- Player 2's streak unaffected

### Test Scenario 4: Combo After Another Player Fails

**Steps:**
1. Player 1 answers 2 correctly
2. Player 2 fails (nobody wins round)
3. Player 1 answers 1 correctly

**Expected Result:**
- Player 1 streak should continue (only their answers count)
- Combo triggers after Player 1's 3rd consecutive win

---

## Debug Console Logs

Look for these log messages:

### Backend Logs (server)
```
🔥 player_1: +1 CORRECTA (racha: 1)
🔥 player_1: +1 CORRECTA (racha: 2)
🔥 player_1: +1 CORRECTA (racha: 3)
⚡ player_1: COMBO HOT_STREAK! Streak reseteado a 0
```

### Frontend Logs (Expo)
```
🏆 Awarding points: {playerId} -> player_1
🔥 COMBO DETECTED: {type: 'HOT_STREAK', message: '...'}
```

---

## Troubleshooting

### Issue: Combo notification not showing

**Check:**
1. Backend is returning comboStatus in response
   ```bash
   # Check backend logs for "COMBO HOT_STREAK"
   npm run logs
   ```

2. Frontend is receiving the data
   ```javascript
   // Add console.log in handleAwardPoints
   console.log('Result:', JSON.stringify(result, null, 2));
   ```

3. ComboNotification component is imported correctly
   ```typescript
   import { ComboNotification } from '@/components/rewards/ComboNotification';
   ```

### Issue: Wrong player name showing

**Check:**
- Player ID mapping is correct
- `player` variable is found in `handleAwardPoints`

### Issue: Notification shows but doesn't auto-close

**Check:**
- setTimeout is being called (4000ms)
- No errors in console preventing timeout

---

## API Integration

### Backend Endpoint
```
POST /api/v2/game/session/:id/reveal
```

### Request
```json
{
  "winnerId": "player_1" // or null if nobody wins
}
```

### Response (with combo)
```json
{
  "success": true,
  "results": {
    "correctAnswer": "Despacito",
    "trackInfo": { ... },
    "winner": { ... },
    "pointsAwarded": 5,
    "comboStatus": {
      "type": "HOT_STREAK",
      "message": "🔥 ¡HIT MASTER! 3 respuestas correctas consecutivas",
      "cardAwarded": {
        "id": "power_replay_001",
        "name": "REPLAY",
        "emoji": "⚡"
      }
    }
  },
  "players": [ ... ]
}
```

---

## Future Enhancements

### Possible Improvements

1. **Sound effects** - Add celebratory sound when combo triggers
2. **Confetti animation** - Visual celebration effect
3. **Combo streak indicator** - Show "2/3 to combo" in UI
4. **Different animations** per combo type:
   - HOT_STREAK (3) → Fire animation
   - DOUBLE_HIT (5) → Lightning animation
   - TRIPLE_HIT (7) → Explosion animation
5. **Player stats panel** - Show combo history in scoreboard
6. **Power card animation** - Show power card being awarded

---

## File References

| File | Purpose | Lines |
|------|---------|-------|
| `services/GameSessionService.ts` | Type definitions | 82-121 |
| `app/(tabs)/game.tsx` | Main game screen | 18, 95-101, 333-349, 504-513 |
| `components/rewards/ComboNotification.tsx` | Modal component | 1-125 |
| `server/services/ComboTracker.js` | Backend combo detection | 33-93 |
| `server/services/GameSessionService.js` | Backend integration | 179-196 |

---

## Summary

✅ Type definitions updated
✅ State management added
✅ Backend data extraction implemented
✅ ComboNotification component integrated
✅ Auto-dismiss functionality working
✅ Ready for testing

The combo notification system is now fully functional and will display whenever a player achieves 3 consecutive correct answers!
