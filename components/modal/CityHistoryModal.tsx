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
import type { BoardTile } from '@/types/worldTour.types';
import type { CityData } from '@/types/worldTour.types';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface CityHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  playerId?: string; // Si undefined, muestra el historial del jugador actual
}

export default function CityHistoryModal({
  visible,
  onClose,
  playerId,
}: CityHistoryModalProps) {
  const { t } = useTranslation();

  // Obtener datos del store - NOTE: Esto requiere acceso al store,
  // en un caso real usaríamos useGameStore aquí o pasar los datos por props
  // Para esta implementación, asumiremos que los datos vienen props o del store padre
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
    >
      <View style={styles.modalBackground}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Historial de Ciudades</Text>
            <Text style={styles.closeButtonText}>×</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Recorrido World Tour</Text>

            {/* Progreso */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                {t('tour.progress', {
                  current: 1,
                  total: 22,
                })}
              </Text>
              <View
                style={[
                  styles.progressBarBackground,
                  {
                    width: '100%',
                    height: 8,
                  },
                ]}
              />
            </View>

            <Text style={styles.noCitiesVisited}>
              {t('tour.noCitiesVisited')}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text>Ruta: 22 ciudades totales</Text>
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
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    maxHeight: '90%',
    marginHorizontal: 20,
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
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
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
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748B',
  },
});