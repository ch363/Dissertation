// Lazy import to avoid crashing if native module isn't available
let AudioModule: typeof import('expo-av') | null = null;
let FileSystemModule: typeof import('expo-file-system') | null = null;
let recording: any = null;

async function getAudioModule() {
  if (!AudioModule) {
    try {
      AudioModule = await import('expo-av');
    } catch (error) {
      console.error('Failed to load expo-av module:', error);
      throw new Error('Audio recording is not available. Please rebuild the app after installing expo-av.');
    }
  }
  return AudioModule;
}

async function getFileSystemModule() {
  if (!FileSystemModule) {
    try {
      FileSystemModule = await import('expo-file-system');
    } catch (error) {
      console.error('Failed to load expo-file-system module:', error);
      throw new Error('File system is not available. Please rebuild the app after installing expo-file-system.');
    }
  }
  return FileSystemModule;
}

/**
 * Request microphone permissions
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const Audio = await getAudioModule();
    const { status } = await Audio.Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const Audio = await getAudioModule();
    const { status } = await Audio.Audio.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
}

/**
 * Start audio recording
 * @returns Recording URI if successful, null otherwise
 */
export async function startRecording(): Promise<string | null> {
  try {
    const Audio = await getAudioModule();
    
    // Check permissions
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }
    }

    // Configure audio mode for recording
    await Audio.Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create and start recording
    const { recording: newRecording } = await Audio.Audio.Recording.createAsync(
      Audio.Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );

    recording = newRecording;
    return recording.getURI();
  } catch (error) {
    console.error('Failed to start recording:', error);
    return null;
  }
}

/**
 * Stop audio recording
 * @returns Recording URI if successful, null otherwise
 */
export async function stopRecording(): Promise<string | null> {
  try {
    if (!recording) {
      console.warn('No active recording to stop');
      return null;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Reset audio mode
    const Audio = await getAudioModule();
    await Audio.Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });

    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    return null;
  }
}

/**
 * Get audio file as base64 or file URI for upload
 * @param uri Recording URI
 * @returns Base64 string or file URI
 */
export async function getAudioFile(uri: string | null): Promise<{ uri: string; base64?: string } | null> {
  if (!uri) {
    return null;
  }

  try {
    const FileSystem = await getFileSystemModule();
    // Read file as base64 for upload
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      uri,
      base64,
    };
  } catch (error) {
    console.error('Failed to read audio file:', error);
    return { uri }; // Return URI as fallback
  }
}

/**
 * Clean up recording resources
 */
export async function cleanup(): Promise<void> {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }
    const Audio = await getAudioModule();
    await Audio.Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });
  } catch (error) {
    console.error('Error cleaning up recording:', error);
  }
}
