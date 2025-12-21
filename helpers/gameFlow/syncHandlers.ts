// gameFlow/syncHandlers.ts
import { PlayerSyncData } from './types';
import { useGameStore } from '@/store/gameStore';

export const createSyncHandler = () => {
  const syncPlayersWithStore = (backendPlayers: PlayerSyncData[]): void => {
    console.log(`\n📊 ═══ SYNC PLAYERS START ═══`);
    console.log(`📊 Backend players received: ${backendPlayers.length}`);
    console.log(`📊 Backend data:`, JSON.stringify(backendPlayers, null, 2));

    useGameStore.setState((state) => {
      console.log(`📊 Local players count: ${state.players.length}`);

      const updatedPlayers = state.players.map((localPlayer, index) => {
        const backendPlayer = backendPlayers[index];

        if (backendPlayer) {
          const scoreChanged = localPlayer.score !== backendPlayer.score;
          const tokensChanged = localPlayer.tokens !== backendPlayer.tokens;

          if (scoreChanged || tokensChanged) {
            console.log(
              `   ✅ ${localPlayer.name} [${index}]: ` +
                `score ${localPlayer.score}→${backendPlayer.score}, ` +
                `tokens ${localPlayer.tokens}→${backendPlayer.tokens}`
            );
          } else {
            console.log(`   ℹ️ ${localPlayer.name} [${index}]: sin cambios`);
          }

          return {
            ...localPlayer,
            score: backendPlayer.score,
            tokens: backendPlayer.tokens,
          };
        }

        console.log(
          `   ⚠️ No backend data for index ${index} (${localPlayer.name})`
        );
        return localPlayer;
      });

      console.log(`📊 ═══ SYNC PLAYERS END ═══\n`);
      return { players: updatedPlayers };
    });
  };

  return { syncPlayersWithStore };
};
