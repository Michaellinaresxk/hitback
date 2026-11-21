import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { AudioPlayer as ExpoAudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface AudioPlayerProps {
  previewUrl: string;
  trackTitle: string;
  artist: string;
  duration?: number; // ms - default 5000 (5 segundos)
  autoPlay?: boolean;
  onAudioFinished?: () => void;
}

export default function AudioPlayer({
  previewUrl,
  trackTitle,
  artist,
  duration = 5000,
  autoPlay = true,
  onAudioFinished,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));

  const playerRef = useRef<ExpoAudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFinishedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🎵 Configurar modo de audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
          allowsRecording: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch (err) {
        console.error('Error setting audio mode:', err);
      }
    };

    setupAudio();
  }, []);

  // 🎵 Cargar y reproducir audio
  useEffect(() => {
    let isMounted = true;
    hasFinishedRef.current = false;

    const cleanupPlayer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch {}
        playerRef.current = null;
      }
    };

    const finishOnce = () => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      onAudioFinished?.();
    };

    const loadAndPlay = async () => {
      cleanupPlayer();

      if (!previewUrl) {
        setError('No hay URL de audio');
        setIsLoading(false);
        setTimeout(() => {
          if (isMounted) finishOnce();
        }, 2000);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setTimeLeft(Math.ceil(duration / 1000));
        console.log(`🎵 AudioPlayer: Loading ${previewUrl}`);

        const player = createAudioPlayer(previewUrl);
        player.volume = 1.0;

        if (!isMounted) {
          try { player.remove(); } catch {}
          return;
        }

        playerRef.current = player;

        if (autoPlay) {
          player.play();
        }

        setIsPlaying(autoPlay);
        setIsLoading(false);

        console.log(`✅ AudioPlayer: Playing for ${duration}ms`);
        startPulseAnimation();

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        stopTimeoutRef.current = setTimeout(() => {
          if (!isMounted) return;
          console.log(`⏰ AudioPlayer: Duration reached, stopping...`);

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (playerRef.current) {
            try { playerRef.current.pause(); } catch {}
          }

          setIsPlaying(false);
          setTimeLeft(0);
          finishOnce();
        }, duration);
      } catch (err) {
        console.error('❌ AudioPlayer error:', err);
        if (isMounted) {
          setError('Error reproduciendo audio');
          setIsLoading(false);
          setTimeout(() => {
            if (isMounted) finishOnce();
          }, 2000);
        }
      }
    };

    if (autoPlay) {
      loadAndPlay();
    }

    return () => {
      isMounted = false;
      cleanupPlayer();
    };
  }, [previewUrl]); // Only depends on previewUrl to avoid multiple plays

  // 🎨 Pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.playerCard,
          isPlaying && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            isPlaying && styles.iconPlaying,
            error && styles.iconError,
          ]}
        >
          {isLoading ? (
            <IconSymbol name='hourglass' size={32} color='#3B82F6' />
          ) : error ? (
            <IconSymbol
              name='exclamationmark.triangle'
              size={32}
              color='#EF4444'
            />
          ) : isPlaying ? (
            <IconSymbol name='waveform' size={32} color='#10B981' />
          ) : (
            <IconSymbol name='checkmark.circle' size={32} color='#10B981' />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {trackTitle}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        {/* Countdown */}
        {isPlaying && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{timeLeft}</Text>
            <Text style={styles.countdownLabel}>seg</Text>
          </View>
        )}
      </Animated.View>

      {/* Barra de progreso */}
      {isPlaying && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(timeLeft / (duration / 1000)) * 100}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  playerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPlaying: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  iconError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444',
  },
  finishedText: {
    color: '#10B981',
  },
  countdownContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  countdownLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
});
