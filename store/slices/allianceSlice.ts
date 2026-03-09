// ─────────────────────────────────────────────────────────────────────────────
// HITBACK — Alliance Slice
// Ruta en tu proyecto: store/slices/allianceSlice.ts
// ─────────────────────────────────────────────────────────────────────────────

import { AllianceSlice, GameStore } from '@/types/game.types';
import { StateCreator } from 'zustand';

// Counter for generating unique alliance IDs
let allianceCounter = 0;

export const createAllianceSlice: StateCreator<
  GameStore,
  [],
  [],
  AllianceSlice
> = (set, get) => ({
  // ─── Initial state ────────────────────────────────────────────────────────
  alliances: [],

  // ─── declareAlliance ──────────────────────────────────────────────────────
  declareAlliance: (player1Id: string, player2Id: string) => {
    const { alliances, players, round } = get();

    // Guard: cannot ally with yourself
    if (player1Id === player2Id) {
      console.warn(
        '⚠️ Alliance rejected: a player cannot ally with themselves',
      );
      return;
    }

    // Guard: both players must exist in the game
    const player1 = players.find((p) => p.id === player1Id);
    const player2 = players.find((p) => p.id === player2Id);

    if (!player1 || !player2) {
      console.warn('⚠️ Alliance rejected: one or both players not found', {
        player1Id,
        player2Id,
      });
      return;
    }

    // Guard: neither player can already be in an active alliance
    const player1HasAlliance = alliances.some(
      (a: { player1Id: string; player2Id: string }) =>
        a.player1Id === player1Id || a.player2Id === player1Id,
    );
    const player2HasAlliance = alliances.some(
      (a: { player1Id: string; player2Id: string }) =>
        a.player1Id === player2Id || a.player2Id === player2Id,
    );

    if (player1HasAlliance) {
      console.warn(
        `⚠️ Alliance rejected: ${player1.name} is already in an alliance`,
      );
      return;
    }

    if (player2HasAlliance) {
      console.warn(
        `⚠️ Alliance rejected: ${player2.name} is already in an alliance`,
      );
      return;
    }

    // All checks passed — create the alliance
    allianceCounter += 1;
    const newAlliance: Alliance = {
      id: `feat_${allianceCounter}`,
      player1Id,
      player2Id,
      roundsLeft: 3,
      createdAtRound: round,
    };

    set((state: { alliances: any }) => ({
      alliances: [...state.alliances, newAlliance],
    }));

    console.log(
      `🤝 Alliance created: ${player1.name} ⟷ ${player2.name} | ID: ${newAlliance.id} | Rounds: 3`,
    );
  },

  // ─── dissolveAlliance ─────────────────────────────────────────────────────
  dissolveAlliance: (allianceId: string) => {
    const { alliances } = get();
    const alliance = alliances.find((a) => a.id === allianceId);

    if (!alliance) {
      console.warn(`⚠️ dissolveAlliance: alliance "${allianceId}" not found`);
      return;
    }

    set((state: { alliances: any[] }) => ({
      alliances: state.alliances.filter((a) => a.id !== allianceId),
    }));

    console.log(`💔 Alliance dissolved: ${allianceId}`);
  },

  // ─── decrementAllianceRounds ──────────────────────────────────────────────
  decrementAllianceRounds: () => {
    const { alliances, players } = get();

    if (alliances.length === 0) return;

    // Separate expiring from active
    const expiring = alliances.filter(
      (a: { roundsLeft: number }) => a.roundsLeft <= 1,
    );
    const remaining = alliances
      .filter((a: { roundsLeft: number }) => a.roundsLeft > 1)
      .map((a: { roundsLeft: number }) => ({
        ...a,
        roundsLeft: a.roundsLeft - 1,
      }));

    // Log expired alliances (UI notification will be handled in Feature 5)
    expiring.forEach((a: { player1Id: any; player2Id: any }) => {
      const p1 = players.find((p: { id: any }) => p.id === a.player1Id);
      const p2 = players.find((p: { id: any }) => p.id === a.player2Id);
      console.log(
        `⏳ Alliance expired: ${p1?.name ?? a.player1Id} ⟷ ${p2?.name ?? a.player2Id}`,
      );
    });

    // Log decremented alliances
    remaining.forEach(
      (a: { player1Id: any; player2Id: any; id: any; roundsLeft: number }) => {
        const p1 = players.find((p: { id: any }) => p.id === a.player1Id);
        const p2 = players.find((p: { id: any }) => p.id === a.player2Id);
        console.log(
          `🤝 Alliance "${a.id}" (${p1?.name} ⟷ ${p2?.name}): ${a.roundsLeft + 1} → ${a.roundsLeft} rounds left`,
        );
      },
    );

    set({ alliances: remaining });
  },

  // ─── getPlayerAlliance ────────────────────────────────────────────────────
  getPlayerAlliance: (playerId: string): Alliance | null => {
    const { alliances } = get();
    return (
      alliances.find(
        (a) => a.player1Id === playerId || a.player2Id === playerId,
      ) ?? null
    );
  },
});
