import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { audioService } from '@/services/audioService';

interface AudioPlayerProps {
  previewUrl: string | null;
  trackTitle?: string;
  artist?: string;
  duration?: number;
  onAudioFinished?: () => void;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  previewUrl,
  trackTitle = 'Unknown Track',
  artist = 'Unknown Artist',
  duration = 5000,
  onAudioFinished,
  autoPlay = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (autoPlay && previewUrl) {
      handlePlay();
    }

    return () => {
      audioService.stopAudio();
    };
  }, [previewUrl, autoPlay]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStop();
            onAudioFinished?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Animate progress bar
      Animated.timing(progress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const handlePlay = async () => {
    if (!previewUrl) {
      console.error('❌ No preview URL available');
      return;
    }

    try {
      setIsPlaying(true);
      setTimeLeft(duration / 1000);

      await audioService.playTrackPreview(previewUrl, duration, () => {
        setIsPlaying(false);
        setTimeLeft(0);
        onAudioFinished?.();
      });
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleStop = async () => {
    try {
      await audioService.stopAudio();
      setIsPlaying(false);
      setTimeLeft(duration / 1000);
      progress.setValue(0);
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
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
        >
          <IconSymbol
            name={isPlaying ? 'stop.fill' : 'play.fill'}
            size={20}
            color='#FFFFFF'
          />
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {isPlaying ? `${timeLeft}s` : `${duration / 1000}s`}
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
