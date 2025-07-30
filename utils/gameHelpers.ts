// utils/gameHelpers.ts - 🛠️ TUS FUNCIONES HELPER ORIGINALES

// ⏰ Format Time
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 🏆 Player Ranking
export const getPlayerRanking = (players: any[]) => {
  return [...players].sort((a, b) => b.score - a.score);
};

// 🎯 Betting Multiplier
export const getBettingMultiplier = (betAmount: number): number => {
  if (betAmount === 1) return 2;
  if (betAmount === 2) return 3;
  if (betAmount >= 3) return 4;
  return 1;
};

// 💰 Calculate Final Points
export const calculateFinalPoints = (
  basePoints: number,
  player: any,
  currentCard: any
): number => {
  let finalPoints = basePoints;

  // Apply betting multiplier
  if (player.currentBet > 0) {
    finalPoints *= getBettingMultiplier(player.currentBet);
  }

  // Apply boost power
  if (player.boostActive) {
    finalPoints *= 2;
  }

  // Apply precision bonus for decade cards
  if (currentCard?.cardType === 'decade' && player.precisionActive) {
    finalPoints += 2;
  }

  return finalPoints;
};

// 🏁 Check Win Condition
export const checkWinCondition = (players: any[], timeLeft: number) => {
  const winner = players.find((p) => p.score >= 15);
  const timeUp = timeLeft <= 0;

  if (winner) {
    return { gameEnded: true, winner, reason: 'score' };
  }

  if (timeUp) {
    const topPlayer = getPlayerRanking(players)[0];
    return { gameEnded: true, winner: topPlayer, reason: 'time' };
  }

  return { gameEnded: false, winner: null, reason: null };
};

// 🔍 Validate QR Format
export const isValidQRFormat = (qrCode: string): boolean => {
  try {
    if (!qrCode.startsWith('HITBACK_')) return false;

    const parts = qrCode.split('_');
    if (parts.length !== 4) return false;

    const [prefix, trackId, cardType, difficulty] = parts;

    if (prefix !== 'HITBACK') return false;
    if (!/^\d{3}$/.test(trackId)) return false;
    if (
      !['SONG', 'ARTIST', 'DECADE', 'LYRICS', 'CHALLENGE'].includes(
        cardType.toUpperCase()
      )
    )
      return false;
    if (
      !['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty.toUpperCase())
    )
      return false;

    return true;
  } catch {
    return false;
  }
};

// 🎮 Phase Text
export const getPhaseText = (phase: string): string => {
  const texts: Record<string, string> = {
    scanning: '🔍 Procesando carta...',
    audio: '🎵 Reproduciendo audio...',
    question: '❓ ¡Respondan rápido!',
    answered: '✅ Puntos otorgados',
  };
  return texts[phase] || '';
};

// 🎲 Generate Initial Power Cards
export const generateInitialPowerCards = () => {
  const powerCardTemplates = [
    { type: 'boost', name: 'Amplificador', emoji: '⚡', usageLimit: 3 },
    {
      type: 'refresh',
      name: 'Segunda Oportunidad',
      emoji: '🔄',
      usageLimit: 2,
    },
  ];

  return powerCardTemplates.map((template) => ({
    ...template,
    id: `power_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description: getPowerDescription(template.type),
    currentUses: 0,
  }));
};

// 🔥 Power Card Descriptions
const getPowerDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    robo: 'Roba 1 token de otro jugador',
    escudo: 'Inmune a robos por 2 rondas',
    boost: 'Tu próxima respuesta vale doble puntos',
    refresh: 'Recupera 1 token perdido',
    peek: 'Ve la respuesta 3 segundos antes',
    precision: '+2 puntos extra si aciertas año exacto',
  };
  return descriptions[type] || 'Poder especial';
};

// 🎨 Get Position Info
export const getPositionInfo = (position: number) => {
  const emojis = ['🥇', '🥈', '🥉'];
  const colors = ['#F59E0B', '#94A3B8', '#CD7F32', '#64748B'];

  return {
    emoji: emojis[position - 1] || `${position}°`,
    color: colors[position - 1] || colors[3],
  };
};

// 🃏 Power Card validation
export const canUsePowerCard = (
  player: any,
  powerCardId: string,
  targetPlayer?: any
) => {
  const powerCard = player.powerCards?.find((pc: any) => pc.id === powerCardId);

  if (!powerCard) {
    return { canUse: false, reason: 'Carta de poder no encontrada' };
  }

  if (powerCard.currentUses >= powerCard.usageLimit) {
    return { canUse: false, reason: 'Carta de poder agotada' };
  }

  // Check specific power card restrictions
  switch (powerCard.type) {
    case 'robo':
      if (!targetPlayer) {
        return { canUse: false, reason: 'Necesitas seleccionar un objetivo' };
      }
      if (targetPlayer.isImmune) {
        return { canUse: false, reason: 'El objetivo tiene escudo activo' };
      }
      if (targetPlayer.tokens <= 0) {
        return { canUse: false, reason: 'El objetivo no tiene tokens' };
      }
      break;

    case 'escudo':
      if (player.isImmune) {
        return { canUse: false, reason: 'Ya tienes escudo activo' };
      }
      break;

    case 'boost':
      if (player.boostActive) {
        return { canUse: false, reason: 'Ya tienes boost activo' };
      }
      break;

    case 'refresh':
      if (player.tokens >= 5) {
        return { canUse: false, reason: 'Ya tienes el máximo de tokens' };
      }
      break;

    case 'peek':
      if (player.peekUsed) {
        return { canUse: false, reason: 'Ya usaste peek en esta ronda' };
      }
      break;
  }

  return { canUse: true };
};
