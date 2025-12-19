// Modal que aparece cuando un jugador obtiene una nueva Power Card

import { POWER_CARD_CONFIG } from '@/constants/PowerCard';
import { getCategoryColor } from '@/helpers/powerCard.helpers';
import { PowerCardInstance } from '@/types/powerCard.types';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface NewCardModalProps {
  visible: boolean;
  card: PowerCardInstance | null;
  playerName: string;
  onClose: () => void;
  reason?: 'combo' | 'scan' | 'steal' | 'resurrect' | 'start';
}

export default function NewPowerCardModal({
  visible,
  card,
  playerName,
  onClose,
  reason = 'scan',
}: NewCardModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && card) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);

      // Secuencia de animación
      Animated.sequence([
        // Entrada con giro
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Glow pulsante
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [visible, card]);

  if (!visible || !card) return null;

  const config = POWER_CARD_CONFIG[card.type];
  const categoryColor = getCategoryColor(config.category);

  const reasonText = {
    combo: '🔥 ¡COMBO!',
    scan: '📱 ¡ESCANEADA!',
    steal: '🥷 ¡ROBADA!',
    resurrect: '🔄 ¡RESUCITADA!',
    start: '🎮 ¡CARTA INICIAL!',
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          {/* Título */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.reasonText}>{reasonText[reason]}</Text>
            <Text style={styles.titleText}>NUEVA POWER CARD</Text>
          </Animated.View>

          {/* Carta animada */}
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [{ scale: scaleAnim }, { rotateY: spin }],
                borderColor: categoryColor,
                shadowColor: categoryColor,
              },
            ]}
          >
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  backgroundColor: categoryColor,
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.3],
                  }),
                },
              ]}
            />

            {/* Contenido de la carta */}
            <View style={styles.cardContent}>
              {/* Icono grande */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${categoryColor}20` },
                ]}
              >
                <Text style={styles.cardIcon}>{card.icon}</Text>
              </View>

              {/* Nombre */}
              <Text style={styles.cardName}>{card.name}</Text>

              {/* Descripción */}
              <Text style={styles.cardDescription}>{card.description}</Text>

              {/* Tipo de efecto */}
              <View
                style={[
                  styles.effectTypeBadge,
                  { backgroundColor: `${categoryColor}20` },
                ]}
              >
                <Text style={[styles.effectTypeText, { color: categoryColor }]}>
                  {config.effectType === 'persistent'
                    ? '⏳ Efecto duradero'
                    : '⚡ Efecto inmediato'}
                </Text>
              </View>

              {/* Categoría */}
              <View style={styles.categoryContainer}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {config.category === 'offensive' && '⚔️ Ofensiva'}
                  {config.category === 'defensive' && '🛡️ Defensiva'}
                  {config.category === 'special' && '✨ Especial'}
                  {config.category === 'utility' && '🔧 Utilidad'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Jugador que recibe */}
          <Animated.View
            style={[
              styles.playerContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.playerLabel}>Otorgada a</Text>
            <Text style={styles.playerName}>{playerName}</Text>
          </Animated.View>

          {/* Botón cerrar */}
          <Animated.View
            style={[
              styles.closeButtonContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>¡ENTENDIDO!</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>
              Toca en cualquier lugar para cerrar
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },

  // Título
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reasonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 8,
    letterSpacing: 2,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 3,
  },

  // Carta
  cardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: width * 0.8,
    maxWidth: 320,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 200,
  },
  cardContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 56,
  },
  cardName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  effectTypeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  effectTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Jugador
  playerContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  playerLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  // Botón cerrar
  closeButtonContainer: {
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
