import {
  CARD_WIDTH,
  REACTION_CARDS,
  ReactionCardDef,
  ReactionCardPickerModalProps,
  ReactionCardType,
} from '@/constants/ReactionCard';
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function ReactionCardPickerModal({
  visible,
  targetPlayer,
  disabledCards = {},
  onSelect,
  onClose,
}: ReactionCardPickerModalProps) {
  if (!targetPlayer) return null;

  const handleSelect = (cardType: ReactionCardType) => {
    if (disabledCards[cardType]) return;
    onSelect(cardType, targetPlayer.id);
    onClose();
  };

  const renderCard = ({ item }: { item: ReactionCardDef }) => {
    const disabledReason = disabledCards[item.type];
    const isDisabled = !!disabledReason;

    return (
      <TouchableOpacity
        style={[styles.card, isDisabled && styles.cardDisabled]}
        onPress={() => handleSelect(item.type)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text
          style={[
            styles.cardLabel,
            { color: isDisabled ? '#475569' : item.color },
          ]}
        >
          {item.label}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {isDisabled ? disabledReason : item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{targetPlayer.name}</Text>
            <Text style={styles.headerSubtitle}>
              {targetPlayer.score} pts · ¿Qué reaction card aplicar?
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <FlatList
          data={REACTION_CARDS}
          keyExtractor={(item) => item.type}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          scrollEnabled={REACTION_CARDS.length > 6}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },

  // ── Grid ──
  grid: {
    padding: 16,
    gap: 10,
  },
  row: {
    gap: 10,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 4,
  },
  cardDisabled: {
    opacity: 0.35,
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});
