// store/slices/cardSlice.ts
import { StateCreator } from 'zustand';
import type { GameStore, Card } from '../types/gameStoreTypes';

export const createCardSlice = ((
  set,
  get,
  ..._rest
) => ({
  currentCard: null,
  speedRoundCards: [],
  speedRoundAnswers: {},

  scanCard: async (qrCode: string, gameCard?: Card) => {
    try {
      console.log(`📱 Scanning card: ${qrCode}`);

      set({
        isScanning: true,
        error: null,
        audioFinished: false,
        showQuestion: false,
        showAnswer: false,
      });

      if (gameCard) {
        set({
          currentCard: gameCard,
          isScanning: false,
          backendConnected: true,
          lastBackendCheck: new Date().toISOString(),
        });
      } else {
        throw new Error('Card data not provided');
      }
    } catch (error) {
      console.error('❌ Error in scanCard:', error);
      set({
        isScanning: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        backendConnected: false,
      });
    }
  },
})) satisfies StateCreator<GameStore, [], [], Partial<GameStore>>;
