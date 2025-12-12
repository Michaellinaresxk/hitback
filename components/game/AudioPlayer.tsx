import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Audio } from 'expo-av';
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

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinishedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🎵 Configurar modo de audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
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

    const loadAndPlay = async () => {
      // Limpiar audio anterior
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      if (!previewUrl) {
        setError('No hay URL de audio');
        setIsLoading(false);
        // Aún así llamar onAudioFinished después de un delay
        setTimeout(() => {
          if (isMounted && onAudioFinished && !hasFinishedRef.current) {
            hasFinishedRef.current = true;
            onAudioFinished();
          }
        }, 2000);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log(`🎵 AudioPlayer: Loading ${previewUrl}`);

        const { sound } = await Audio.Sound.createAsync(
          { uri: previewUrl },
          { shouldPlay: autoPlay, volume: 1.0 }
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setIsPlaying(autoPlay);
        setIsLoading(false);
        setTimeLeft(Math.ceil(duration / 1000));

        console.log(`✅ AudioPlayer: Playing for ${duration}ms`);

        // Iniciar animación de pulso
        startPulseAnimation();

        // Iniciar countdown
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Detener después de duration
        setTimeout(async () => {
          if (!isMounted) return;

          console.log(`⏰ AudioPlayer: Duration reached, stopping...`);

          // Limpiar timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Detener audio
          if (soundRef.current) {
            try {
              await soundRef.current.stopAsync();
            } catch {}
          }

          setIsPlaying(false);
          setTimeLeft(0);

          // Llamar callback solo una vez
          if (onAudioFinished && !hasFinishedRef.current) {
            hasFinishedRef.current = true;
            console.log(`✅ AudioPlayer: Calling onAudioFinished`);
            onAudioFinished();
          }
        }, duration);
      } catch (err) {
        console.error('❌ AudioPlayer error:', err);
        if (isMounted) {
          setError('Error reproduciendo audio');
          setIsLoading(false);

          // Llamar onAudioFinished incluso si hay error
          setTimeout(() => {
            if (isMounted && onAudioFinished && !hasFinishedRef.current) {
              hasFinishedRef.current = true;
              onAudioFinished();
            }
          }, 2000);
        }
      }
    };

    if (autoPlay) {
      loadAndPlay();
    }

    // Cleanup
    return () => {
      isMounted = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [previewUrl]); // Solo depende de previewUrl para evitar múltiples reproducciones

  // 🎨 Animación de pulso
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
        {/* Icono */}
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

          {/* Estado */}
          <View style={styles.statusContainer}>
            {isLoading ? (
              <Text style={styles.statusText}>Cargando audio...</Text>
            ) : error ? (
              <Text style={[styles.statusText, styles.errorText]}>{error}</Text>
            ) : isPlaying ? (
              <Text style={styles.statusText}>
                🎵 Reproduciendo... {timeLeft}s
              </Text>
            ) : (
              <Text style={[styles.statusText, styles.finishedText]}>
                ✅ Audio completado
              </Text>
            )}
          </View>
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
