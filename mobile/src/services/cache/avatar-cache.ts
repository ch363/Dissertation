import { createLogger } from '@/services/logging';
import { getFileSystemModule } from '@/services/utils/file-system-loader';

const Logger = createLogger('AvatarCache');

const AVATAR_CACHE_DIR = 'avatars';

async function getCacheDirectory(): Promise<string | null> {
  const FileSystem = await getFileSystemModule();
  const cacheDir = FileSystem?.cacheDirectory;
  if (!cacheDir) {
    return null;
  }
  return `${cacheDir}${AVATAR_CACHE_DIR}`;
}

async function getCachedAvatarFilePath(userId: string): Promise<string | null> {
  const cacheDir = await getCacheDirectory();
  if (!cacheDir) return null;
  return `${cacheDir}/${userId}.jpg`;
}

async function ensureCacheDirectory(): Promise<void> {
  const FileSystem = await getFileSystemModule();
  const cacheDir = await getCacheDirectory();
  if (!FileSystem || !cacheDir) return;

  const dirInfo = await FileSystem.getInfoAsync(cacheDir);

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }
}

export async function cacheAvatarFile(uri: string, userId: string): Promise<string> {
  try {
    const FileSystem = await getFileSystemModule();
    if (!FileSystem) return uri;

    await ensureCacheDirectory();
    const cachedPath = await getCachedAvatarFilePath(userId);
    if (!cachedPath) return uri;

    await FileSystem.copyAsync({
      from: uri,
      to: cachedPath,
    });

    return cachedPath;
  } catch (error) {
    Logger.error('Failed to cache avatar file', error);
    throw new Error('Failed to cache avatar file');
  }
}

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
    Logger.error('Failed to check cached avatar', error);
    return null;
  }
}

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
    Logger.error('Failed to clear cached avatar', error);
  }
}

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
