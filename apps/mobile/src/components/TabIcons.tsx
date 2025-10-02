import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function HomeIcon({ size = 48, color = '#1F7AE0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 10.5l9-7 9 7V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5H10v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
    </Svg>
  );
}

export function LearnIcon({ size = 48, color = '#12BFA1' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="2" y="9" width="4" height="6" rx="1" />
      <Rect x="18" y="9" width="4" height="6" rx="1" />
      <Rect x="6.5" y="10.5" width="11" height="3" rx="1.5" />
    </Svg>
  );
}

export function ProfileIcon({ size = 48, color = '#1F7AE0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8v1H4v-1z" />
    </Svg>
  );
}

export function SettingsIcon({ size = 48, color = '#FFA320' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 3l6 3.5v7L12 17l-6-3.5v-7L12 3z" />
      <Circle cx="12" cy="12" r="3" fill="#fff" opacity="0.25" />
    </Svg>
  );
}
