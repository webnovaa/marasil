import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export interface BrandLogoProps {
  width?: number;
  tone?: 'color' | 'white';
  decorative?: boolean;
  style?: StyleProp<ImageStyle>;
}

export function BrandLogo({
  width = 160,
  tone = 'color',
  decorative = false,
  style,
}: BrandLogoProps) {
  const height = Math.round((width * 275) / 420);

  return (
    <Image
      source={
        tone === 'white'
          ? require('../assets/brand/logo-white.png')
          : require('../assets/brand/logo.png')
      }
      resizeMode="contain"
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : 'مراسيل - Marasil'}
      style={[{ width, height }, style]}
    />
  );
}
