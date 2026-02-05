import { Platform } from 'react-native';
import { createLogger } from '@/services/logging';

const logger = createLogger('FileSystemLoader');

let FileSystemModule: typeof import('expo-file-system') | null = null;

/**
 * Dynamically imports and caches the expo-file-system module
 * Returns null on web platform or if the module is not available
 *
 * This helper eliminates duplication of the FileSystem loading pattern
 * across multiple services
 */
export async function getFileSystemModule(): Promise<typeof import('expo-file-system') | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!FileSystemModule) {
    try {
      FileSystemModule = await import('expo-file-system');
    } catch (error) {
      logger.warn('expo-file-system native module not available', { error });
      return null;
    }
  }

  return FileSystemModule;
}
