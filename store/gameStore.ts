import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createPlayerSlice } from './slices/playerSlice';
import { createGameSlice } from './slices/gameSlice';
import { createCardSlice } from './slices/cardSlice';
import { createUISlice } from './slices/uiSlice';
import { createBackendSlice } from './slices/backendSlice';

import { createAllianceSlice } from './slices/allianceSlice';
import { GameStore } from '@/types/game.types';

export const useGameStore = create<GameStore>()(
  devtools((...args) => ({
    ...createPlayerSlice(...args),
    ...createGameSlice(...args),
    ...createCardSlice(...args),
    ...createUISlice(...args),
    ...createBackendSlice(...args),
    ...createAllianceSlice(...args),
  })),
);
