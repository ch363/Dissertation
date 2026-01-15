import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Animated, ActivityIndicator } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { ListeningCard as ListeningCardType, PronunciationResult } from '@/types/session';
import * as SpeechRecognition from '@/services/speech-recognition';

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: (audioUri?: string) => void;
  pronunciationResult?: PronunciationResult | null;
};

export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
  onCheckAnswer,
  pronunciationResult,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const mode = card.mode || 'type'; // 'type' or 'speak'
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Animation for recording button
  useEffect(() => {
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
  }, [isRecording, pulseAnim]);

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
      console.error('Failed to play audio:', error);
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
      console.error('Failed to play word audio:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      setRecordingError(null);
      const uri = await SpeechRecognition.startRecording();
      if (uri) {
        setIsRecording(true);
      } else {
        setRecordingError('Failed to start recording. Please check microphone permissions.');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      const uri = await SpeechRecognition.stopRecording();
      if (uri) {
        setHasRecorded(true);
        setRecordedAudioUri(uri);
        setIsRecording(false);
      } else {
        setRecordingError('Failed to stop recording.');
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError('Failed to stop recording. Please try again.');
      setIsRecording(false);
    }
  };


  const handleRecordButtonPress = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  // Reset processing state when result is shown
  useEffect(() => {
    if (showResult) {
      setIsProcessing(false);
    }
  }, [showResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechRecognition.cleanup().catch(console.error);
    };
  }, []);

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
                <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={24}
                    color="#fff"
                  />
                </Pressable>
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
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={handleRecordButtonPress}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <Ionicons name="mic" size={48} color="#fff" />
                  )}
                </Pressable>
              </Animated.View>
              <Text style={styles.recordHint}>
                {isRecording ? 'Recording...' : 'Tap to record your pronunciation'}
              </Text>
              {recordingError && (
                <Text style={styles.errorText}>{recordingError}</Text>
              )}
            </View>

            {hasRecorded && !isProcessing && (
              <Pressable
                style={styles.continueButton}
                onPress={() => {
                  if (recordedAudioUri && onCheckAnswer) {
                    setIsProcessing(true);
                    onCheckAnswer(recordedAudioUri);
                  }
                }}
              >
                <Text style={styles.continueButtonText}>
                  Continue
                </Text>
              </Pressable>
            )}
            {!hasRecorded && (
              <Pressable
                style={[styles.continueButton, styles.continueButtonDisabled]}
                disabled={true}
              >
                <Text style={[styles.continueButtonText, styles.continueButtonTextDisabled]}>
                  Record to continue
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          // Result Screen (P23)
          <>
            <View style={styles.phraseCard}>
              <View style={styles.phraseRow}>
                <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={24}
                    color="#fff"
                  />
                </Pressable>
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
                          <Pressable
                            onPress={() => handlePlayWordAudio(word.word)}
                            style={styles.wordAudioButton}
                          >
                            <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
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
            <Pressable style={styles.audioButtonLarge} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={40}
                color="#fff"
              />
            </Pressable>
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
            />
          </View>
          {!showResult && userAnswer.trim().length > 0 && (
            <Pressable style={styles.checkButton} onPress={() => onCheckAnswer?.()}>
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
    color: '#28a745',
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
  continueButton: {
    backgroundColor: '#E0E0E0',
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  continueButtonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  continueButtonTextDisabled: {
    color: theme.colors.mutedText,
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
    color: '#28a745',
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
    color: '#28a745',
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
});
