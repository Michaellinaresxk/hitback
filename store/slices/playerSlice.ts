import { StateCreator } from 'zustand';
import { GameStore, Player } from '../types/gameTypes';
import { SCORE_TO_WIN } from '@/constants/Points';

export const createPlayerSlice: StateCreator<GameStore, [], []> = (
  set,
  get
) => ({
  players: [],

  addPlayer: (name: string) => {
    const { players } = get();

    if (name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (players.length >= 8) {
      throw new Error('Máximo 8 jugadores');
    }

    if (
      players.some((p) => p.name.toLowerCase() === name.toLowerCase().trim())
    ) {
      throw new Error('Ya existe un jugador con ese nombre');
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      score: 0,
      isCurrentTurn: false,
      availableTokens: [1, 2, 3], // ✅ Cada jugador tiene sus propios tokens
      powerCards: [],
      currentBet: 0,
      isImmune: false,
      boostActive: false,
      peekUsed: false,
      consecutiveWins: 0,
      cardTypeStreaks: {},
      difficultyStreaks: {},
    };

    set((state) => ({
      players: [...state.players, newPlayer],
      error: null,
    }));

    console.log(`✅ Player added: ${newPlayer.name} with tokens [1, 2, 3]`);
  },

  removePlayer: (id: string) => {
    set((state) => {
      const removedPlayer = state.players.find((p) => p.id === id);
      const newPlayers = state.players.filter((p) => p.id !== id);
      const currentPlayerIndex = state.players.findIndex((p) => p.id === id);

      let newCurrentTurn = state.currentTurn;
      if (currentPlayerIndex <= state.currentTurn && newPlayers.length > 0) {
        newCurrentTurn = Math.max(0, state.currentTurn - 1);
      }

      console.log(`❌ Player removed: ${removedPlayer?.name}`);

      return {
        players: newPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  placeBet: (playerId: string, tokenValue: number) => {
    console.log(`🎯 placeBet called: ${playerId} -> ${tokenValue}`);

    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player) {
        console.error('❌ Player not found');
        return { ...state, error: 'Jugador no encontrado' };
      }

      console.log(`🎯 Player found: ${player.name}`);
      console.log(
        `🎯 Available tokens: [${player.availableTokens.join(', ')}]`
      );
      console.log(`🎯 Token to use: ${tokenValue}`);
      console.log(
        `🎯 Is token available: ${player.availableTokens.includes(tokenValue)}`
      );

      if (!player.availableTokens.includes(tokenValue)) {
        console.error(`❌ Token +${tokenValue} not available`);
        return {
          ...state,
          error: `Token +${tokenValue} ya fue usado o no disponible`,
        };
      }

      console.log(`🪙 ${player.name} usa token +${tokenValue}`);
      console.log(`   Tokens antes: [${player.availableTokens.join(', ')}]`);

      const newAvailableTokens = player.availableTokens.filter(
        (t) => t !== tokenValue
      );

      console.log(`   Tokens después: [${newAvailableTokens.join(', ')}]`);

      const updatedPlayers = state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            availableTokens: newAvailableTokens,
            currentBet: tokenValue,
          };
        }
        // ✅ NO MODIFICAR LOS TOKENS DE OTROS JUGADORES
        return p;
      });

      console.log(
        `🎯 Updated players state:`,
        updatedPlayers.map(
          (p) =>
            `${p.name}: tokens=[${p.availableTokens.join(',')}], bet=${
              p.currentBet
            }`
        )
      );

      return {
        ...state,
        players: updatedPlayers,
        error: null,
      };
    });
  },

  clearBets: () => {
    console.log('🔄 Clearing all bets');
    set((state) => ({
      players: state.players.map((p) => ({
        ...p,
        currentBet: 0,
        // ✅ NO limpiar availableTokens - se mantienen igual
      })),
    }));
  },

  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);

      if (!player || !powerCard) {
        return { ...state, error: 'Carta de poder no encontrada' };
      }

      if (powerCard.currentUses >= powerCard.usageLimit) {
        return { ...state, error: 'Carta de poder ya usada' };
      }

      let newPlayers = [...state.players];

      switch (powerCard.type) {
        case 'robo':
          if (targetPlayerId) {
            newPlayers = newPlayers.map((p) => {
              if (p.id === targetPlayerId && p.availableTokens.length > 0) {
                const stolenToken = Math.max(...p.availableTokens);
                return {
                  ...p,
                  availableTokens: p.availableTokens.filter(
                    (t) => t !== stolenToken
                  ),
                };
              }
              if (p.id === playerId) {
                return {
                  ...p,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                };
              }
              return p;
            });
          }
          break;

        case 'escudo':
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  isImmune: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;

        case 'boost':
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  boostActive: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;

        case 'peek':
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  peekUsed: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;
      }

      console.log(`⚡ Power card: ${powerCard.name} by ${player.name}`);

      return { ...state, players: newPlayers, error: null };
    });
  },

  awardPoints: (playerId: string, points?: number, answerTime?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) {
      console.error('❌ Cannot award points: player or card not found');
      return;
    }

    let basePoints = points || currentCard.question.points || 0;
    let tokenBonus = player.currentBet || 0;

    if (player.boostActive) {
      basePoints = basePoints * 2;
      console.log(`⚡ Boost: 2x`);
    }

    const totalPoints = basePoints + tokenBonus;

    console.log(
      `🏆 ${player.name}: base=${basePoints} + token=${tokenBonus} = ${totalPoints} pts`
    );
    console.log(`🏆 Previous score: ${player.score}`);
    console.log(`🏆 New score: ${player.score + totalPoints}`);

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + totalPoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0, // ✅ Resetear apuesta después de usar
            boostActive: false,
            cardTypeStreaks: {
              ...p.cardTypeStreaks,
              [currentCard.question.type]:
                (p.cardTypeStreaks[currentCard.question.type] || 0) + 1,
            },
            difficultyStreaks: {
              ...p.difficultyStreaks,
              [currentCard.scan.difficulty]:
                (p.difficultyStreaks[currentCard.scan.difficulty] || 0) + 1,
            },
          };
        } else {
          // ✅ Solo resetear currentBet de otros jugadores, mantener sus tokens
          return {
            ...p,
            consecutiveWins: 0,
            currentBet: 0,
            // ✅ NO resetear cardTypeStreaks y difficultyStreaks si quieres mantener estadísticas
          };
        }
      }),
    }));

    get().nextTurn();

    // Check for winner
    const winner = get().players.find((p) => p.score >= SCORE_TO_WIN);
    if (winner) {
      console.log(`🏆 Winner: ${winner.name} with ${winner.score} points!`);
      get().endGame();
    }
  },

  // ✅ NUEVA FUNCIÓN: Sincronizar jugadores desde backend
  syncPlayersFromBackend: (
    backendPlayers: Array<{
      id: string;
      name: string;
      score: number;
      availableTokens: number[];
    }>
  ) => {
    console.log('🔄 Syncing players from backend:', backendPlayers);

    set((state) => {
      const updatedPlayers = state.players.map((localPlayer, index) => {
        // Buscar jugador por índice o por nombre si no coincide el índice
        const backendPlayer =
          backendPlayers.find(
            (bp) =>
              bp.name === localPlayer.name ||
              bp.id === localPlayer.id ||
              backendPlayers[index]?.name === localPlayer.name
          ) || backendPlayers[index];

        if (backendPlayer) {
          console.log(
            `   ${localPlayer.name}: score ${localPlayer.score} → ${backendPlayer.score}`
          );
          console.log(
            `   Tokens: [${localPlayer.availableTokens.join(',')}] → [${
              backendPlayer.availableTokens?.join(',') || 'no data'
            }]`
          );

          return {
            ...localPlayer,
            score: backendPlayer.score || localPlayer.score,
            availableTokens:
              backendPlayer.availableTokens || localPlayer.availableTokens,
          };
        }

        console.log(`   ⚠️ No backend data for ${localPlayer.name}`);
        return localPlayer;
      });

      console.log(
        '🔄 Players after sync:',
        updatedPlayers.map(
          (p) =>
            `${p.name}: score=${p.score}, tokens=[${p.availableTokens.join(
              ','
            )}]`
        )
      );

      return { players: updatedPlayers };
    });
  },
});
