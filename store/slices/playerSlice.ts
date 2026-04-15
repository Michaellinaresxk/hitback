import { StateCreator } from 'zustand';
import { GameStore, Player } from '../types/gameTypes';
import { SCORE_TO_WIN } from '@/constants/Points';
import { BSIDE_LOSS_THRESHOLD } from '@/constants/LossStreak';
import { ARTIST_HOLD_ROUND } from '@/constants/Game';

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
      artistHoldRoundsLeft: 0,
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
    // Capturamos el tipo de carta ANTES del set para usarlo en efectos de nivel global
    const player = get().players.find((p) => p.id === playerId);
    const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);
    const cardType = powerCard?.type?.toLowerCase() || '';

    set((state) => {
      const localPlayer = state.players.find((p: any) => p.id === playerId);
      const localCard = localPlayer?.powerCards?.find(
        (pc: any) => pc.id === powerCardId,
      );
      if (!localPlayer || !localCard)
        return { ...state, error: 'Carta de poder no encontrada' };
      if (localCard.currentUses >= localCard.usageLimit)
        return { ...state, error: 'Carta ya usada' };

      let newPlayers = [...state.players];

      switch (cardType) {
        case 'replay':
        case 'boost':
          newPlayers = newPlayers.map((p: any) =>
            p.id === playerId
              ? {
                  ...p,
                  boostActive: true,
                  powerCards: p.powerCards.map((pc: any) =>
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
        case 'double_platinum':
          // Solo marca la carta como usada; el flag de ronda se activa fuera del set
          newPlayers = newPlayers.map((p: any) =>
            p.id === playerId
              ? {
                  ...p,
                  powerCards: p.powerCards.map((pc: any) =>
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
        case 'festival':
          // +1 a todos los jugadores; marcar carta como usada
          newPlayers = newPlayers.map((p: any) => ({
            ...p,
            score: p.score + 1,
            powerCards:
              p.id === playerId
                ? p.powerCards.map((pc: any) =>
                    pc.id === powerCardId
                      ? {
                          ...pc,
                          currentUses: pc.currentUses + 1,
                          isActive: false,
                        }
                      : pc,
                  )
                : p.powerCards,
          }));
          break;
        default:
          console.warn(`⚠️ Unknown PowerCard type: ${cardType}`);
      }

      return { ...state, players: newPlayers, error: null };
    });

    // Efecto de nivel global: DOUBLE PLATINUM activa el modificador de la próxima ronda
    if (cardType === 'double_platinum') {
      get().activateDoublePlatinum();
    }
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
    const { currentCard, players, doublePlatinumActive } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player || !currentCard) return;

    let basePoints = points || currentCard.question.points || 0;
    if (player.boostActive) basePoints = basePoints * 2;
    if (doublePlatinumActive) {
      basePoints = basePoints * 2;
      console.log(
        `💿 DOUBLE PLATINUM: puntos duplicados (${basePoints / 2} → ${basePoints})`,
      );
    }
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

    if (doublePlatinumActive) get().clearDoublePlatinum();
    // ⚠️ nextTurn() se gestiona desde usePointsActions.handleAwardPoints().
    // NO llamar aquí para evitar doble avance de turno.

    // Safety net: si el frontend detecta un ganador, cerrar el juego
    // aunque el backend no haya respondido aún.
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

  // ─── COPYRIGHTS ────────────────────────────────────────────────────────────
  applyCopyrights: (playerId: string, points: number) => {
    const deduction = Math.floor(points / 2);
    const player = get().players.find((p) => p.id === playerId);
    if (!player || deduction <= 0) return;

    console.log(
      `©️ COPYRIGHTS: ${player.name} -${deduction} pts (50% de ${points})`,
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, score: Math.max(0, p.score - deduction) }
          : p,
      ),
    }));
  },

  applyArtistHold: () => {
    const { players } = get();
    if (players.length < 2) return;

    const leader = players.reduce(
      (a: { score: number }, b: { score: number }) =>
        a.score > b.score ? a : b,
    );
    console.log(`🔒 ARTIST HOLD: ${leader.name} bloqueado por 2 rondas`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === leader.id
          ? { ...p, isFrozen: true, artistHoldRoundsLeft: ARTIST_HOLD_ROUND }
          : p,
      ),
    }));
  },

  // ─── SOLD OUT ───────────────────────────────────────────────────────────────
  // +1 al portador de la carta. Sin target: el playerId ES el holder.
  applySoldOut: (holderId: string) => {
    const player = get().players.find((p) => p.id === holderId);
    if (!player) return;

    console.log(`🎟️ SOLD OUT: ${player.name} +1`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === holderId ? { ...p, score: p.score + 1 } : p,
      ),
    }));
  },

  // ─── BAD REVIEW ─────────────────────────────────────────────────────────────
  // -1 al jugador objetivo. Math.max(0) para no bajar de 0.
  applyBadReview: (targetId: string) => {
    const player = get().players.find((p) => p.id === targetId);
    if (!player) return;

    console.log(`💔 BAD REVIEW: ${player.name} -1`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === targetId ? { ...p, score: Math.max(0, p.score - 1) } : p,
      ),
    }));
  },

  // ─── MANAGEMENT FEE ─────────────────────────────────────────────────────────
  // El manager cobra su corte. -1 al jugador objetivo.
  applyManagementFee: (targetId: string) => {
    const player = get().players.find((p) => p.id === targetId);
    if (!player) return;

    console.log(`🤵 MANAGEMENT FEE: ${player.name} -1 (el manager cobra)`);

    set((state: { players: any[] }) => ({
      players: state.players.map((p) =>
        p.id === targetId ? { ...p, score: Math.max(0, p.score - 1) } : p,
      ),
    }));
  },

  // ─── CHARITY SHOW ───────────────────────────────────────────────────────────
  // El líder transfiere 1 pt a un jugador sorteado al azar entre los de menor puntaje.
  // Devuelve { leader, recipient, tiedCount } para mostrar toast, o null si no aplica.
  applyCharityShow: (): {
    leaderId: string;
    leaderName: string;
    recipientId: string;
    recipientName: string;
    tiedCount: number;
  } | null => {
    const { players } = get();
    if (players.length < 2) return null;

    const leader = players.reduce((a, b) => (a.score > b.score ? a : b));
    if (leader.score === 0) return null;

    const minScore = Math.min(...players.map((p) => p.score));
    const tied = players.filter(
      (p) => p.score === minScore && p.id !== leader.id,
    );
    if (tied.length === 0) return null;

    const recipient = tied[Math.floor(Math.random() * tied.length)];

    console.log(
      `🎸 CHARITY SHOW: ${leader.name} (-1) → ${recipient.name} (+1)` +
        (tied.length > 1 ? ` (sorteado entre ${tied.length})` : ''),
    );

    set((state: { players: any[] }) => ({
      players: state.players.map((p) => {
        if (p.id === leader.id)
          return { ...p, score: Math.max(0, p.score - 1) };
        if (p.id === recipient.id) return { ...p, score: p.score + 1 };
        return p;
      }),
    }));

    return {
      leaderId: leader.id,
      leaderName: leader.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      tiedCount: tied.length,
    };
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
          lossStreakStreak,
          // bSideActive se activa al threshold y se mantiene hasta que gane
          bSideActive: p.bSideActive || justHitThreshold,
        };
      }),
    }[]);

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
            score: backendPlayer.score,
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
