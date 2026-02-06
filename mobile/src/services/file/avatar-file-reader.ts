import { Platform } from 'react-native';
import { getFileSystemModule } from '@/services/utils/file-system-loader';

/**
 * AvatarFileReader
 *
 * Handles reading avatar files from the file system.
 * Follows Single Responsibility Principle - focused only on file reading.
 */

/**
 * Result from reading an avatar file.
 */
export interface AvatarFileReadResult {
  bytes: Uint8Array;
  extension: string;
}

/**
 * Read an avatar file from a URI and return its bytes.
 *
 * @param imageUri - URI of the image file
 * @returns The file bytes and extension
 */
export async function readAvatarAsBytes(
  imageUri: string,
): Promise<AvatarFileReadResult> {
  const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const FileSystem = await getFileSystemModule();

  let bytes: Uint8Array;

  if (FileSystem) {
    bytes = await readWithFileSystem(FileSystem, imageUri);
  } else if (Platform.OS === 'web') {
    bytes = await readWithFetch(imageUri);
  } else {
    throw new Error(
      'File system is not available. Please rebuild the app (expo run:ios / expo run:android).',
    );
  }

  return { bytes, extension };
}

/**
 * Read file using Expo FileSystem.
 */
async function readWithFileSystem(
  FileSystem: any,
  imageUri: string,
): Promise<Uint8Array> {
  const fileInfo = await FileSystem.getInfoAsync(imageUri);
  if (!fileInfo.exists) {
    throw new Error('Image file not found');
  }

  const base64Data = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64ToBytes(base64Data);
}

/**
 * Read file using fetch (for web platform).
 */
async function readWithFetch(imageUri: string): Promise<Uint8Array> {
  const resp = await fetch(imageUri);
  if (!resp.ok) {
    throw new Error(`Failed to read image for upload (HTTP ${resp.status})`);
  }
  const ab = await resp.arrayBuffer();
  return new Uint8Array(ab);
}

/**
 * Convert base64 string to Uint8Array.
 */
function base64ToBytes(base64Data: string): Uint8Array {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const cleanBase64 = base64Data.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  let output = '';
  let i = 0;

  while (i < cleanBase64.length) {
    const enc1 = chars.indexOf(cleanBase64.charAt(i++));
    const enc2 = chars.indexOf(cleanBase64.charAt(i++));
    const enc3 = chars.indexOf(cleanBase64.charAt(i++));
    const enc4 = chars.indexOf(cleanBase64.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  const bytes = new Uint8Array(output.length);
  for (let j = 0; j < output.length; j++) {
    bytes[j] = output.charCodeAt(j);
  }

  return bytes;
}
