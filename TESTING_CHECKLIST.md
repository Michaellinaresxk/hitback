# Testing Checklist - Combo Notification

## Pre-Flight Check

### Backend
- [ ] Backend server running: `cd ../server && npm run dev`
- [ ] Backend accessible at: `http://192.168.1.10:3000`
- [ ] Health check passes: `curl http://192.168.1.10:3000/api/v2/game/health`

### Frontend
- [ ] Expo dev server running: `npx expo start`
- [ ] App connected to correct backend IP (check `services/GameSessionService.ts:11`)
- [ ] No TypeScript errors: `npx expo start` should show no red errors

## Functional Tests

### Test 1: Basic Combo (3 Consecutive Wins)
- [ ] Start new game with 2+ players
- [ ] Player 1 answers correctly Round 1
- [ ] Player 1 answers correctly Round 2
- [ ] Player 1 answers correctly Round 3
- [ ] **Expected:** Combo notification appears with "🔥 HIT MASTER!"
- [ ] **Expected:** Shows Player 1's name
- [ ] **Expected:** Auto-closes after 4 seconds
- [ ] **Expected:** Can manually close by tapping button

### Test 2: Streak Reset on Wrong Answer
- [ ] Player 1 answers correctly twice (streak = 2)
- [ ] Player 1 answers wrong (streak = 0)
- [ ] **Expected:** No combo notification
- [ ] Player 1 answers correctly 3 more times
- [ ] **Expected:** Combo appears after 3rd win

### Test 3: Multiple Players Independence
- [ ] Player 1 answers correctly twice
- [ ] Player 2 answers correctly once
- [ ] Player 1 answers correctly (3rd time)
- [ ] **Expected:** Player 1 gets combo, Player 2 doesn't
- [ ] **Expected:** Player 2's streak remains 1

### Test 4: Nobody Wins Round
- [ ] Player 1 answers correctly twice
- [ ] Round where nobody wins (all wrong)
- [ ] **Expected:** Player 1's streak resets to 0
- [ ] Player 1 must get 3 new consecutive wins for combo

## Visual/UI Tests

### Notification Appearance
- [ ] Modal appears in center of screen
- [ ] Golden background (#FFD700)
- [ ] Dark overlay behind modal
- [ ] Pulsing animation on appear
- [ ] Emoji (🔥) displays correctly
- [ ] "COMBO" title visible
- [ ] Combo name (HOT STREAK) visible
- [ ] Player name visible
- [ ] Description message visible
- [ ] Close button visible with "🎉 Awesome"

### Timing
- [ ] Notification stays visible for ~4 seconds
- [ ] Can be dismissed early by tapping button
- [ ] Game continues after notification closes

## Console Log Verification

### Backend Logs (Terminal running server)
Look for these messages:
```
🔥 player_1: +1 CORRECTA (racha: 1)
🔥 player_1: +1 CORRECTA (racha: 2)
🔥 player_1: +1 CORRECTA (racha: 3)
⚡ player_1: COMBO HOT_STREAK! Streak reseteado a 0
```

### Frontend Logs (Expo Console)
Look for:
```
🏆 Awarding points: {uuid} -> player_1
🔥 COMBO DETECTED: { type: 'HOT_STREAK', message: '...' }
```

## Edge Cases

### Multiple Combos in Same Game
- [ ] Player 1 gets first combo (3 wins)
- [ ] Player 1 answers 3 more consecutive correctly
- [ ] **Expected:** Second combo notification appears

### Different Players Getting Combos
- [ ] Player 1 gets combo
- [ ] Later, Player 2 gets combo
- [ ] **Expected:** Both notifications show correct player names

### Combo During Final Round
- [ ] Player gets combo on round that wins game
- [ ] **Expected:** Combo notification shows
- [ ] **Expected:** Game end modal shows after combo closes

## Performance Tests

- [ ] Notification doesn't lag game
- [ ] Animations are smooth (60fps)
- [ ] No memory leaks (multiple combos in one game)
- [ ] Works on iOS simulator
- [ ] Works on Android emulator (if available)
- [ ] Works on physical device

## Error Handling

### Backend Down
- [ ] Stop backend server
- [ ] Try to award points
- [ ] **Expected:** Error feedback, but no crash

### Malformed Response
- [ ] Backend returns comboStatus but missing fields
- [ ] **Expected:** Graceful fallback, no crash

## Regression Tests

### Other Features Still Work
- [ ] Betting still works
- [ ] Point awards still work
- [ ] Game end modal still works
- [ ] Audio playback still works
- [ ] Player scoreboard updates correctly

## Sign-Off

- [ ] All tests pass
- [ ] No console errors
- [ ] UI looks correct
- [ ] Performance is acceptable
- [ ] Ready for production

---

## Quick Test Command

To run backend tests:
```bash
cd ../server
npm test -- ComboTracker.test.js
```

To run manual test script:
```bash
cd ../server
node test-combo-scenario.js
```

## Notes

Record any issues found:
-
-
-

## Tested By

- **Name:** _______________
- **Date:** _______________
- **Device:** iOS / Android
- **Result:** PASS / FAIL
