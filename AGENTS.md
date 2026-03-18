# AGENTS.md - HitBack App

## Project Overview

- **Type**: Expo/React Native mobile app (iOS/Android/Web)
- **Language**: TypeScript
- **State Management**: Zustand with slice pattern
- **Routing**: expo-router (file-based routing in `app/` directory)
- **i18n**: i18next + react-i18next
- **Testing**: No formal test framework currently configured (manual testing only)

---

## Build / Lint / Run Commands

### Development
```bash
npm start           # Start Expo dev server
npx expo start      # Same as above
npx expo start --web    # Run web version
npx expo start --android  # Run Android
npx expo start --ios     # Run iOS simulator
```

### Linting
```bash
npm run lint        # Run ESLint via expo lint
npx expo lint       # Same as above
```

### Type Checking
```bash
npx tsc --noEmit    # Run TypeScript compiler check
```

### Installing Dependencies
```bash
npm install         # Install all dependencies
npm install <package>   # Add new dependency
npm install -D <package>  # Add dev dependency
```

---

## Project Structure

```
app/                    # expo-router pages (file-based routing)
  (tabs)/               # Tab-based screens
  _layout.tsx           # Root layout
  +not-found.tsx       # 404 page

components/            # React components (organized by feature)
  game/                # Game-related components
  modal/               # Modal components
  powercard/           # Power card components
  rewards/             # Reward/notification components
  ui/                  # Reusable UI primitives
  tabs_components/     # Tab bar components

store/                 # Zustand state management
  slices/              # Store slices (player, game, card, ui, backend, alliance)
  gameStore.ts         # Main store combining all slices

hooks/                 # Custom React hooks
  useGameFlow.ts       # Game flow logic
  useGameTurnActions.ts
  useBettingActions.ts
  useComboFlow.ts
  usePointsActions.ts

services/              # External API services
  GameSessionService.ts
  RewardsService.ts
  PowerCardService.ts

helpers/               # Utility functions
  gameFlow/            # Game flow helpers
  playerHelpers.ts
  gameUI.helpers.ts

constants/             # App constants (Colors, Points, Betting, etc.)

types/                 # TypeScript type definitions

i18n/                  # Internationalization config and translations
```

---

## Code Style Guidelines

### TypeScript

- **Always use TypeScript** - No plain JavaScript files
- **Strict mode enabled** in `tsconfig.json`
- Use explicit types for function parameters and return values when not obvious
- Use `interface` for object shapes, `type` for unions/intersections
- Use `any` sparingly - prefer `unknown` if type is truly unknown

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `PlayerScoreboard.tsx` |
| Hooks | camelCase with `use` prefix | `useGameFlow.ts` |
| Interfaces/Types | PascalCase | `PlayerScoreboardProps` |
| Constants | PascalCase or UPPER_SNAKE | `SCORE_TO_WIN`, `Colors` |
| Files (utilities) | camelCase | `gameUI.helpers.ts` |
| Zustand stores | camelCase with `use` prefix | `useGameStore` |
| State slice functions | camelCase | `addPlayer`, `updateScore` |

### Import Style

- **Use path alias `@/`** for project imports:
  ```typescript
  import { useGameStore } from '@/store/gameStore';
  import { Player } from '@/types/game.types';
  ```
- **Group imports** in this order:
  1. React/Expo imports
  2. Third-party library imports
  3. Internal component imports
  4. Type imports
  5. Relative path aliases

### Component Structure

Follow this pattern for components:

```typescript
// 1. Imports
import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import type { Player } from '@/types/game.types';

// 2. Types/Interfaces
interface ComponentNameProps {
  // props
}

// 3. Main Component (default export)
export default function ComponentName({
  prop1,
  prop2 = defaultValue,
}: ComponentNameProps) {
  // 4. Hooks first
  const store = useGameStore((s) => s.selector);

  // 5. Logic
  const value = useMemo(() => ..., []);

  // 6. Render
  return (
    <View>
      <Text>...</Text>
    </View>
  );
}
```

### Comments

- Use clear, descriptive comments in Spanish with emojis
- Section dividers:
  ```typescript
  // ═══════════════════════════════════════════════════════════════════════════
  // NOMBRE DE SECCIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  ```
- Mark completed items with ✅, pending with ⚠️

### Error Handling

- Use `try/catch` for async operations
- Store errors in state (e.g., `currentError` in game state)
- Display user-friendly error messages via modals/notifications
- Log errors to console for debugging

### Zustand Store Pattern

```typescript
// store/slices/playerSlice.ts
import type { StateCreator } from 'zustand';
import type { GameStore } from '@/types/game.types';

export const createPlayerSlice: StateCreator<GameStore, [], [], GameStore> = (set, get) => ({
  // Initial state
  players: [],
  // Actions
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),
});
```

---

## Common Patterns

### Conditional Rendering
```typescript
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}
```

### State Selectors (Zustand)
```typescript
// Specific selector for performance
const score = useGameStore((s) => s.players.find(p => p.id === id)?.score);

// Full store access when needed
const { players, phase } = useGameStore();
```

### Platform-Specific Code
```typescript
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
```

---

## Notes for Agents

1. **Backend IP**: Check `services/GameSessionService.ts:11` for local development IP
2. **Backend Required**: Many features require the backend server running at `http://192.168.1.10:3000`
3. **Manual Testing**: Use the checklist in `TESTING_CHECKLIST.md` for feature testing
4. **No Test Framework**: Add Jest/Vitest if implementing automated tests
5. **ESLint Config**: Uses `eslint-config-expo` - do not override without good reason
