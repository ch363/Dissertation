import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function HomeRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/home');
  }, []);
  return <View />;
}
