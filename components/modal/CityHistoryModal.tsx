import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVisitedCities } from '@/hooks/useVisitedCities';
import { useGameStore } from '@/store/gameStore';
import { isBackstagePosition } from '@/utils/worldtourUtils';

interface CityHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  playerId?: string;
}

export default function CityHistoryModal({
  visible,
  onClose,
  playerId,
}: CityHistoryModalProps) {
  const { t } = useTranslation();
  const { players, playMode, backstageInterval } = useGameStore();
  const resolvedPlayerId = playerId || players[0]?.id || 'player_1';
  const { visitedCities, totalRouteLength, currentPosition, playerName } =
    useVisitedCities(resolvedPlayerId);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Historial de Ciudades</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole='button'>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              {playerName} · {t('tour.progress', {
                current: Math.min(currentPosition + 1, totalRouteLength || 22),
                total: totalRouteLength || 22,
              })}
            </Text>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {visitedCities.length === 0 ? (
                <Text style={styles.noCitiesVisited}>{t('tour.noCitiesVisited')}</Text>
              ) : (
                visitedCities.map((city) => {
                  const backstage =
                    playMode === 'digital' &&
                    !!backstageInterval &&
                    isBackstagePosition(city.position, backstageInterval);
                  return (
                    <View key={`${city.cityId}-${city.position}`} style={styles.cityRow}>
                      <Text style={styles.cityEmoji}>{city.emoji}</Text>
                      <View style={styles.cityInfo}>
                        <Text style={styles.cityName}>
                          {city.position + 1}. {city.name} {backstage ? '🎟️' : ''}
                        </Text>
                        <Text style={styles.cityMeta}>
                          {city.country}
                          {city.venue ? ` · ${city.venue}` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ruta: {totalRouteLength || 22} ciudades totales</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    maxHeight: '85%',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748B',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    gap: 10,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
  },
  cityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cityMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  noCitiesVisited: {
    padding: 20,
    textAlign: 'center',
    color: '#64748B',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
