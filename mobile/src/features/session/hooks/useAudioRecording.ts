import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

import { createLogger } from '@/services/logging';
import { announce } from '@/utils/a11y';

const logger = createLogger('useAudioRecording');

/**
 * Speech recognition optimized recording options.
 * Uses WAV/PCM at 16kHz mono for best compatibility with speech APIs.
 */
const SPEECH_RECOGNITION_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MIN,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 128000,
  },
};

/** Check if running on iOS Simulator */
function checkIsIOSSimulator(): boolean {
  return (
    Platform.OS === 'ios' &&
    (Constants?.deviceName?.includes('Simulator') ||
      Constants?.executionEnvironment === 'storeClient')
  );
}

/** Optional file size check - fails gracefully if native module unavailable */
async function getFileSize(uri: string): Promise<number | null> {
  try {
    if (typeof FileSystem.getInfoAsync !== 'function') return null;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
      return fileInfo.size;
    }
    return null;
  } catch {
    return null;
  }
}

export type UseAudioRecordingOptions = {
  /** Use speech recognition optimized settings (16kHz WAV). Default: true */
  useSpeechRecognitionSettings?: boolean;
  /** Callback when recording stops successfully */
  onRecordingComplete?: (uri: string) => void;
};

/**
 * Hook for managing audio recording in listening cards.
 * Supports speech recognition optimized settings for pronunciation assessment.
 */
export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const { useSpeechRecognitionSettings = true, onRecordingComplete } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const playbackSoundRef = useRef<Audio.Sound | null>(null);
  const isIOSSimulator = checkIsIOSSimulator();

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setRecordingError(null);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setRecordingError('Microphone permission is required to record audio.');
        return;
      }

      // Warn if on iOS Simulator
      if (isIOSSimulator) {
        logger.warn('Running on iOS Simulator - microphone input may not work properly');
      }

      // Cleanup any existing recording
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore cleanup errors
        }
        recordingRef.current = null;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Small delay to ensure audio session is fully activated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create recording with appropriate options
      const recordingOptions = useSpeechRecognitionSettings
        ? SPEECH_RECOGNITION_OPTIONS
        : Audio.RecordingOptionsPresets.HIGH_QUALITY;

      const { recording } = await Audio.Recording.createAsync(
        recordingOptions,
        undefined,
        1000,
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setHasRecorded(false);
      setRecordedAudioUri(null);
      setRecordingDuration(null);
      announce('Recording started');
      logger.info('Recording started successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to start recording', err);

      let errorMessage = 'Failed to start recording. Please try again.';
      if (err.message.includes('background')) {
        errorMessage = 'Please ensure the app is in the foreground and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setRecordingError(errorMessage);
      setIsRecording(false);

      // Cleanup on error
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore cleanup errors
        }
        recordingRef.current = null;
      }

      // Reset audio mode on error
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });
      } catch {
        // Ignore audio mode reset errors
      }
    }
  }, [isIOSSimulator, useSpeechRecognitionSettings]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!recordingRef.current) {
      setIsRecording(false);
      return;
    }

    try {
      // Get status before stopping
      const status = await recordingRef.current.getStatusAsync();
      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      if (!uri) {
        setRecordingError('Failed to save recording.');
        setIsRecording(false);
        return;
      }

      // Get recording duration if available
      const duration = status.durationMillis ? status.durationMillis / 1000 : null;
      setRecordingDuration(duration);

      // Get file size to verify recording captured data
      const fileSize = await getFileSize(uri);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      logger.info('Recording saved', {
        uri,
        duration: duration ? `${duration.toFixed(1)}s` : 'unknown',
        fileSize: fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'unknown',
        isIOSSimulator,
      });

      // Warn if on iOS Simulator and file size is suspiciously small
      if (isIOSSimulator && fileSize !== null && fileSize < 1000) {
        logger.warn('iOS Simulator detected: Recording may not work properly', { fileSize });
      }

      setRecordedAudioUri(uri);
      setHasRecorded(true);
      setIsRecording(false);
      setRecordingError(null);
      recordingRef.current = null;
      announce('Recording stopped');

      // Call completion callback
      onRecordingComplete?.(uri);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to stop recording', err);
      setRecordingError(err.message || 'Failed to stop recording.');
      setIsRecording(false);

      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch((cleanupErr) => {
          const cleanupError =
            cleanupErr instanceof Error ? cleanupErr : new Error(String(cleanupErr));
          logger.error('Failed to stop recording on cleanup', cleanupError);
        });
        recordingRef.current = null;
      }
    }
  }, [isIOSSimulator, onRecordingComplete]);

  const playRecording = useCallback(async (uri?: string): Promise<void> => {
    const audioUri = uri ?? recordedAudioUri;
    if (!audioUri || isPlayingRecording) return;

    try {
      setIsPlayingRecording(true);
      setRecordingError(null);
      announce('Playing your recording');

      // Unload any existing sound
      if (playbackSoundRef.current) {
        await playbackSoundRef.current.unloadAsync();
        playbackSoundRef.current = null;
      }

      logger.info('Attempting to play recording', { uri: audioUri });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
      );

      playbackSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            const playbackError =
              typeof status.error === 'string' ? new Error(status.error) : (status.error as Error);
            logger.error('Playback error', playbackError);
            setIsPlayingRecording(false);
            setRecordingError('Failed to play recording. The file may be empty or corrupted.');
            sound.unloadAsync().catch((err) =>
              logger.error('Failed to unload sound on playback error', err as Error),
            );
            playbackSoundRef.current = null;
          }
          return;
        }

        if (status.didJustFinish) {
          logger.info('Playback finished');
          announce('Playback finished');
          setIsPlayingRecording(false);
          sound.unloadAsync().catch((err) =>
            logger.error('Failed to unload sound after playback', err as Error),
          );
          playbackSoundRef.current = null;
        }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to play recording', err);
      setIsPlayingRecording(false);
      const errorMsg = err.message || 'Failed to play back recording.';
      setRecordingError(errorMsg);

      if (isIOSSimulator) {
        setRecordingError(
          "iOS Simulator doesn't support audio recording. Please test on a real device.",
        );
      }
    }
  }, [isIOSSimulator, isPlayingRecording, recordedAudioUri]);

  const reset = useCallback(() => {
    setHasRecorded(false);
    setRecordedAudioUri(null);
    setRecordingError(null);
    setIsRecording(false);
    setRecordingDuration(null);
    setIsPlayingRecording(false);
  }, []);

  const cleanup = useCallback(async (): Promise<void> => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to stop recording on cleanup', error);
      }
      recordingRef.current = null;
    }

    if (playbackSoundRef.current) {
      try {
        await playbackSoundRef.current.unloadAsync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to unload playback sound on cleanup', error);
      }
      playbackSoundRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    isRecording,
    hasRecorded,
    recordedAudioUri,
    recordingError,
    isPlayingRecording,
    recordingDuration,
    isIOSSimulator,

    // Actions
    startRecording,
    stopRecording,
    playRecording,
    reset,
    cleanup,
    setRecordingError,
  };
}
