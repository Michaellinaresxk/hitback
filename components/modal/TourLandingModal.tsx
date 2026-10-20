import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BoardTile, MechanicTrigger, TileType } from '@/types/worldTour.types';
import { TILE_MECHANICS } from '@/constants/worldTour';
import citiesData from '@/constants/worldTourCities.json';

// Build a flat id→city lookup from the JSON at module load time
const _allCities = (
  Object.values(citiesData) as Array<
    Array<{
      id: string;
      name: string;
      venue: string;
      story: string;
      realFact: string;
    }>
  >
).flat();
const CITY_MAP = Object.fromEntries(_allCities.map((c) => [c.id, c]));

export interface TourLandingEvent {
  tile: BoardTile;
  playerId: string;
  playerName: string;
  isActTransition: boolean;
  newActId?: string;
}

interface TourLandingModalProps {
  visible: boolean;
  event: TourLandingEvent | null;
  onContinue: (mechanicTrigger: MechanicTrigger | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// TILE TYPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const TILE_COLORS: Record<
  TileType,
  { bg: string; border: string; text: string }
> = {
  concert: {
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.4)',
    text: '#818CF8',
  },
  festival: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)',
    text: '#FCD34D',
  },
  record_deal: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    text: '#4ADE80',
  },
  rival_band: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#F87171',
  },
  sold_out: {
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    text: '#FB923C',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TourLandingModal({
  visible,
  event,
  onContinue,
}: TourLandingModalProps) {
  const { t } = useTranslation();

  if (!event) return null;

  const { tile, playerName, isActTransition, newActId } = event;
  const { cityId, emoji, tileType, position } = tile;

  const cityJson = CITY_MAP[cityId];
  const cityName = cityJson?.name ?? t(`tour.cities.${cityId}.city`);
  const venueName = cityJson?.venue ?? t(`tour.cities.${cityId}.venue`);
  const story = cityJson?.story ?? t(`tour.cities.${cityId}.story`);
  const realFact = cityJson?.realFact ?? t(`tour.cities.${cityId}.realFact`);
  const tileTypeName = t(`tour.tileTypes.${tileType}.name`);
  const tileTypeDesc = t(`tour.tileTypes.${tileType}.description`);

  const colors = TILE_COLORS[tileType];
  const mechanicTrigger = TILE_MECHANICS[tileType];

  const handleContinue = () => {
    onContinue(mechanicTrigger);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={handleContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Act Transition Banner */}
            {isActTransition && newActId && (
              <View style={styles.actBanner}>
                <Text style={styles.actBannerText}>
                  {t('tour.ui.actTransition')}
                </Text>
                <Text style={styles.actBannerName}>
                  {t(`tour.acts.${newActId}.name`)}
                </Text>
                <Text style={styles.actBannerSub}>
                  {t(`tour.acts.${newActId}.subtitle`)}
                </Text>
              </View>
            )}

            {/* City Header */}
            <Text style={styles.cityEmoji}>{emoji}</Text>
            <Text style={styles.position}>📍 {position}/21</Text>
            <Text style={styles.cityName}>{cityName}</Text>
            <Text style={styles.venueName}>🎤 {venueName}</Text>

            {/* Tile Type Badge */}
            <View
              style={[
                styles.tileTypeBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.tileTypeText, { color: colors.text }]}>
                {tileTypeName}
              </Text>
            </View>

            {/* Player indicator */}
            <Text style={styles.playerLabel}>{playerName} avanza aquí</Text>

            {/* Story */}
            <View style={styles.storyContainer}>
              <Text style={styles.storyText}>{story}</Text>
            </View>

            {/* Real Fact */}
            <View style={styles.factContainer}>
              <Text style={styles.factLabel}>{t('tour.ui.factLabel')}</Text>
              <Text style={styles.factText}>{realFact}</Text>
            </View>

            {/* Mechanic Preview */}
            {mechanicTrigger && (
              <View
                style={[
                  styles.mechanicPreview,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.mechanicText, { color: colors.text }]}>
                  {tileTypeDesc}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.text }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {mechanicTrigger ? tileTypeDesc : t('tour.ui.continueButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#0F172A',
    width: '92%',
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },

  // ── Act Transition ────────────────────────────────────────────────────
  actBanner: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  actBannerText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '700',
  },
  actBannerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#C4B5FD',
    letterSpacing: 1,
    marginTop: 4,
  },
  actBannerSub: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // ── City Header ───────────────────────────────────────────────────────
  cityEmoji: {
    fontSize: 64,
    marginTop: 4,
  },
  position: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cityName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  venueName: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Tile Type Badge ───────────────────────────────────────────────────
  tileTypeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  tileTypeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Player ────────────────────────────────────────────────────────────
  playerLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
  },

  // ── Story ─────────────────────────────────────────────────────────────
  storyContainer: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  storyText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
    textAlign: 'left',
  },

  // ── Fact ──────────────────────────────────────────────────────────────
  factContainer: {
    width: '100%',
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  factLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAB308',
    marginBottom: 6,
  },
  factText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },

  // ── Mechanic Preview ──────────────────────────────────────────────────
  mechanicPreview: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  mechanicText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Button ────────────────────────────────────────────────────────────
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
});
