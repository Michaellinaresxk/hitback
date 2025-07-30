// hooks/useAudioPlayback.ts - 🎵 Hook de Audio Simplificado
import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';

interface UseAudioPlaybackProps {
  onAudioFinished?: () => void;
  duration?: number;
}

export const useAudioPlayback = ({
  onAudioFinished,
  duration = 5000,
}: UseAudioPlaybackProps = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 🎵 Initialize Audio System
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('Audio init warning:', error);
    }
  }, []);

  // 🎯 Play Audio
  const playAudio = useCallback(
    async (audioUrl: string) => {
      if (!audioUrl || isPlaying) return false;

      try {
        setIsLoading(true);
        await initializeAudio();

        // Stop any existing audio
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Create and play audio
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          {
            shouldPlay: true,
            volume: 1.0,
            rate: 1.0,
            isLooping: false,
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);
        setIsLoading(false);

        // Auto-stop after duration
        timeoutRef.current = setTimeout(() => {
          stopAudio();
          onAudioFinished?.();
        }, duration);

        return true;
      } catch (error) {
        console.error('Audio playback failed:', error);
        setIsLoading(false);
        setIsPlaying(false);
        return false;
      }
    },
    [isPlaying, duration, onAudioFinished, initializeAudio]
  );

  // 🛑 Stop Audio
  const stopAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      setIsPlaying(false);
      setIsLoading(false);
    } catch (error) {
      console.warn('Stop audio warning:', error);
    }
  }, []);

  // 🧹 Cleanup
  const cleanup = useCallback(async () => {
    await stopAudio();
  }, [stopAudio]);

  return {
    isPlaying,
    isLoading,
    playAudio,
    stopAudio,
    cleanup,
  };
};
