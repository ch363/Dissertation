import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { theme as baseTheme } from '@/theme';

type Props = {
  onPressSettings: () => void;
};

export function HomeHeader({ onPressSettings }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        onPress={onPressSettings}
        hitSlop={12}
        style={[
          styles.settingsButton
        ]}
      >
        <Ionicons name="settings-outline" size={28} color={theme.colors.text} />
      </Pressable>

      <Image
        source={require('../../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    marginTop: 2,
    fontFamily: baseTheme.typography.bold,
    fontSize: 30,
    letterSpacing: 0.2,
  },
});

