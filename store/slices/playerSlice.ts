import { StateCreator } from 'zustand';
import { GameStore, Player } from '../types/gameTypes';
import { SCORE_TO_WIN } from '@/constants/Points';
import { BSIDE_LOSS_THRESHOLD } from '@/constants/LossStreak';

export const createPlayerSlice: StateCreator<GameStore, [], []> = (
  set,
  get,
) => ({
  players: [],

  addPlayer: (name: string) => {
    const { players } = get();

    if (name.trim().length < 2)
      throw new Error('El nombre debe tener al menos 2 caracteres');
    if (players.length >= 8) throw new Error('Máximo 8 jugadores');
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase().trim()))
      throw new Error('Ya existe un jugador con ese nombre');

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
      lossStreak: 0,
      bSideActive: false,
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
      next ? `❄️ ${player.name} FROZEN` : `▶️ ${player.name} unfreeze`,
    );
  },

  placeBet: (playerId: string, tokenValue: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return { ...state, error: 'Jugador no encontrado' };
      if (!player.availableTokens.includes(tokenValue))
        return {
          ...state,
          error: `Token +${tokenValue} ya fue usado o no disponible`,
        };

      const updatedPlayers = state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              availableTokens: p.availableTokens.filter(
                (t) => t !== tokenValue,
              ),
              currentBet: tokenValue,
            }
          : p,
      );
      return { ...state, players: updatedPlayers, error: null };
    });
  },

  clearBets: () => {
    set((state) => ({
      players: state.players.map((p) => ({ ...p, currentBet: 0 })),
    }));
  },

  addPowerCard: (playerId: string, powerCard: any) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, powerCards: [...p.powerCards, powerCard] }
          : p,
      ),
    }));
  },

  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string,
  ) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);
      if (!player || !powerCard)
        return { ...state, error: 'Carta de poder no encontrada' };
      if (powerCard.currentUses >= powerCard.usageLimit)
        return { ...state, error: 'Carta ya usada' };

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
              if (p.id === playerId)
                return {
                  ...p,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc,
                  ),
                };
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

  awardPoints: (playerId: string, points?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player || !currentCard) return;

    let basePoints = points || currentCard.question.points || 0;
    if (player.boostActive) basePoints = basePoints * 2;
    const totalPoints = basePoints + (player.currentBet || 0);

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId)
          return {
            ...p,
            score: p.score + totalPoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0,
            boostActive: false,
          };
        return { ...p, consecutiveWins: 0, currentBet: 0 };
      }),
    }));

    get().nextTurn();
    const winner = get().players.find((p) => p.score >= SCORE_TO_WIN);
    if (winner) get().endGame();
  },

  // ─── Alliance 50/50 ────────────────────────────────────────────────────────
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
      `🤝 Alliance 50/50: ${winner.name} −${share} | ${partner.name} +${share}`,
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) => {
        if (p.id === winnerId) return { ...p, score: p.score - share };
        if (p.id === partnerId) return { ...p, score: p.score + share };
        return p;
      }),
    }));
  },

  // ─── Featuring 100/100 ─────────────────────────────────────────────────────
  applyFeaturingBonus: (partnerId: string, pointsAwarded: number) => {
    const partner = get().players.find((p) => p.id === partnerId);
    if (!partner) return;

    console.log(`🎤 Featuring 100/100: ${partner.name} +${pointsAwarded}`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === partnerId ? { ...p, score: p.score + pointsAwarded } : p,
      ),
    }));
  },

  applyRoyalties: (holderId: string) => {
    const { players } = get();
    if (players.length < 2) return;

    const leader = players.reduce((a, b) => (a.score > b.score ? a : b));
    if (leader.id === holderId) return; // no te robás a vos mismo

    console.log(
      `📜 ROYALTIES: ${leader.name} -1 → ${players.find((p) => p.id === holderId)?.name} +1`,
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) => {
        if (p.id === leader.id)
          return { ...p, score: Math.max(0, p.score - 1) };
        if (p.id === holderId) return { ...p, score: p.score + 1 };
        return p;
      }),
    }));
  },

  // ─── B-SIDE: updateLossStreaks ─────────────────────────────────────────────
  // Llama al final de cada ronda (handleAwardPoints / handleWrongAnswer).
  // winnerId = quien ganó (null = nadie ganó).
  // Retorna IDs de jugadores que RECIÉN alcanzaron el threshold → para notificación.
  updateLossStreaks: (winnerId: string | null): string[] => {
    const { players } = get();
    const newlyActivated: string[] = [];

    set((state: { players: any[] }) => ({
      players: state.players.map((p) => {
        // Ganador: reset
        if (winnerId && p.id === winnerId) {
          return { ...p, lossStreak: 0 };
        }

        const prevStreak = p.lossStreak ?? 0;
        const nextStreak = prevStreak + 1;
        const justHitThreshold =
          nextStreak === BSIDE_LOSS_THRESHOLD && !p.bSideActive;

        if (justHitThreshold) {
          newlyActivated.push(p.id);
          console.log(
            `🎶 B-SIDE activado: ${p.name} (${nextStreak} rondas sin puntuar)`,
          );
        }

        return {
          ...p,
          lossStreak: nextStreak,
          // bSideActive se activa al threshold y se mantiene hasta que gane
          bSideActive: p.bSideActive || justHitThreshold,
        };
      }),
    }));

    return newlyActivated;
  },

  // ─── B-SIDE: applyBSideBonus ───────────────────────────────────────────────
  // Llama DESPUÉS de syncPlayersFromBackend cuando el ganador tenía bSideActive.
  // Suma +1 y limpia el flag. Retorna true si aplicó el bonus.
  applyBSideBonus: (winnerId: string): boolean => {
    const player = get().players.find((p) => p.id === winnerId);
    if (!player?.bSideActive) return false;

    console.log(`🎶 B-SIDE comeback: ${player.name} +1 bonus`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === winnerId
          ? { ...p, score: p.score + 1, lossStreak: 0, bSideActive: false }
          : p,
      ),
    }));

    return true;
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
