// store/slices/uiSlice.ts
import { StateCreator } from 'zustand';
import { GameStore } from '../types/gameTypes';

export const createUISlice: StateCreator<GameStore, [], [], UISlice> = (
  set
) => ({
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
});
