import {
  Difficulty,
  PowerCard,
  Combo,
  ComboReward,
  Player,
} from '@/types/game.types';
import powerCardsJson from '@/data/powerCards.json';

interface RewardResult {
  powerCard?: PowerCard;
  bonusTokens: number;
  combosAchieved: Combo[];
  totalPoints: number;
}

class RewardsService {
  private powerCards = powerCardsJson.powerCards;
  private combos = powerCardsJson.combos;

  // Calculate rewards based on difficulty and performance
  calculateRewards(
    difficulty: Difficulty,
    answerTime: number,
    consecutiveCorrect: number,
    cardTypeStreak: number,
    difficultyStreak: number
  ): RewardResult {
    let bonusTokens = 0;
    let powerCard: PowerCard | undefined;
    const combosAchieved: Combo[] = [];
    let totalPoints = 0;

    // Base difficulty rewards
    const difficultyRewards = this.getDifficultyRewards(difficulty);

    if (Math.random() < difficultyRewards.powerCardChance) {
      powerCard = this.getRandomPowerCard();
    }

    if (Math.random() < difficultyRewards.bonusTokenChance) {
      bonusTokens += difficultyRewards.bonusTokens;
    }

    // Time bonus (answering quickly)
    if (answerTime < 2000) {
      // Less than 2 seconds
      bonusTokens += 1;
      totalPoints += 1;
    }

    // Streak bonuses
    if (consecutiveCorrect >= 3) {
      const hotStreak = this.combos.find((c) => c.id === 'combo_hot_streak');
      if (hotStreak) combosAchieved.push(hotStreak);
    }

    if (cardTypeStreak >= 3) {
      bonusTokens += 2;
      totalPoints += 3;
    }

    if (difficultyStreak >= 2 && difficulty === 'hard') {
      const difficultyBeast = this.combos.find(
        (c) => c.id === 'combo_difficulty_beast'
      );
      if (difficultyBeast) combosAchieved.push(difficultyBeast);
    }

    return {
      powerCard,
      bonusTokens,
      combosAchieved,
      totalPoints,
    };
  }

  // Get difficulty-based reward chances
  private getDifficultyRewards(difficulty: Difficulty) {
    const rewards = {
      easy: {
        powerCardChance: 0.1,
        bonusTokenChance: 0.2,
        bonusTokens: 1,
      },
      medium: {
        powerCardChance: 0.25,
        bonusTokenChance: 0.35,
        bonusTokens: 1,
      },
      hard: {
        powerCardChance: 0.45,
        bonusTokenChance: 0.5,
        bonusTokens: 2,
      },
      expert: {
        powerCardChance: 0.7,
        bonusTokenChance: 0.75,
        bonusTokens: 3,
      },
    };

    return rewards[difficulty];
  }

  // Get random power card
  getRandomPowerCard(): PowerCard {
    const availableCards = this.powerCards;
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];

