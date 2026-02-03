import { createLogger } from '@/services/logging';

const Logger = createLogger('SpeechRecognition');

let FileSystemModule: typeof import('expo-file-system') | null = null;
let FileSystemAvailable: boolean | null = null;

async function getFileSystemModule(): Promise<typeof import('expo-file-system') | null> {
  if (FileSystemAvailable === false) {
    return null;
  }

  if (!FileSystemModule) {
    try {
      FileSystemModule = await import('expo-file-system');
      FileSystemAvailable = true;
      return FileSystemModule;
    } catch (error) {
      Logger.warn('expo-file-system native module not available, using fetch fallback', { error });
      FileSystemAvailable = false;
      return null;
    }
  }
  return FileSystemModule;
}

function encodeBase64(bytes: Uint8Array): string {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += base64Chars.charAt((bitmap >> 18) & 63);
    result += base64Chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < bytes.length ? base64Chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

async function readFileAsBase64WithFetch(uri: string): Promise<string> {
  const response = await fetch(uri);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  try {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    if (error instanceof ReferenceError || (error as Error).message?.includes('btoa')) {
      return encodeBase64(bytes);
    }
    throw error;
  }
}

export async function getAudioFile(uri: string | null): Promise<{ uri: string; base64?: string } | null> {
  if (!uri) {
    return null;
  }

  try {
    const FileSystem = await getFileSystemModule();
    if (FileSystem) {
      // Use string 'base64' so we don't rely on EncodingType being present after dynamic import
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      return {
        uri,
        base64,
      };
    }
  } catch (error) {
    Logger.warn('expo-file-system read failed, trying fetch fallback', { error });
  }

  try {
    const base64 = await readFileAsBase64WithFetch(uri);
    return {
      uri,
      base64,
    };
  } catch (error) {
    Logger.error('Failed to read audio file with both methods', error);
    return { uri };
  }
}

