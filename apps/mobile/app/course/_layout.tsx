import { Stack, useRouter } from 'expo-router';
import { theme } from '@/theme';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CourseLayout() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        title: 'Course',
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            hitSlop={12}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginLeft: 10,
    padding: 4,
  },
});
