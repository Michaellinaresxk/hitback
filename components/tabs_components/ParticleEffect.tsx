import React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { styles } from './styles';

interface ParticleEffectProps {
  isVisible: boolean;
}

const PARTICLE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
const PARTICLE_COUNT = 6;

export default function ParticleEffect({ isVisible }: ParticleEffectProps) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(0);

    React.useEffect(() => {
      if (isVisible) {
        opacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        translateY.value = withTiming(-20 - Math.random() * 30, {
          duration: 800,
          easing: Easing.out(Easing.quad),
        });
        translateX.value = withTiming((Math.random() - 0.5) * 40, {
          duration: 800,
        });
        scale.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
      } else {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0, { duration: 200 });
      }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    }));

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          animatedStyle,
          {
            left: `${20 + Math.random() * 60}%`,
            backgroundColor:
              PARTICLE_COLORS[
                Math.floor(Math.random() * PARTICLE_COLORS.length)
              ],
          },
        ]}
      />
    );
  });

  return <View style={styles.particleContainer}>{particles}</View>;
}
