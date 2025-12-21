import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createPlayerSlice } from './slices/playerSlice';
import { createGameSlice } from './slices/gameSlice';
import { createCardSlice } from './slices/cardSlice';
import { createUISlice } from './slices/uiSlice';
import { createBackendSlice } from './slices/backendSlice';
import { GameState } from './types/gameStoreTypes';

export const useGameStore = create<GameState>()(
  devtools((...args) => ({
    ...createPlayerSlice(...args),
    ...createGameSlice(...args),
    ...createCardSlice(...args),
    ...createUISlice(...args),
    ...createBackendSlice(...args),
  }))
);
