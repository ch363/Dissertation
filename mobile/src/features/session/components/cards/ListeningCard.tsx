import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Animated, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

import { SpeakerButton } from '@/components/ui';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import {
  ListeningCard as ListeningCardType,
  PronunciationResult,
  PronunciationWordResult,
  PronunciationErrorType,
} from '@/types/session';
import { announce } from '@/utils/a11y';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createLogger } from '@/services/logging';

const logger = createLogger('ListeningCard');

const ERROR_TYPE_TIPS: Record<Exclude<PronunciationErrorType, 'None'>, string> = {
  Omission: 'You skipped this word. Try saying it in the phrase.',
  Insertion: 'Extra word detected. Stick to the phrase and try again.',
  Mispronunciation: 'This word was mispronounced. Listen to the model and try again.',
  UnexpectedBreak: 'Pause was in an unexpected place. Try saying the phrase more smoothly.',
  MissingBreak: 'Try pausing slightly where it feels natural (e.g. between clauses).',
};

function getTipForWord(word: PronunciationWordResult): string {
  if (word.errorType && word.errorType !== 'None' && ERROR_TYPE_TIPS[word.errorType]) {
    const tip = ERROR_TYPE_TIPS[word.errorType];
    const weakPhonemes =
      word.phonemes?.filter((p) => p.accuracy < 80).map((p) => p.phoneme);
    if (weakPhonemes && weakPhonemes.length > 0) {
      return `${tip} Focus on these sounds: ${weakPhonemes.join(', ')}.`;
    }
    return tip;
  }
  if (word.phonemes?.some((p) => p.accuracy < 80)) {
    const weak = word.phonemes.filter((p) => p.accuracy < 80).map((p) => p.phoneme);
    return `Focus on these sounds: ${weak.join(', ')}. Listen to the model and try again.`;
  }
  // No error type or phoneme detail from Azure — use word and score so it's not generic
  const scorePart = typeof word.score === 'number' ? `"${word.word}" scored ${word.score}%. ` : '';
  return `${scorePart}Listen to the model and try to match the stress and sounds.`;
}

// Optional file size check - fails gracefully if native module unavailable.
// Static import avoids Metro "unknown module" errors from dynamic import().
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

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  pronunciationResult?: PronunciationResult | null;
  isPronunciationProcessing?: boolean;
  onPracticeAgain?: () => void;
};

