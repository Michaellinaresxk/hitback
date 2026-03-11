import { StateCreator } from 'zustand';
import { GameStore, Player } from '../types/gameTypes';
import { SCORE_TO_WIN } from '@/constants/Points';

export const createPlayerSlice: StateCreator<GameStore, [], []> = (
  set,
  get,
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
      availableTokens: [1, 2, 3],
      powerCards: [],
      currentBet: 0,
      isImmune: false,
      boostActive: false,
      peekUsed: false,
      consecutiveWins: 0,
      cardTypeStreaks: {},
      difficultyStreaks: {},
      isFrozen: false,
      frozenForRound: null,
    };

    set((state) => ({ players: [...state.players, newPlayer], error: null }));
  },

  removePlayer: (id: string) => {
    set((state) => {
      const newPlayers = state.players.filter((p) => p.id !== id);
      const currentPlayerIndex = state.players.findIndex((p) => p.id === id);

      let newCurrentTurn = state.currentTurn;
      if (currentPlayerIndex <= state.currentTurn && newPlayers.length > 0) {
        newCurrentTurn = Math.max(0, state.currentTurn - 1);
      }

      return { players: newPlayers, currentTurn: newCurrentTurn };
    });
  },

  // ❄️ FREEZE — toggle desde el scoreboard
  toggleFreezePlayer: (playerId: string) => {
    const { players, round } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const next = !player.isFrozen;

    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, isFrozen: next, frozenForRound: next ? round : null }
          : p,
      ),
    }));

    console.log(
      next
        ? `❄️ ${player.name} — FREEZE activado (ronda ${round})`
        : `▶️ ${player.name} — FREEZE cancelado`,
    );
  },

  placeBet: (playerId: string, tokenValue: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player) {
        return { ...state, error: 'Jugador no encontrado' };
      }

      if (!player.availableTokens.includes(tokenValue)) {
        return {
          ...state,
          error: `Token +${tokenValue} ya fue usado o no disponible`,
        };
      }

      const newAvailableTokens = player.availableTokens.filter(
        (t) => t !== tokenValue,
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            availableTokens: newAvailableTokens,
            currentBet: tokenValue,
          };
        }
        return p;
      });

      return { ...state, players: updatedPlayers, error: null };
    });
  },

  clearBets: () => {
    set((state) => ({
      players: state.players.map((p) => ({ ...p, currentBet: 0 })),
    }));
  },

  addPowerCard: (playerId: string, powerCard: any) => {
    set((state) => {
      const updatedPlayers = state.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, powerCards: [...p.powerCards, powerCard] };
        }
        return p;
      });
      return { ...state, players: updatedPlayers };
    });
  },

  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string,
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
      const cardType = powerCard.type?.toLowerCase() || '';

      switch (cardType) {
        case 'replay':
        case 'boost':
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  boostActive: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? {
                          ...pc,
                          currentUses: pc.currentUses + 1,
                          isActive: true,
                        }
                      : pc,
                  ),
                }
              : p,
          );
          break;

        case 'robo':
        case 'thief':
        case 'hit_steal':
          if (targetPlayerId) {
            newPlayers = newPlayers.map((p) => {
              if (p.id === targetPlayerId && p.availableTokens.length > 0) {
                const stolenToken = Math.max(...p.availableTokens);
                return {
                  ...p,
                  availableTokens: p.availableTokens.filter(
                    (t) => t !== stolenToken,
                  ),
                };
              }
              if (p.id === playerId) {
                return {
                  ...p,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc,
                  ),
                };
              }
              return p;
            });
          }
          break;

        case 'escudo':
        case 'shield':
        case 'stop':
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  isImmune: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc,
                  ),
                }
              : p,
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
                      : pc,
                  ),
                }
              : p,
          );
          break;

        default:
          console.warn(`⚠️ Unknown PowerCard type: ${cardType}`);
          break;
      }

      return { ...state, players: newPlayers, error: null };
    });
  },

  activateBoost: (playerId: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, boostActive: true } : p,
      ),
    }));
  },

  deactivateBoost: (playerId: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, boostActive: false } : p,
      ),
    }));
  },

  // ─── awardPoints ────────────────────────────────────────────────────────────
  // Nota: en el flujo principal (revealAnswer → syncPlayersFromBackend) los puntos
  // vienen del backend. Este método queda para usos directos / modo offline.
  awardPoints: (playerId: string, points?: number, answerTime?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) return;

    let basePoints = points || currentCard.question.points || 0;
    let tokenBonus = player.currentBet || 0;

    if (player.boostActive) {
      basePoints = basePoints * 2;
    }

    const totalPoints = basePoints + tokenBonus;

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + totalPoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0,
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
        }
        return { ...p, consecutiveWins: 0, currentBet: 0 };
      }),
    }));

    get().nextTurn();

    const winner = get().players.find((p) => p.score >= SCORE_TO_WIN);
    if (winner) get().endGame();
  },

  // ─── awardAllianceBonus ─────────────────────────────────────────────────────
  // FIX 50/50: deducimos la mitad al ganador Y se la damos al partner.
  // Se llama desde handleAwardPoints en game.tsx DESPUÉS de syncPlayersFromBackend.
  // Funciona sin importar cuál de los dos responda (getPlayerAlliance es simétrico).
  awardAllianceBonus: (winnerId: string, pointsAwarded: number) => {
    const alliance = get().getPlayerAlliance(winnerId);
    if (!alliance) return;

    const partnerId =
      alliance.player1Id === winnerId ? alliance.player2Id : alliance.player1Id;

    const share = Math.floor(pointsAwarded / 2);

    const winner = get().players.find((p) => p.id === winnerId);
    const partner = get().players.find((p) => p.id === partnerId);
    if (!winner || !partner) return;

    console.log(
      `🤝 Alliance 50/50: ${winner.name} −${share} pts | ${partner.name} +${share} pts`,
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) => {
        // Ganador cede la mitad (queda con 50%)
        if (p.id === winnerId) return { ...p, score: p.score - share };
        // Partner recibe la mitad
        if (p.id === partnerId) return { ...p, score: p.score + share };
        return p;
      }),
    }));
  },

  // ─── applyFeaturingBonus ────────────────────────────────────────────────────
  // FIX 100/100: el partner recibe EXACTAMENTE los mismos puntos que el ganador.
  // El ganador ya tiene sus puntos del backend; aquí solo sumamos al partner.
  // Se llama desde handleAwardPoints en game.tsx justo después de awardAllianceBonus.
  applyFeaturingBonus: (partnerId: string, pointsAwarded: number) => {
    const partner = get().players.find((p) => p.id === partnerId);
    if (!partner) return;

    console.log(
      `🎤 Featuring 100/100: ${partner.name} recibe ${pointsAwarded} pts (igual que el ganador)`,
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === partnerId ? { ...p, score: p.score + pointsAwarded } : p,
      ),
    }));
  },

  syncPlayersFromBackend: (
    backendPlayers: Array<{
      id: string;
      name: string;
      score: number;
      availableTokens: number[];
    }>,
  ) => {
    set((state) => {
      const updatedPlayers = state.players.map((localPlayer, index) => {
        const backendPlayer =
          backendPlayers.find(
            (bp) =>
              bp.name === localPlayer.name ||
              bp.id === localPlayer.id ||
              backendPlayers[index]?.name === localPlayer.name,
          ) || backendPlayers[index];

        if (backendPlayer) {
          return {
            ...localPlayer,
            score: backendPlayer.score || localPlayer.score,
            availableTokens:
              backendPlayer.availableTokens || localPlayer.availableTokens,
          };
        }

        return localPlayer;
      });

      return { players: updatedPlayers };
    });
  },
});
