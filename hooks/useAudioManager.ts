// hooks/useAudioManager.ts
import { audioService } from '@/services/audioService';
import { useCallback, useEffect, useRef } from 'react';

interface UseAudioManagerProps {
  previewUrl?: string;
  onAudioComplete?: () => void;
  autoPlay?: boolean;
  duration?: number;
}

export const useAudioManager = ({
  previewUrl,
  onAudioComplete,
  autoPlay = false,
  duration = 5000,
}: UseAudioManagerProps) => {
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 🎵 Play Audio
  const playAudio = useCallback(async () => {
    if (!previewUrl || isPlayingRef.current) return;

    try {
      isPlayingRef.current = true;

      // Stop any existing audio first
      await audioService.stopAudio();

      // Play new audio
      await audioService.playTrackPreview(previewUrl, duration, () => {
        isPlayingRef.current = false;
        onAudioComplete?.();
      });

      // Fallback timeout in case callback fails
      timeoutRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          stopAudio();
          onAudioComplete?.();
        }
      }, duration + 1000);
    } catch (error) {
      console.error('🎵 Audio play failed:', error);
      isPlayingRef.current = false;
      onAudioComplete?.();
    }
  }, [previewUrl, duration, onAudioComplete]);

  // 🛑 Stop Audio
  const stopAudio = useCallback(async () => {
    try {
      await audioService.stopAudio();
      isPlayingRef.current = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    } catch (error) {
      console.error('🛑 Audio stop failed:', error);
    }
  }, []);

  // 🚀 Auto-play effect
  useEffect(() => {
    if (autoPlay && previewUrl && !isPlayingRef.current) {
      playAudio();
    }
  }, [autoPlay, previewUrl, playAudio]);

  // 🧹 Cleanup
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    isPlaying: isPlayingRef.current,
    playAudio,
    stopAudio,
  };
};