    return {
      ...card,
      id: `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentUses: 0,
    };
  }

  // Check for combo achievements
  checkCombos(
    player: Player,
    consecutiveWins: number,
    cardTypeStreaks: Record<string, number>,
    difficultyStreaks: Record<Difficulty, number>,
    lastAnswerTime: number
  ): Combo[] {
    const achievedCombos: Combo[] = [];

    this.combos.forEach((combo) => {
      const conditionsMet = combo.conditions.every((condition) => {
        switch (condition.type) {
          case 'consecutive_wins':
            return consecutiveWins >= condition.value;

          case 'card_type_streak':
            if (!condition.cardType) return false;
            return cardTypeStreaks[condition.cardType] >= condition.value;

          case 'difficulty_streak':
            if (!condition.difficulty) return false;
            return difficultyStreaks[condition.difficulty] >= condition.value;

          case 'time_bonus':
            return lastAnswerTime <= condition.value;

          default:
            return false;
        }
      });

      if (conditionsMet) {
        achievedCombos.push(combo);
      }
    });

    return achievedCombos;
  }

  // Apply combo rewards to player
  applyComboReward(player: Player, combo: Combo): Partial<Player> {
    const reward = combo.reward;
    const updates: Partial<Player> = {};

    switch (reward.type) {
      case 'tokens':
        updates.tokens = (player.tokens || 0) + reward.amount;
        break;

      case 'points':
        updates.score = (player.score || 0) + reward.amount;
        break;

      case 'power_card':
        if (reward.powerCardType) {
          const newPowerCard = this.getPowerCardByType(reward.powerCardType);
          updates.powerCards = [...(player.powerCards || []), newPowerCard];
        }
        break;

      case 'multiplier':
        // This would be handled in the game logic
        updates.boostActive = true;
        break;
    }

    return updates;
  }

  // Get specific power card by type
  getPowerCardByType(type: string): PowerCard {
    const card =
      this.powerCards.find((pc) => pc.type === type) || this.powerCards[0];
    return {
      ...card,
      id: `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentUses: 0,
    };
  }

  // Calculate betting multiplier
  getBettingMultiplier(betAmount: number): number {
    if (betAmount === 1) return 2;
    if (betAmount === 2) return 3;
    if (betAmount >= 3) return 4;
    return 1;
  }

  // Calculate total reward value for display
  calculateRewardValue(rewards: RewardResult): number {
    let totalValue = 0;

    totalValue += rewards.bonusTokens * 2; // Each token worth 2 points
    totalValue += rewards.totalPoints;

    if (rewards.powerCard) {
      totalValue += 5; // Power cards worth 5 points
    }

    rewards.combosAchieved.forEach((combo) => {
      totalValue += combo.reward.amount;
    });

    return totalValue;
  }

  // Get achievement statistics
  getAchievementStats(players: Player[]): {
    totalCombos: number;
    mostPowerCards: { playerName: string; count: number };
    richestPlayer: { playerName: string; tokens: number };
  } {
    const totalCombos = players.reduce(
      (sum, player) => sum + (player.activePowers?.length || 0),
      0
    );

    const mostPowerCards = players.reduce(
      (max, player) =>
        (player.powerCards?.length || 0) > max.count
          ? { playerName: player.name, count: player.powerCards?.length || 0 }
          : max,
      { playerName: '', count: 0 }
    );

    const richestPlayer = players.reduce(
      (max, player) =>
        (player.tokens || 0) > max.tokens
          ? { playerName: player.name, tokens: player.tokens || 0 }
          : max,
      { playerName: '', tokens: 0 }
    );

    return {
      totalCombos,
      mostPowerCards,
      richestPlayer,
    };
  }

  // Generate reward notification message
  generateRewardMessage(rewards: RewardResult, playerName: string): string {
    const messages: string[] = [];

    if (rewards.powerCard) {
      messages.push(
        `🎁 ${playerName} ganó carta de poder: ${rewards.powerCard.name}!`
      );
    }

    if (rewards.bonusTokens > 0) {
      messages.push(
        `🪙 ${playerName} ganó ${rewards.bonusTokens} token${
          rewards.bonusTokens > 1 ? 's' : ''
        } extra!`
      );
    }

    if (rewards.combosAchieved.length > 0) {
      rewards.combosAchieved.forEach((combo) => {
        messages.push(`🔥 ${playerName} logró el combo: ${combo.name}!`);
      });
    }

    return messages.join('\n') || `🎉 ${playerName} completó la pregunta!`;
  }

  // Validate power card usage
  canUsePowerCard(player: Player, powerCardId: string): boolean {
    const powerCard = player.powerCards?.find((pc) => pc.id === powerCardId);

    if (!powerCard) return false;
    if (powerCard.currentUses >= powerCard.usageLimit) return false;

    // Check specific power card restrictions
    switch (powerCard.type) {
      case 'robo':
        // Can't use if no other players have tokens
        return true; // This would check other players in real implementation

      case 'escudo':
        // Can't use if already immune
        return !player.isImmune;

      case 'boost':
        // Can't use if boost already active
        return !player.boostActive;

      default:
        return true;
    }
  }

  // Get power card cooldown info
  getPowerCardCooldown(powerCard: PowerCard): {
    isOnCooldown: boolean;
    turnsLeft: number;
  } {
    const isOnCooldown = powerCard.currentUses >= powerCard.usageLimit;
    const turnsLeft = Math.max(0, powerCard.usageLimit - powerCard.currentUses);

    return { isOnCooldown, turnsLeft };
  }

  // Calculate end game rewards
  calculateEndGameRewards(players: Player[]): Record<string, any> {
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max
    );

    const achievements = {
      winner: winner.name,
      mostTokens: players.reduce((max, p) => (p.tokens > max.tokens ? p : max))
        .name,
      mostPowerCards: players.reduce((max, p) =>
        (p.powerCards?.length || 0) > (max.powerCards?.length || 0) ? p : max
      ).name,
      highestScore: winner.score,
    };

    return achievements;
  }
}

export const rewardsService = new RewardsService();
