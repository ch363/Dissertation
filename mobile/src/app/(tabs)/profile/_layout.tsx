import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="skills" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
    </Stack>
  );
}
