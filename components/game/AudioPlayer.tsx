// components/game/AudioPlayer.tsx - FIXED Audio Player
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AudioPlayerProps {
  previewUrl: string | null;
  trackTitle?: string;
  artist?: string;
  duration?: number; // Max duration in milliseconds
  onAudioFinished?: () => void;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  previewUrl,
  trackTitle = 'Unknown Track',
  artist = 'Unknown Artist',
  duration = 5000, // 5 seconds default
  onAudioFinished,
  autoPlay = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.floor(duration / 1000));
  const [progress] = useState(new Animated.Value(0));
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinished = useRef(false);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    return () => cleanup();
  }, []);

  // Auto play when preview URL changes
  useEffect(() => {
    if (autoPlay && previewUrl && !hasFinished.current) {
      handlePlay();
    }
  }, [previewUrl, autoPlay]);

  const initializeAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // 🔧 FIXED: Removed problematic properties
      });
    } catch (error) {
      console.warn('Audio initialization warning:', error);
    }
  };

  const handlePlay = async () => {
    if (!previewUrl || hasFinished.current) {
      console.warn('No preview URL available or already finished');
      return;
    }

    try {
      setIsLoading(true);

      // Stop any existing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      console.log('🎵 Loading audio:', previewUrl);

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        {
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0, // 🔧 FIXED: Ensure normal playback rate
          isLooping: false,
          isMuted: false,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
      setTimeLeft(Math.floor(duration / 1000));
      hasFinished.current = false;

      // Start progress animation
      Animated.timing(progress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Start countdown timer
      startCountdown();

      console.log('✅ Audio started successfully');
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsLoading(false);
      setIsPlaying(false);
      // Don't show alert, just handle gracefully
      onAudioFinished?.();
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.didJustFinish && !hasFinished.current) {
      console.log('🎵 Audio finished naturally');
      handleAudioEnd();
    }
  };

  const startCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAudioEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAudioEnd = () => {
    if (hasFinished.current) return;

    hasFinished.current = true;
    setIsPlaying(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    cleanup().then(() => {
      console.log('🎵 Audio ended, triggering callback');
      onAudioFinished?.();
    });
  };

  const handleStop = async () => {
    try {
      setIsPlaying(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await cleanup();

      // Reset values
      setTimeLeft(Math.floor(duration / 1000));
      progress.setValue(0);
      hasFinished.current = false;
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  };

  const cleanup = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!previewUrl) {
    return (
      <View style={styles.noAudioContainer}>
        <IconSymbol name='speaker.slash' size={24} color='#64748B' />
        <Text style={styles.noAudioText}>No hay audio disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {trackTitle}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playingButton]}
          onPress={isPlaying ? handleStop : handlePlay}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <IconSymbol name='clock' size={20} color='#FFFFFF' />
          ) : (
            <IconSymbol
              name={isPlaying ? 'stop.fill' : 'play.fill'}
              size={20}
              color='#FFFFFF'
            />
          )}
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {isPlaying ? `${timeLeft}s` : `${Math.floor(duration / 1000)}s`}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>

      {/* Status Indicator */}
      {isPlaying && (
        <View style={styles.statusContainer}>
          <View style={styles.audioWave} />
          <Text style={styles.statusText}>Reproduciendo...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  noAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 12,
    marginVertical: 8,
  },
  noAudioText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  trackInfo: {
    marginBottom: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playingButton: {
    backgroundColor: '#EF4444',
  },
  timeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  audioWave: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
});
