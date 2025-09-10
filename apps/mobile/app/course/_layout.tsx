import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function CourseLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        title: 'Course',
      }}
    />
  );
}