export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
  grammaticalCorrectness,
  onCheckAnswer,
  onContinue,
  pronunciationResult,
  isPronunciationProcessing = false,
  onPracticeAgain,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [_recordingDuration, setRecordingDuration] = useState<number | null>(null);
  const [_recordingFileSize, setRecordingFileSize] = useState<number | null>(null);
  const [expandedWordIndex, setExpandedWordIndex] = useState<number | null>(null);
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

  useEffect(() => {
    setExpandedWordIndex(null);
  }, [pronunciationResult]);

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

  const _handlePlayRecording = async () => {
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

    if (mode === 'speak') {
    // ——— Screen 1: Loading (Figma: Analyzing your pronunciation) ———
    if (isPronunciationProcessing) {
      return (
        <View style={styles.pronunciationContainer}>
          <View style={styles.pronunciationLoadingContent}>
            <ActivityIndicator size="large" color="#14B8A6" style={styles.pronunciationSpinner} />
            <Text style={styles.pronunciationLoadingTitle}>Analyzing your pronunciation</Text>
            <Text style={styles.pronunciationLoadingSubtext}>
              Please wait while we process your recording...
            </Text>
            <Text style={styles.pronunciationLoadingTime}>Usually takes ~2 seconds</Text>
            <View style={styles.pronunciationSteps}>
              <View style={styles.pronunciationStepRow}>
                <View style={styles.pronunciationStepDot} />
                <Text style={styles.pronunciationStepText}>Analyzing audio quality</Text>
              </View>
              <View style={styles.pronunciationStepRow}>
                <View style={styles.pronunciationStepDot} />
                <Text style={styles.pronunciationStepText}>Comparing pronunciation</Text>
              </View>
              <View style={styles.pronunciationStepRow}>
                <View style={styles.pronunciationStepDot} />
                <Text style={styles.pronunciationStepText}>Generating feedback</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // ——— Screen 2: Result (Figma: Pronunciation result with score and word analysis) ———
    if (showResult && pronunciationResult) {
      const scoreLabels = [
        { label: 'Poor', min: 0, max: 49 },
        { label: 'Fair', min: 50, max: 69 },
        { label: 'Good', min: 70, max: 79 },
        { label: 'Great', min: 80, max: 89 },
        { label: 'Excellent', min: 90, max: 100 },
      ];
      const scoreLabel = scoreLabels.find(
        (s) => pronunciationResult.overallScore >= s.min && pronunciationResult.overallScore <= s.max
      );
      const firstImproveWord = pronunciationResult.words.find((w) => w.feedback === 'could_improve');

      return (
        <View style={styles.pronunciationContainer}>
          <Text style={styles.pronunciationResultHeading}>PRONUNCIATION RESULT</Text>
          <Text style={styles.pronunciationPhrase}>{card.expected}</Text>
          <Text style={styles.pronunciationTranslation}>
            {card.translation ? `(${card.translation})` : ''}
          </Text>
          <Text style={styles.pronunciationScore}>{pronunciationResult.overallScore}%</Text>
          <Text style={styles.pronunciationScoreLabel}>
            {scoreLabel?.label ?? '—'} ({scoreLabel?.min ?? 0}–{scoreLabel?.max ?? 100})
          </Text>
          <View style={styles.pronunciationBarContainer}>
            <View style={styles.pronunciationBarTrack}>
              <View
                style={[
                  styles.pronunciationBarFill,
                  { width: `${Math.min(100, Math.max(0, pronunciationResult.overallScore))}%` },
                ]}
              />
              <View
                style={[
                  styles.pronunciationBarMarker,
                  { left: `${Math.min(100, Math.max(0, pronunciationResult.overallScore))}%` },
                ]}
              />
            </View>
            <View style={styles.pronunciationBarLabels}>
              <Text style={styles.pronunciationBarLabelText}>Poor</Text>
              <Text style={styles.pronunciationBarLabelText}>Excellent</Text>
            </View>
          </View>
          <Text style={styles.pronunciationAnalysisTitle}>WORD-BY-WORD ANALYSIS</Text>
          <View style={styles.pronunciationWordList}>
            {pronunciationResult.words.map((word, index) => {
              const isExpandable = word.feedback === 'could_improve';
              const isExpanded = expandedWordIndex === index;
              const rowContent = (
                <>
                  <Ionicons
                    name={word.feedback === 'perfect' ? 'checkmark-circle' : 'alert-circle'}
                    size={22}
                    color={word.feedback === 'perfect' ? '#22C55E' : '#F97316'}
                    style={styles.pronunciationWordIcon}
                  />
                  <Text style={styles.pronunciationWordText}>{word.word}</Text>
                  <View style={styles.pronunciationWordBadgeWrap}>
                    <View
                      style={[
                        styles.pronunciationWordBadge,
                        word.feedback === 'perfect' ? styles.pronunciationWordBadgePerfect : styles.pronunciationWordBadgeImprove,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pronunciationWordBadgeText,
                          word.feedback === 'perfect' ? styles.pronunciationWordBadgeTextPerfect : styles.pronunciationWordBadgeTextImprove,
                        ]}
                      >
                        {word.feedback === 'perfect' ? 'Perfect' : 'Could improve'}
                      </Text>
                    </View>
                    {isExpandable && (
                      <View style={styles.pronunciationWordSpeaker} pointerEvents="box-none">
                        <SpeakerButton
                          size={32}
                          onPress={() => handlePlayWordAudio(word.word)}
                          accessibilityLabel={`Play ${word.word}`}
                        />
                      </View>
                    )}
                  </View>
                </>
              );
              return isExpandable ? (
                <Pressable
                  key={index}
                  style={[styles.pronunciationWordRow, isExpanded && styles.pronunciationWordRowExpanded]}
                  onPress={() => setExpandedWordIndex((prev) => (prev === index ? null : index))}
                  accessibilityLabel={`${word.word}, could improve. ${isExpanded ? 'Tap to collapse tip' : 'Tap for tip'}`}
                  accessibilityRole="button"
                >
                  {rowContent}
                </Pressable>
              ) : (
                <View key={index} style={styles.pronunciationWordRow}>
                  {rowContent}
                </View>
              );
            })}
          </View>
          {expandedWordIndex !== null && pronunciationResult.words[expandedWordIndex] && (
            <View style={styles.pronunciationTipPanel}>
              <Ionicons name="bulb" size={18} color="#92400E" style={styles.pronunciationTipPanelIcon} />
              <Text style={styles.pronunciationTipPanelText}>
                {getTipForWord(pronunciationResult.words[expandedWordIndex])}
              </Text>
              <Pressable
                onPress={() => setExpandedWordIndex(null)}
                style={styles.pronunciationTipPanelClose}
                accessibilityLabel="Close tip"
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </Pressable>
            </View>
          )}
          <View style={styles.pronunciationLegend}>
            <View style={styles.pronunciationLegendRow}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" style={styles.pronunciationLegendIcon} />
              <Text style={styles.pronunciationLegendText}>Perfect: Matches reference audio.</Text>
            </View>
            <View style={styles.pronunciationLegendRow}>
              <Ionicons name="alert-circle" size={14} color="#F97316" style={styles.pronunciationLegendIcon} />
              <Text style={styles.pronunciationLegendText}>Could improve: Tap for specific tips.</Text>
            </View>
          </View>
          {firstImproveWord ? (
            <Pressable
              style={styles.pronunciationPracticeAgainButton}
              onPress={() => {
                setHasRecorded(false);
                setRecordedAudioUri(null);
                onPracticeAgain?.();
              }}
              accessibilityLabel={`Practice ${firstImproveWord.word} again`}
            >
              <Ionicons name="refresh" size={20} color="#fff" style={styles.pronunciationPracticeAgainIcon} />
              <Text style={styles.pronunciationPracticeAgainText}>
                Practice "{firstImproveWord.word}" again
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.pronunciationNextButton}
            onPress={onContinue}
            disabled={!onContinue}
            accessibilityLabel="Next question"
          >
            <Text style={styles.pronunciationNextText}>Next Question</Text>
            <Ionicons name="arrow-forward" size={20} color={baseTheme.colors.mutedText} />
          </Pressable>
        </View>
      );
    }

    // ——— Screen 3: Input (Figma: Speak this phrase, record) ———
    return (
      <View style={styles.pronunciationContainer}>
        <Text style={styles.pronunciationInstruction}>Speak this phrase</Text>
        <View style={styles.pronunciationPhraseBlock}>
          <Text style={styles.pronunciationPhrase}>{card.expected}</Text>
          {card.translation ? (
            <Text style={styles.pronunciationTranslation}>({card.translation})</Text>
          ) : null}
        </View>
        <SpeakerButton
          size={64}
          isPlaying={isPlaying}
          onPress={handlePlayAudio}
          accessibilityLabel="Listen to pronunciation"
        />
        <View style={styles.pronunciationTipBox}>
          <Ionicons name="bulb-outline" size={20} color={baseTheme.colors.mutedText} style={styles.pronunciationTipIcon} />
          <Text style={styles.pronunciationTipText}>Find a quiet space for best results</Text>
        </View>
        <View style={styles.pronunciationRecordSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Release to stop recording' : 'Hold to record'}
              accessibilityHint={isRecording ? undefined : 'Press and hold the button while you speak'}
              accessibilityState={{ selected: isRecording, disabled: isPronunciationProcessing }}
              style={[styles.pronunciationRecordButton, isRecording && styles.pronunciationRecordButtonActive]}
              onPressIn={() => {
                if (!isRecording && !isPronunciationProcessing) handleStartRecording();
              }}
              onPressOut={() => {
                if (isRecording) handleStopRecording();
              }}
              disabled={isPronunciationProcessing}
            >
              <Ionicons name="mic" size={44} color="#fff" />
            </Pressable>
          </Animated.View>
          <Text style={styles.pronunciationRecordHint}>Hold to record your pronunciation</Text>
        </View>
        {isIOSSimulator && (
          <View style={styles.simulatorWarning}>
            <Text style={styles.warningText}>⚠️ iOS Simulator: Microphone may not work</Text>
            <Text style={styles.warningSubtext}>Try: System Settings → Privacy → Microphone → Allow Xcode</Text>
          </View>
        )}
        {recordingError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {recordingError}
          </Text>
        ) : null}
        <Pressable
          style={[
            styles.pronunciationFooterButton,
            hasRecorded && styles.pronunciationFooterButtonActive,
          ]}
          onPress={() => {
            if (!hasRecorded || !recordedAudioUri || !onCheckAnswer) return;
            onCheckAnswer(recordedAudioUri);
          }}
          disabled={!hasRecorded}
          accessibilityLabel={hasRecorded ? 'Continue' : 'Record to continue'}
        >
          <Text
            style={[
              styles.pronunciationFooterButtonText,
              hasRecorded && styles.pronunciationFooterButtonTextActive,
            ]}
          >
            {hasRecorded ? 'Continue' : 'Record to continue'}
          </Text>
        </Pressable>
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
            <SpeakerButton
              size={72}
              isPlaying={isPlaying}
              onPress={handlePlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
              accessibilityHint="Plays the phrase audio"
            />
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
            <SpeakerButton
              size={72}
              isPlaying={isPlaying}
              onPress={handlePlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            />
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
                  <SpeakerButton
                    size={36}
                    isPlaying={isPlaying}
                    onPress={handlePlayAudio}
                    accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                  />
                </View>
              </View>
            </View>
            {grammaticalCorrectness != null && (
              <Text style={styles.grammarScore}>
                Grammatical correctness: {grammaticalCorrectness}%
              </Text>
            )}
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
    gap: baseTheme.spacing.md,
    alignItems: 'stretch',
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
    color: baseTheme.colors.link,
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  phraseCard: {
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginVertical: baseTheme.spacing.sm,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  phraseTextContainer: {
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
  },
  phraseText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 28,
    color: baseTheme.colors.text,
    textAlign: 'center',
  },
  phraseTranslation: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    fontStyle: 'italic',
    color: baseTheme.colors.mutedText,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: baseTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    marginVertical: baseTheme.spacing.md,
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
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: baseTheme.spacing.xs,
  },
  simulatorWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: baseTheme.spacing.sm,
    marginTop: baseTheme.spacing.xs,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    marginBottom: baseTheme.spacing.xs,
  },
  warningSubtext: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
  ctaButton: {
    marginTop: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.lg,
  },
  audioCard: {
    alignItems: 'center',
    marginTop: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.sm,
  },
  inputCard: {
    width: '100%',
    gap: baseTheme.spacing.sm,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: baseTheme.colors.primary,
    borderRadius: 12,
    padding: baseTheme.spacing.md,
    fontSize: 18,
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.text,
    minHeight: 50,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
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
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    color: baseTheme.colors.text,
    textTransform: 'uppercase',
  },
  answerComparison: {
    width: '100%',
    gap: baseTheme.spacing.md,
  },
  answerRow: {
    gap: baseTheme.spacing.xs,
  },
  answerLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    color: baseTheme.colors.text,
  },
  grammarScore: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    color: baseTheme.colors.mutedText,
    marginTop: baseTheme.spacing.sm,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  answerText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    color: baseTheme.colors.text,
    flexShrink: 1,
  },
  score: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 40,
    color: baseTheme.colors.secondary,
  },
  scoreLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
  },
  analysisCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analysisTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
  },
  wordAnalysis: {
    gap: baseTheme.spacing.sm,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  wordText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: baseTheme.colors.text,
    flex: 1,
  },
  wordFeedback: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.success,
  },
  wordFeedbackOrange: {
    color: '#ff9800',
  },
  wordAudioButton: {
    padding: baseTheme.spacing.xs,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  infoLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: baseTheme.spacing.xs,
  },
  infoText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.text,
  },
  alsoCorrectSection: {
    marginTop: baseTheme.spacing.sm,
    gap: baseTheme.spacing.xs,
  },
  alsoCorrectTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  alsoCorrectText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.text,
  },
  // Pronunciation assessment (Figma: Input, Loading, Result)
  pronunciationContainer: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  pronunciationInstruction: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    color: baseTheme.colors.link,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: baseTheme.spacing.xl,
  },
  pronunciationPhraseBlock: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
    paddingHorizontal: baseTheme.spacing.md,
  },
  pronunciationPhrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    color: baseTheme.colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: baseTheme.spacing.xs,
  },
  pronunciationTranslation: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
  },
  pronunciationTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: baseTheme.radius.lg,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.lg,
    marginTop: baseTheme.spacing.xl,
    marginBottom: baseTheme.spacing.xl,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  pronunciationTipIcon: {
    marginRight: baseTheme.spacing.sm,
  },
  pronunciationTipText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
    flex: 1,
  },
  pronunciationRecordSection: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
  },
  pronunciationRecordButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  pronunciationRecordButtonActive: {
    backgroundColor: '#B91C1C',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  pronunciationRecordHint: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
  },
  pronunciationFooterButton: {
    width: '100%',
    paddingVertical: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.lg,
    backgroundColor: baseTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  pronunciationFooterButtonActive: {
    backgroundColor: baseTheme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  pronunciationFooterButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: baseTheme.colors.mutedText,
  },
  pronunciationFooterButtonTextActive: {
    color: baseTheme.colors.onPrimary,
  },
  // Loading screen
  pronunciationLoadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: baseTheme.spacing.lg,
  },
  pronunciationSpinner: {
    marginBottom: baseTheme.spacing.lg,
  },
  pronunciationLoadingTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    textAlign: 'center',
    marginBottom: baseTheme.spacing.sm,
  },
  pronunciationLoadingSubtext: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
    marginBottom: baseTheme.spacing.xs,
  },
  pronunciationLoadingTime: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
    marginBottom: baseTheme.spacing.lg,
  },
  pronunciationSteps: {
    alignSelf: 'stretch',
    gap: 12,
  },
  pronunciationStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pronunciationStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14B8A6',
  },
  pronunciationStepText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
  },
  // Result screen
  pronunciationResultHeading: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: baseTheme.spacing.sm,
  },
  pronunciationScore: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 56,
    color: '#0D9488',
    marginBottom: baseTheme.spacing.xs,
  },
  pronunciationScoreLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.md,
  },
  pronunciationBarContainer: {
    width: '100%',
    marginBottom: baseTheme.spacing.lg,
  },
  pronunciationBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  pronunciationBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#14B8A6',
    borderRadius: 4,
  },
  pronunciationBarMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginLeft: -2,
  },
  pronunciationBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  pronunciationBarLabelText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
  },
  pronunciationAnalysisTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: baseTheme.spacing.sm,
    alignSelf: 'flex-start',
  },
  pronunciationWordList: {
    width: '100%',
    gap: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.md,
  },
  pronunciationWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pronunciationWordRowExpanded: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
  },
  pronunciationTipPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    padding: 12,
    marginBottom: baseTheme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  pronunciationTipPanelIcon: {
    marginTop: 2,
  },
  pronunciationTipPanelText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  pronunciationTipPanelClose: {
    padding: 4,
  },
  pronunciationWordIcon: {
    marginRight: 10,
  },
  pronunciationWordText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    color: baseTheme.colors.text,
    flex: 1,
  },
  pronunciationWordBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pronunciationWordBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  pronunciationWordBadgePerfect: {
    backgroundColor: '#DCFCE7',
  },
  pronunciationWordBadgeImprove: {
    backgroundColor: '#FFEDD5',
  },
  pronunciationWordBadgeText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
  pronunciationWordBadgeTextPerfect: {
    color: '#166534',
  },
  pronunciationWordBadgeTextImprove: {
    color: '#C2410C',
  },
  pronunciationWordSpeaker: {
    padding: 4,
  },
  pronunciationLegend: {
    width: '100%',
    marginBottom: baseTheme.spacing.lg,
    gap: 4,
  },
  pronunciationLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pronunciationLegendIcon: {
    marginRight: 6,
  },
  pronunciationLegendText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    color: baseTheme.colors.mutedText,
    flex: 1,
  },
  pronunciationPracticeAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F97316',
    marginBottom: baseTheme.spacing.sm,
    gap: 8,
  },
  pronunciationPracticeAgainIcon: {
    marginRight: 4,
  },
  pronunciationPracticeAgainText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
  pronunciationNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    gap: 8,
  },
  pronunciationNextText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: baseTheme.colors.text,
  },
  checkButton: {
    backgroundColor: baseTheme.colors.primary,
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: baseTheme.spacing.md,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  durationText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
    marginTop: baseTheme.spacing.xs,
  },
  playbackSection: {
    alignItems: 'center',
    marginTop: baseTheme.spacing.md,
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    backgroundColor: baseTheme.colors.primary,
    paddingHorizontal: baseTheme.spacing.lg,
    paddingVertical: baseTheme.spacing.md,
    borderRadius: 12,
  },
  playbackButtonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
});
