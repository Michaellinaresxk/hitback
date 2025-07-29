import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Background Geometric Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingShape, styles.shape1]} />
        <View style={[styles.floatingShape, styles.shape2]} />
        <View style={[styles.floatingShape, styles.shape3]} />
        <View style={[styles.floatingShape, styles.shape4]} />
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>HITBACK</Text>
          <Text style={styles.subtitle}>Game Master Edition</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Players</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Primary Action */}
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.push('/setup-game')}
          activeOpacity={0.95}
        >
          <View style={styles.primaryActionContent}>
            <View style={styles.primaryIcon}>
              <IconSymbol name='plus.circle.fill' size={28} color='#FFFFFF' />
            </View>
            <View style={styles.primaryTextContent}>
              <Text style={styles.primaryTitle}>New Game</Text>
              <Text style={styles.primarySubtitle}>
                Create a music quiz for 2-8 players
              </Text>
            </View>
            <View style={styles.primaryArrow}>
              <IconSymbol
                name='chevron.right'
                size={20}
                color='rgba(255,255,255,0.7)'
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.secondaryAction, styles.continueAction]}
            activeOpacity={0.9}
          >
            <View style={styles.secondaryIconContainer}>
              <IconSymbol name='clock.fill' size={24} color='#FFFFFF' />
            </View>
            <Text style={styles.secondaryActionText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryAction, styles.statsAction]}
            activeOpacity={0.9}
          >
            <View style={styles.secondaryIconContainer}>
              <IconSymbol name='chart.bar.fill' size={24} color='#FFFFFF' />
            </View>
            <Text style={styles.secondaryActionText}>Statistics</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              activeOpacity={0.8}
            >
              <IconSymbol name='music.note' size={20} color='#64748B' />
              <Text style={styles.quickAccessText}>Music Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              activeOpacity={0.8}
            >
              <IconSymbol name='gear' size={20} color='#64748B' />
              <Text style={styles.quickAccessText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              activeOpacity={0.8}
            >
              <IconSymbol
                name='questionmark.circle'
                size={20}
                color='#64748B'
              />
              <Text style={styles.quickAccessText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ready to create amazing musical experiences
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Background Elements
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  floatingShape: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.03,
  },

  shape1: {
    width: 200,
    height: 200,
    backgroundColor: '#3B82F6',
    top: height * 0.1,
    right: -50,
  },

  shape2: {
    width: 150,
    height: 150,
    backgroundColor: '#8B5CF6',
    bottom: height * 0.3,
    left: -30,
  },

  shape3: {
    width: 100,
    height: 100,
    backgroundColor: '#06B6D4',
    top: height * 0.4,
    left: width * 0.1,
  },

  shape4: {
    width: 120,
    height: 120,
    backgroundColor: '#10B981',
    bottom: height * 0.1,
    right: width * 0.2,
  },

  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 1,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },

  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  statCard: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 24,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },

  // Primary Action
  primaryAction: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },

  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },

  primaryIcon: {
    marginRight: 16,
  },

  primaryTextContent: {
    flex: 1,
  },

  primaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  primarySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  primaryArrow: {
    marginLeft: 12,
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },

  secondaryAction: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  continueAction: {
    backgroundColor: '#EF4444',
  },

  statsAction: {
    backgroundColor: '#10B981',
  },

  secondaryIconContainer: {
    marginBottom: 8,
  },

  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Quick Access
  quickAccessSection: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },

  quickAccessGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  quickAccessCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  quickAccessText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    zIndex: 1,
  },

  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
