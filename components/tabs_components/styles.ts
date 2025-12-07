import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },

  backgroundOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },

  orb1: {
    width: 120,
    height: 120,
    backgroundColor: '#3B82F6',
    top: -60,
    left: -30,
  },

  orb2: {
    width: 100,
    height: 100,
    backgroundColor: '#10B981',
    bottom: -50,
    right: -20,
  },

  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    zIndex: 10,
  },

  floatingButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  floatingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
  },

  activeTabButtonContent: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  iconContainer: {
    marginBottom: 2,
  },

  activeIconContainer: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  activeTabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  dockReflection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },

  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '50%',
  },

  glowEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
});
