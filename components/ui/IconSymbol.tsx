// Fallback for using MaterialIcons on Android and web.

import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',
  'xmark.circle.fill': 'cancel',
  'xmark': 'close',
  'bolt.fill': 'bolt',
  'star.fill': 'star',
  'flame.fill': 'local-fire-department',
  'bitcoinsign.circle.fill': 'monetization-on',
  'sparkles': 'auto-awesome',
  'chart.bar.fill': 'bar-chart',
  'crown.fill': 'workspace-premium',
  'medal.fill': 'military-tech',
  'arrow.clockwise': 'refresh',
  'dice.fill': 'casino',
  'map': 'map',
  'clock': 'schedule',
  'play.circle': 'play-circle',
  'camera': 'photo-camera',
  'camera.fill': 'photo-camera',
  'flashlight.off.fill': 'flashlight-off',
  'flashlight.on.fill': 'flashlight-on',
  'timer': 'timer',
  'video.circle': 'videocam',
  'stop.circle': 'stop-circle',
  'qrcode': 'qr-code',
  'gamecontroller': 'sports-esports',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapped = MAPPING[name] || (name as ComponentProps<typeof MaterialIcons>['name']);
  return <MaterialIcons color={color} size={size} name={mapped} style={style} />;
}
