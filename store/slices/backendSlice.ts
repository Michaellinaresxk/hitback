// store/slices/backendSlice.ts
import { StateCreator } from 'zustand';
import { audioService } from '@/services/audioService';
import type { GameStore } from '@/store/types/gameStoreTypes';

export const createBackendSlice = ((set, ..._rest) => ({
  backendConnected: false,
  lastBackendCheck: null,

  checkBackendConnection: async (): Promise<boolean> => {
    try {
      const isConnected = await audioService.testConnection();
      set({
        backendConnected: isConnected,
        lastBackendCheck: new Date().toISOString(),
      });
      return isConnected;
    } catch (error) {
      set({
        backendConnected: false,
        lastBackendCheck: new Date().toISOString(),
      });
      return false;
    }
  },

  syncWithBackend: async () => {
    try {
      const [connectionInfo] = await Promise.all([
        audioService.getConnectionInfo(),
      ]);
      set({
        backendConnected: connectionInfo.backendConnected,
        lastBackendCheck: new Date().toISOString(),
      });
    } catch (error) {
      set({ backendConnected: false });
    }
  },
})) satisfies StateCreator<
  GameStore,
  [],
  [],
  Partial<GameStore>
>;
