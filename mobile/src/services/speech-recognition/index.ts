// Lazy import to avoid crashing if native module isn't available
let FileSystemModule: typeof import('expo-file-system') | null = null;
let FileSystemAvailable: boolean | null = null;

async function getFileSystemModule(): Promise<typeof import('expo-file-system') | null> {
  // Check if we've already determined availability
  if (FileSystemAvailable === false) {
    return null;
  }

  if (!FileSystemModule) {
    try {
      FileSystemModule = await import('expo-file-system');
      FileSystemAvailable = true;
      return FileSystemModule;
    } catch (error) {
      console.warn('expo-file-system native module not available, using fetch fallback:', error);
      FileSystemAvailable = false;
      return null;
    }
  }
  return FileSystemModule;
}

/**
 * Manual base64 encoding for environments where btoa is not available
 */
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

/**
 * Fallback method to read file as base64 using fetch API
 * Works when expo-file-system native module is not available
 * Compatible with React Native
 */
async function readFileAsBase64WithFetch(uri: string): Promise<string> {
  // Fetch the file URI
  const response = await fetch(uri);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }

  // Get the response as array buffer (works in React Native)
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Try to use btoa if available (web environments)
  try {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    // If btoa is not available (React Native), use manual encoding
    if (error instanceof ReferenceError || (error as Error).message?.includes('btoa')) {
      return encodeBase64(bytes);
    }
    throw error;
  }
}

/**
 * Get audio file as base64 or file URI for upload
 * Tries expo-file-system first, falls back to fetch API if native module is unavailable
 * @param uri Recording URI
 * @returns Base64 string or file URI
 */
export async function getAudioFile(uri: string | null): Promise<{ uri: string; base64?: string } | null> {
  if (!uri) {
    return null;
  }

  // Try expo-file-system first (preferred method)
  try {
    const FileSystem = await getFileSystemModule();
    if (FileSystem) {
      // Read file as base64 for upload
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        uri,
        base64,
      };
    }
  } catch (error) {
    console.warn('expo-file-system read failed, trying fetch fallback:', error);
  }

  // Fallback to fetch API if expo-file-system is unavailable or fails
  try {
    const base64 = await readFileAsBase64WithFetch(uri);
    return {
      uri,
      base64,
    };
  } catch (error) {
    console.error('Failed to read audio file with both methods:', error);
    // Return URI only as last resort
    return { uri };
  }
}

