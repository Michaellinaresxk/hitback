// gameFlow/syncHandlers.ts - VERSIÓN CORREGIDA
import { PlayerSyncData } from './types';
import { useGameStore } from '@/store/gameStore';

// ✅ Asegurar que la función retorna un objeto con syncPlayersWithStore
export const createSyncHandler = () => {
  const syncPlayersWithStore = (backendPlayers: PlayerSyncData[]): void => {
    console.log(`\n📊 ═══ SYNC PLAYERS START ═══`);
    console.log(`📊 Backend players received: ${backendPlayers.length}`);

    // Solo loggear si hay datos para no saturar
    if (backendPlayers.length > 0) {
      console.log(
        `📊 Backend data (primer jugador):`,
        JSON.stringify(backendPlayers[0], null, 2)
      );
    }

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
            // ✅ Asegurar que availableTokens se sincroniza
            availableTokens: backendPlayer.availableTokens || [],
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

  // ✅ IMPORTANTE: Retornar un objeto con syncPlayersWithStore
  return { syncPlayersWithStore };
};

// ✅ También exportar la función directamente para uso alternativo
export const syncPlayersWithStore = (
  backendPlayers: PlayerSyncData[]
): void => {
  const handler = createSyncHandler();
  handler.syncPlayersWithStore(backendPlayers);
};
