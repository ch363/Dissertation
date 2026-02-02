import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Animated, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { ListeningCard as ListeningCardType, PronunciationResult } from '@/types/session';
import * as SpeechRecognition from '@/services/speech-recognition';
import { announce } from '@/utils/a11y';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createLogger } from '@/services/logging';

const logger = createLogger('ListeningCard');

// Lazy load FileSystem to avoid native module errors
// This is completely optional - if FileSystem isn't available, we just skip file size checking
async function getFileSize(uri: string): Promise<number | null> {
  // Completely optional feature - if FileSystem native module isn't linked,
  // we just return null and don't show file size. This shouldn't break the app.
  try {
    // Use dynamic import with explicit error handling
    let FileSystemModule: typeof import('expo-file-system') | null = null;
    
    try {
      FileSystemModule = await import('expo-file-system');
    } catch (importError) {
      // Native module not available - this is fine, file size is optional
      return null;
    }
    
    if (!FileSystemModule || typeof FileSystemModule.getInfoAsync !== 'function') {
      return null;
    }
    
    const fileInfo = await FileSystemModule.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
      return fileInfo.size;
    }
    return null;
  } catch (error) {
    // Silently fail - file size checking is optional
    return null;
  }
}

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  pronunciationResult?: PronunciationResult | null;
};

