// Copy to <project>/components/BrandLogo.tsx; adjust the require path if stored elsewhere.
import { Image, type ImageStyle, type StyleProp } from 'react-native';

type Props = { width?: number; tone?: 'color' | 'white'; decorative?: boolean; style?: StyleProp<ImageStyle> };
export function BrandLogo({ width=144, tone='color', decorative=false, style }: Props) {
 return <Image
  source={tone === 'white' ? require('../assets/brand/logo-white.png') : require('../assets/brand/logo.png')}
  resizeMode="contain"
  accessible={!decorative}
  accessibilityLabel={decorative ? undefined : 'مراسل'}
  style={[{width,height:width * 275 / 420},style]}
 />;
}
