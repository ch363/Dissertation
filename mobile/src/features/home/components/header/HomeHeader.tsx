import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

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
        style={[styles.settingsButton]}
      >
        <Ionicons
          name="settings-outline"
          size={28}
          color={theme.colors.text}
          accessible={false}
          importantForAccessibility="no"
        />
      </Pressable>

      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
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
    width: 55,
    height: 55,
  },
  title: {
    marginTop: 2,
    fontFamily: baseTheme.typography.bold,
    fontSize: 30,
    letterSpacing: 0.2,
  },
});
