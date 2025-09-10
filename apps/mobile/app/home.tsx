import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function HomeRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/home');
  }, []);
  return <View />;
}
