// store/slices/uiSlice.ts
import { StateCreator } from 'zustand';
import type { GameStore } from '../types/gameStoreTypes';

export const createUISlice = ((set, ..._rest) => ({
  isScanning: false,
  error: null,
  timerInterval: null,
  audioFinished: false,
  showQuestion: false,
  showAnswer: false,
  showGameEndModal: false,

  setAudioFinished: (finished: boolean) => set({ audioFinished: finished }),
  setShowQuestion: (show: boolean) => set({ showQuestion: show }),
  setShowAnswer: (show: boolean) => set({ showAnswer: show }),
  setShowGameEndModal: (show: boolean) => set({ showGameEndModal: show }),
  setScanning: (scanning: boolean) => set({ isScanning: scanning }),
  setError: (error: string | null) => set({ error }),
})) satisfies StateCreator<GameStore, [], [], Partial<GameStore>>;