export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
  onCheckAnswer,
  onContinue,
  pronunciationResult,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(null);
  const [recordingFileSize, setRecordingFileSize] = useState<number | null>(null);
  const playbackSoundRef = useRef<Audio.Sound | null>(null);
  const mode = card.mode || 'type'; // 'type' or 'speak'
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const reduceMotion = useReducedMotion();
  
  // Check if running on iOS Simulator
  const isIOSSimulator = Platform.OS === 'ios' && 
    (Constants?.deviceName?.includes('Simulator') || 
     Constants?.executionEnvironment === 'storeClient');

  // Animation for recording button
  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.setValue(1);
      return;
    }
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim, reduceMotion]);

  useEffect(() => {
    if (recordingError) announce(recordingError);
  }, [recordingError]);

  const handlePlayAudio = async () => {
    // Prevent multiple rapid calls
    if (isPlaying) {
      return;
    }
    
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Small delay to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // For "Type What You Hear", speak the expected answer
      // For "Speak This Phrase", speak the phrase to practice
      const textToSpeak = card.expected || card.audioUrl || '';
      if (!textToSpeak) {
        setIsPlaying(false);
        return;
      }
      
      await SafeSpeech.speak(textToSpeak, { language: 'it-IT', rate });
      
      // Reset playing state after estimated duration
      const estimatedDuration = Math.max(2000, textToSpeak.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      logger.error('Failed to play audio', error as Error);
      announce('Failed to play audio.');
      setIsPlaying(false);
    }
  };

  const handlePlayWordAudio = async (word: string) => {
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
      await SafeSpeech.speak(word, { language: 'it-IT', rate });
    } catch (error) {
      logger.error('Failed to play word audio', error as Error);
      announce('Failed to play word audio.');
    }
  };

  // Cleanup recording and playback on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch((err) => logger.error('Failed to stop recording on cleanup', err as Error));
        recordingRef.current = null;
      }
      if (playbackSoundRef.current) {
        playbackSoundRef.current.unloadAsync().catch((err) => logger.error('Failed to unload playback sound on cleanup', err as Error));
        playbackSoundRef.current = null;
      }
    };
  }, []);

  // Reset recording state when card changes
  useEffect(() => {
    setHasRecorded(false);
    setRecordedAudioUri(null);
    setRecordingError(null);
    setIsRecording(false);
    setRecordingDuration(null);
    setIsPlayingRecording(false);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch((err) => logger.error('Failed to stop recording on card change', err as Error));
      recordingRef.current = null;
    }
    if (playbackSoundRef.current) {
      playbackSoundRef.current.unloadAsync().catch((err) => logger.error('Failed to unload playback sound on card change', err as Error));
      playbackSoundRef.current = null;
    }
  }, [card.id]);

  const handleStartRecording = async () => {
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
        logger.warn('To enable: System Settings → Privacy → Microphone → Allow Xcode/Simulator');
        logger.warn('Simulator menu: I/O → Audio Input → Select "Built-in Microphone"');
      }

      // First, ensure any existing recording is cleaned up
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        recordingRef.current = null;
      }

      // Configure audio mode for recording BEFORE creating the recording
      // This must be done first to activate the audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Small delay to ensure audio session is fully activated
      // This is critical to avoid the "background" error
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a new recording optimized for speech recognition.
      // Use WAV/PCM with 16kHz sample rate for best compatibility.
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT, // WAV format
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 16000, // common speech recognition sample rate
            numberOfChannels: 1, // Mono for speech recognition
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM, // WAV/PCM format
            audioQuality: Audio.IOSAudioQuality.MIN, // Lower quality is fine for speech
            sampleRate: 16000, // common speech recognition sample rate
            numberOfChannels: 1, // Mono for speech recognition
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/wav',
            bitsPerSecond: 128000,
          },
        },
        undefined, // onRecordingStatusUpdate callback (optional)
        1000 // progressUpdateIntervalMillis
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setHasRecorded(false);
      setRecordedAudioUri(null);
      announce('Recording started');
      logger.info('Recording started successfully');
    } catch (error: any) {
      logger.error('Failed to start recording', error as Error);
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to start recording. Please try again.';
      if (error?.message?.includes('background')) {
        errorMessage = 'Please ensure the app is in the foreground and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setRecordingError(errorMessage);
      setIsRecording(false);
      
      // Clean up on error
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
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
      } catch (e) {
        // Ignore audio mode reset errors
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!recordingRef.current) {
        setIsRecording(false);
        return;
      }

      // Stop and unload the recording
      const status = await recordingRef.current.getStatusAsync();
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get the URI
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        setRecordingError('Failed to save recording.');
        setIsRecording(false);
        return;
      }

      // Get recording duration if available
      const duration = status.durationMillis ? status.durationMillis / 1000 : null;
      setRecordingDuration(duration);

      // Try to get file size to verify recording actually captured data
      // This is optional - if FileSystem module isn't available, we just skip it
      const fileSize = await getFileSize(uri);

      setRecordingFileSize(fileSize);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      logger.info('Recording saved', { 
        uri, 
        duration: duration ? `${duration.toFixed(1)}s` : 'unknown',
        fileSize: fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'unknown',
        isIOSSimulator
      });

      // Warn if on iOS Simulator and file size is suspiciously small
      if (isIOSSimulator && fileSize !== null && fileSize < 1000) {
        logger.warn('iOS Simulator detected: Recording may not work properly. File size is very small', { fileSize });
      }

      setRecordedAudioUri(uri);
      setHasRecorded(true);
      setIsRecording(false);
      setRecordingError(null); // Clear any previous errors on success
      recordingRef.current = null;
      announce('Recording stopped');
    } catch (error: any) {
      logger.error('Failed to stop recording', error as Error);
      setRecordingError(error?.message || 'Failed to stop recording.');
      setIsRecording(false);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch((err) => logger.error('Failed to stop recording on cleanup', err as Error));
        recordingRef.current = null;
      }
    }
  };

  const handleRecordButtonPress = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handlePlayRecording = async () => {
    if (!recordedAudioUri || isPlayingRecording) {
      return;
    }

    try {
      setIsPlayingRecording(true);
      setRecordingError(null);
      announce('Playing your recording');
      
      // Unload any existing sound
      if (playbackSoundRef.current) {
        await playbackSoundRef.current.unloadAsync();
        playbackSoundRef.current = null;
      }

      logger.info('Attempting to play recording', { recordedAudioUri });

      // Load and play the recording
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );
      
      playbackSoundRef.current = sound;

      // Wait for playback to finish
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          // Handle error status
          if ('error' in status && status.error) {
            const playbackError = typeof status.error === 'string' ? new Error(status.error) : (status.error as Error);
            logger.error('Playback error', playbackError);
            setIsPlayingRecording(false);
            setRecordingError('Failed to play recording. The file may be empty or corrupted.');
            sound.unloadAsync().catch((err) => logger.error('Failed to unload sound on playback error', err as Error));
            playbackSoundRef.current = null;
          }
          return;
        }
        
        // Handle success status
        if (status.didJustFinish) {
          logger.info('Playback finished');
          announce('Playback finished');
          setIsPlayingRecording(false);
          sound.unloadAsync().catch((err) => logger.error('Failed to unload sound after playback', err as Error));
          playbackSoundRef.current = null;
        }
      });
    } catch (error: any) {
      logger.error('Failed to play recording', error as Error);
      setIsPlayingRecording(false);
      const errorMsg = error?.message || 'Failed to play back recording.';
      setRecordingError(errorMsg);
      
      // If on iOS Simulator, provide helpful message
      if (isIOSSimulator) {
        setRecordingError('iOS Simulator doesn\'t support audio recording. Please test on a real device.');
      }
    }
  };

  // Reset processing state when result is shown
  useEffect(() => {
    if (showResult) {
      setIsProcessing(false);
    }
  }, [showResult]);


  if (mode === 'speak') {
    // Speech Practice Mode (P22/P23)
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>SPEAK THIS PHRASE</Text>

        {!showResult ? (
          // Practice Screen (P22)
          <>
            <View style={styles.phraseCard}>
              <View style={styles.phraseRow}>
                <IconButton
                  accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                  accessibilityHint="Plays the phrase audio"
                  onPress={handlePlayAudio}
                  style={styles.audioButton}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={24}
                    color="#fff"
                  />
                </IconButton>
                <View style={styles.phraseTextContainer}>
                  <Text style={styles.phraseText}>{card.expected}</Text>
                  <Text style={styles.phraseTranslation}>
                    {card.translation ? `(${card.translation})` : '(Translation)'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.recordingSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
                  accessibilityHint="Records your pronunciation"
                  accessibilityState={{ selected: isRecording, disabled: isProcessing, busy: isProcessing }}
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={handleRecordButtonPress}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <Ionicons name="mic" size={48} color="#fff" accessible={false} importantForAccessibility="no" />
                  )}
                </Pressable>
              </Animated.View>
              <Text style={styles.recordHint}>
                {isRecording ? 'Recording...' : 'Tap to record your pronunciation'}
              </Text>
              {isIOSSimulator && (
                <View style={styles.simulatorWarning}>
                  <Text style={styles.warningText}>
                    ⚠️ iOS Simulator: Microphone may not work
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Try: System Settings → Privacy → Microphone → Allow Xcode
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Or: Simulator menu → I/O → Audio Input → Built-in Microphone
                  </Text>
                </View>
              )}
              {recordingError && (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {recordingError}
                </Text>
              )}
              {recordingDuration !== null && (
                <Text style={styles.durationText}>
                  Recorded: {recordingDuration.toFixed(1)}s
                  {recordingFileSize !== null && ` • ${(recordingFileSize / 1024).toFixed(1)} KB`}
                </Text>
              )}
              {recordingFileSize !== null && recordingFileSize < 1000 && (
                <Text style={styles.warningText}>
                  ⚠️ File size is very small. Recording may be empty.
                </Text>
              )}
            </View>

            {hasRecorded && !isProcessing && (
              <>
                <View style={styles.playbackSection}>
                  <Pressable
                    style={styles.playbackButton}
                    onPress={handlePlayRecording}
                    disabled={isPlayingRecording}
                    accessibilityRole="button"
                    accessibilityLabel={isPlayingRecording ? 'Playing recording' : 'Play recording'}
                    accessibilityHint="Plays back what you recorded"
                    accessibilityState={{ disabled: isPlayingRecording, busy: isPlayingRecording }}
                  >
                    <Ionicons
                      name={isPlayingRecording ? 'pause' : 'play'}
                      size={24}
                      color="#fff"
                      accessible={false}
                      importantForAccessibility="no"
                    />
                    <Text style={styles.playbackButtonText}>
                      {isPlayingRecording ? 'Playing...' : 'Play Recording'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            <Button
              title={hasRecorded ? 'Continue' : 'Record to continue'}
              variant="secondary"
              disabled={!hasRecorded || isProcessing}
              onPress={() => {
                if (!hasRecorded || isProcessing) return;
                if (!recordedAudioUri || !onCheckAnswer) return;
                setIsProcessing(true);
                onCheckAnswer(recordedAudioUri);
              }}
              style={styles.ctaButton}
            />
          </>
        ) : (
          // Result Screen (P23)
          <>
            <View style={styles.phraseCard}>
              <View style={styles.phraseRow}>
                <IconButton
                  accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                  accessibilityHint="Plays the phrase audio"
                  onPress={handlePlayAudio}
                  style={styles.audioButton}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={24}
                    color="#fff"
                  />
                </IconButton>
                <View style={styles.phraseTextContainer}>
                  <Text style={styles.phraseText}>{card.expected}</Text>
                  <Text style={styles.phraseTranslation}>
                    {card.translation ? `(${card.translation})` : '(Translation)'}
                  </Text>
                </View>
              </View>
            </View>

            {pronunciationResult && (
              <>
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>PRONUNCIATION RESULT</Text>
                  <Text style={styles.score}>{pronunciationResult.overallScore}%</Text>
                  <Text style={styles.scoreLabel}>Pronunciation Score</Text>
                </View>

                <View style={styles.analysisCard}>
                  <Text style={styles.analysisTitle}>WORD-BY-WORD ANALYSIS</Text>
                  <View style={styles.wordAnalysis}>
                    {pronunciationResult.words.map((word, index) => (
                      <View key={index} style={styles.wordItem}>
                        <Ionicons
                          name={word.feedback === 'perfect' ? 'checkmark-circle' : 'alert-circle'}
                          size={20}
                          color={word.feedback === 'perfect' ? '#28a745' : '#ff9800'}
                          accessible={false}
                          importantForAccessibility="no"
                        />
                        <Text style={styles.wordText}>{word.word}</Text>
                        <Text
                          style={[
                            styles.wordFeedback,
                            word.feedback === 'could_improve' && styles.wordFeedbackOrange,
                          ]}
                        >
                          {word.feedback === 'perfect' ? 'Perfect' : 'Could improve'}
                        </Text>
                        {word.feedback === 'could_improve' && (
                          <IconButton
                            accessibilityLabel={`Play audio for ${word.word}`}
                            accessibilityHint="Plays this word"
                            onPress={() => handlePlayWordAudio(word.word)}
                            style={styles.wordAudioButton}
                          >
                            <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
                          </IconButton>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Button
              title="Continue"
              variant="secondary"
              disabled={!onContinue}
              onPress={() => onContinue?.()}
              style={styles.ctaButton}
            />
          </>
        )}
      </View>
    );
  }

  // Type What You Hear Mode (P28/P29)
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>TYPE WHAT YOU HEAR</Text>

      {!showResult ? (
        // Input Screen
        <>
          <View style={styles.audioCard}>
            <IconButton
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
              accessibilityHint="Plays the phrase audio"
              onPress={handlePlayAudio}
              style={styles.audioButtonLarge}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={40}
                color="#fff"
              />
            </IconButton>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>YOUR ANSWER:</Text>
            <TextInput
              style={styles.textInput}
              value={userAnswer}
              onChangeText={onAnswerChange}
              placeholder="Type here..."
              autoFocus
              editable={!showResult}
              accessibilityLabel="Your answer"
            />
          </View>
          {!showResult && userAnswer.trim().length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Check answer"
              onPress={() => onCheckAnswer?.()}
              style={styles.checkButton}
            >
              <Text style={styles.checkButtonText}>Check Answer</Text>
            </Pressable>
          )}
        </>
      ) : (
        // Result Screen
        <>
          <View style={styles.audioCard}>
            <Pressable style={styles.audioButtonLarge} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={40}
                color="#fff"
              />
            </Pressable>
          </View>

          <View style={[styles.resultCard, isCorrect ? styles.resultCardCorrect : styles.resultCardWrong]}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={isCorrect ? '#28a745' : '#dc3545'}
            />
            <Text style={styles.resultTitle}>{isCorrect ? 'CORRECT!' : 'INCORRECT'}</Text>
            <View style={styles.answerComparison}>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Your answer</Text>
                <Text style={styles.answerValue}>{userAnswer.trim() || '(empty)'}</Text>
              </View>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct answer</Text>
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{card.expected}</Text>
                  <Pressable
                    onPress={handlePlayAudio}
                    style={styles.resultAudioButton}
                  >
                    <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {isCorrect && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>MEANING</Text>
              <Text style={styles.infoText}>Good morning</Text>
              <View style={styles.alsoCorrectSection}>
                <Text style={styles.infoLabel}>ALSO CORRECT</Text>
                <View style={styles.alsoCorrectTag}>
                  <Text style={styles.alsoCorrectText}>Buon giorno</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    gap: theme.spacing.md,
    alignItems: 'stretch',
  },
  instruction: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: theme.colors.link,
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  phraseCard: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  phraseTextContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  phraseText: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  phraseTranslation: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.mutedText,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#c82333',
  },
  recordHint: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  simulatorWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  warningSubtext: {
    fontFamily: theme.typography.regular,
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
  ctaButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  audioCard: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  inputCard: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 18,
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
    minHeight: 50,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultCardCorrect: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  resultCardWrong: {
    backgroundColor: '#f8d7da',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  resultTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 18,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  answerComparison: {
    width: '100%',
    gap: theme.spacing.md,
  },
  answerRow: {
    gap: theme.spacing.xs,
  },
  answerLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  answerText: {
    fontFamily: theme.typography.bold,
    fontSize: 20,
    color: theme.colors.text,
    flexShrink: 1,
  },
  resultAudioButton: {
    padding: theme.spacing.xs,
  },
  score: {
    fontFamily: theme.typography.bold,
    fontSize: 40,
    color: theme.colors.secondary,
  },
  scoreLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  analysisCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analysisTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
  },
  wordAnalysis: {
    gap: theme.spacing.sm,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  wordText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  wordFeedback: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.success,
  },
  wordFeedbackOrange: {
    color: '#ff9800',
  },
  wordAudioButton: {
    padding: theme.spacing.xs,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  alsoCorrectSection: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  alsoCorrectTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  alsoCorrectText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  checkButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  durationText: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  playbackSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
  },
  playbackButtonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 14,
  },
});
