import { Platform } from 'react-native';

// Lazy load FileSystem to avoid native module errors during hot reload
let FileSystemModule: typeof import('expo-file-system') | null = null;

async function getFileSystemModule(): Promise<typeof import('expo-file-system') | null> {
  // expo-file-system is not reliably available on web.
  if (Platform.OS === 'web') return null;

  if (!FileSystemModule) {
    try {
      FileSystemModule = await import('expo-file-system');
    } catch (error) {
      // Treat this as a non-fatal optional capability: avatar caching is best-effort.
      console.warn('expo-file-system native module not available; avatar caching disabled:', error);
      return null;
    }
  }
  return FileSystemModule;
}

const AVATAR_CACHE_DIR = 'avatars';

/**
 * Get the cache directory path for avatars
 */
async function getCacheDirectory(): Promise<string | null> {
  const FileSystem = await getFileSystemModule();
  const cacheDir = FileSystem?.cacheDirectory;
  if (!cacheDir) {
    return null;
  }
  return `${cacheDir}${AVATAR_CACHE_DIR}`;
}

/**
 * Get the cached avatar file path for a user
 */
async function getCachedAvatarFilePath(userId: string): Promise<string | null> {
  const cacheDir = await getCacheDirectory();
  if (!cacheDir) return null;
  return `${cacheDir}/${userId}.jpg`;
}

/**
 * Ensure the avatar cache directory exists
 */
async function ensureCacheDirectory(): Promise<void> {
  const FileSystem = await getFileSystemModule();
  const cacheDir = await getCacheDirectory();
  if (!FileSystem || !cacheDir) return;

  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }
}

/**
 * Cache an avatar file locally
 * @param uri - Local file URI (from expo-image-picker)
 * @param userId - User ID to use as cache key
 * @returns Path to the cached file
 */
export async function cacheAvatarFile(uri: string, userId: string): Promise<string> {
  try {
    const FileSystem = await getFileSystemModule();
    if (!FileSystem) return uri;

    await ensureCacheDirectory();
    const cachedPath = await getCachedAvatarFilePath(userId);
    if (!cachedPath) return uri;
    
    // Copy the file to cache directory
    await FileSystem.copyAsync({
      from: uri,
      to: cachedPath,
    });
    
    return cachedPath;
  } catch (error) {
    console.error('Failed to cache avatar file:', error);
    throw new Error('Failed to cache avatar file');
  }
}

/**
 * Get the cached avatar file path if it exists
 * @param userId - User ID
 * @returns Cached file path or null if not found
 */
export async function getCachedAvatarPath(userId: string): Promise<string | null> {
  try {
    const FileSystem = await getFileSystemModule();
    if (!FileSystem) return null;

    const cachedPath = await getCachedAvatarFilePath(userId);
    if (!cachedPath) return null;
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    
    if (fileInfo.exists && !fileInfo.isDirectory) {
      return cachedPath;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to check cached avatar:', error);
    return null;
  }
}

/**
 * Clear the cached avatar for a user
 * @param userId - User ID
 */
export async function clearCachedAvatar(userId: string): Promise<void> {
  try {
    const FileSystem = await getFileSystemModule();
    if (!FileSystem) return;

    const cachedPath = await getCachedAvatarFilePath(userId);
    if (!cachedPath) return;
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(cachedPath, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to clear cached avatar:', error);
    // Don't throw - clearing cache is not critical
  }
}

/**
 * Get avatar URI - returns cached path if available, otherwise returns the provided URL
 * @param userId - User ID
 * @param url - Fallback URL (Supabase Storage URL)
 * @returns Local cached path or URL
 */
export async function getAvatarUri(userId: string, url: string | null): Promise<string | null> {
  if (!url) {
    return null;
  }
  
  const cachedPath = await getCachedAvatarPath(userId);
  if (cachedPath) {
    return cachedPath;
  }
  
  return url;
}
