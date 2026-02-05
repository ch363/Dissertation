import { Platform } from 'react-native';

/**
 * Secure storage adapter for Supabase using expo-secure-store.
 * Falls back to memory storage on web or if secure store is unavailable.
 *
 * Note: This provides encrypted storage on iOS (Keychain) and Android (Keystore).
 * For production use, ensure proper testing across all platforms.
 */

// In-memory fallback for web or when SecureStore fails
const memoryStorage: Record<string, string> = {};

// Dynamically check if SecureStore native module is available
// This handles Expo Go, web, and missing native builds gracefully
let SecureStore: typeof import('expo-secure-store') | null = null;
let isSecureStoreAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // Dynamic require to avoid crash if native module is missing
    SecureStore = require('expo-secure-store');
    isSecureStoreAvailable = true;
  } catch {
    console.warn(
      'expo-secure-store native module not available. ' +
        'Using memory storage. For production, use a development build (expo run:ios/android).'
    );
  }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isSecureStoreAvailable || !SecureStore) {
      return memoryStorage[key] ?? null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItem failed, using memory storage:', error);
      return memoryStorage[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isSecureStoreAvailable || !SecureStore) {
      memoryStorage[key] = value;
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore setItem failed, using memory storage:', error);
      memoryStorage[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isSecureStoreAvailable || !SecureStore) {
      delete memoryStorage[key];
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore removeItem failed, using memory storage:', error);
      delete memoryStorage[key];
    }
  },
};
