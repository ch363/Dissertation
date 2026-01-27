import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { FillBlankCard as FillBlankCardType } from '@/types/session';
import { announce } from '@/utils/a11y';

type Props = {
  card: FillBlankCardType;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
};

export function FillBlankCard({ card, selectedAnswer, onSelectAnswer, showResult, isCorrect }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const previousAnswerRef = useRef<string | undefined>(undefined);

  // Speak the word when it's placed in the blank
  useEffect(() => {
    const speakSelectedWord = async () => {
      // Speak if:
      // 1. There's a selected answer
      // 2. It's different from the previous answer (new word was placed)
      // Allow speaking even after results are shown, so users can hear each wrong answer they try
      if (selectedAnswer && selectedAnswer !== previousAnswerRef.current) {
        try {
          const enabled = await getTtsEnabled();
          if (!enabled) {
            return;
          }
          
          const rate = await getTtsRate();
          await SafeSpeech.stop();
          // Small delay to ensure stop completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Speak the selected word
          console.log('FillBlankCard: Speaking selected word:', selectedAnswer);
          await SafeSpeech.speak(selectedAnswer, { language: 'it-IT', rate });
        } catch (error) {
          console.error('FillBlankCard: Failed to speak selected word:', error);
        }
      }
      
      // Update the ref to track the current answer
      previousAnswerRef.current = selectedAnswer;
    };

    speakSelectedWord();
  }, [selectedAnswer, showResult]);

  useEffect(() => {
    if (!showResult) return;
    if (isCorrect === true) announce('Correct.');
    else if (isCorrect === false) announce('Incorrect.');
  }, [showResult, isCorrect]);

  const handlePlayAudio = async () => {
    if (!card.text) {
      console.warn('FillBlankCard: No text available for audio');
      return;
    }
    
    // Prevent multiple rapid calls
    if (isPlaying) {
      return;
    }
    
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        console.warn('FillBlankCard: TTS is disabled');
        return;
      }
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Small delay to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Speak the sentence with blank removed (replace ___ with a pause or just remove it)
      // Remove the blank marker and speak the sentence naturally
      const textToSpeak = card.text.replace(/___/g, ' ').trim() || '';
      if (!textToSpeak) {
        console.warn('FillBlankCard: No text to speak after processing');
        setIsPlaying(false);
        return;
      }
      console.log('FillBlankCard: Speaking text:', textToSpeak);
      await SafeSpeech.speak(textToSpeak, { language: 'it-IT', rate });
      // Estimate duration: ~150ms per character, minimum 2 seconds
      const estimatedDuration = Math.max(textToSpeak.length * 150, 2000);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      console.error('FillBlankCard: Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  // Parse sentence to find blank position
  const sentenceParts = card.text.split('___');
  const hasBlank = sentenceParts.length === 2;

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>FILL IN THE BLANK</Text>

      {/* Main Question Card */}
      <View style={styles.questionCard}>
        {/* Audio button - always show if text is available */}
        {(card.audioUrl || card.text) && (
          <Pressable
            style={styles.audioButton}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityHint="Plays the sentence audio"
            accessibilityState={{ selected: isPlaying, busy: isPlaying }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={20}
              color="#4A90E2"
              accessible={false}
              importantForAccessibility="no"
            />
            <Text style={styles.audioLabel}>Listen and complete</Text>
          </Pressable>
        )}

        {/* Sentence with blank */}
        <View style={styles.sentenceContainer}>
          {sentenceParts[0] && <Text style={styles.sentenceText}>{sentenceParts[0].trim()}</Text>}
          <View 
            style={[
              styles.blankField, 
              selectedAnswer && showResult
                ? isCorrect 
                  ? styles.blankFieldCorrect 
                  : styles.blankFieldIncorrect
                : selectedAnswer 
                  ? styles.blankFieldFilled 
                  : null
            ]}
          >
            <Text 
              style={[
                styles.blankText, 
                selectedAnswer && showResult
                  ? isCorrect
                    ? styles.blankTextCorrect
                    : styles.blankTextIncorrect
                  : selectedAnswer
                    ? styles.blankTextFilled
                    : null
              ]}
            >
              {selectedAnswer || ''}
            </Text>
            {/* Show checkmark/X icon for correct/incorrect */}
            {selectedAnswer && showResult && (
              <Ionicons 
                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isCorrect ? "#28a745" : "#dc3545"} 
                style={styles.blankIcon} 
              />
            )}
          </View>
          {sentenceParts[1] && <Text style={styles.sentenceText}>{sentenceParts[1].trim()}</Text>}
        </View>
      </View>

      {/* Options Card */}
      {card.options && card.options.length > 0 && (
        <View style={styles.optionsCard}>
          <Text style={styles.optionsLabel}>TAP TO FILL THE BLANK</Text>
          <View style={styles.optionsGrid}>
            {card.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label;
              const isCorrectOption = showResult && isCorrect && isSelected;
              const isIncorrectOption = showResult && !isCorrect && isSelected;
              // Disable all options once correct answer is selected
              const isDisabled = showResult && isCorrect;
              
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.optionButton, 
                    !showResult && isSelected && styles.optionButtonSelected,
                    isCorrectOption && styles.optionButtonCorrect,
                    isIncorrectOption && styles.optionButtonIncorrect,
                    isDisabled && !isCorrectOption && styles.optionButtonDisabled,
                  ]}
                  onPress={() => {
                    // Only allow selection if correct answer hasn't been selected yet
                    if (!isDisabled) {
                      onSelectAnswer?.(opt.label);
                    }
                  }}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Answer option: ${opt.label}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isDisabled,
                  }}
                >
                  <Text 
                    style={[
                      styles.optionText, 
                      !showResult && isSelected && styles.optionTextSelected,
                      isCorrectOption && styles.optionTextCorrect,
                      isIncorrectOption && styles.optionTextIncorrect,
                      isDisabled && !isCorrectOption && styles.optionTextDisabled,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {/* Show checkmark/X icon for correct/incorrect */}
                  {isCorrectOption && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#28a745"
                      style={styles.optionIcon}
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  )}
                  {isIncorrectOption && (
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="#dc3545"
                      style={styles.optionIcon}
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  instruction: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  audioLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sentenceText: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    lineHeight: 28,
  },
  blankField: {
    minWidth: 100,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  blankIcon: {
    marginLeft: theme.spacing.xs,
  },
  blankFieldFilled: {
    backgroundColor: '#E8F4FD',
    borderColor: '#4A90E2',
  },
  blankFieldCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 3,
  },
  blankFieldIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 3,
  },
  blankText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: '#4A90E2',
    minHeight: 20,
  },
  blankTextFilled: {
    color: theme.colors.text,
  } as const,
  blankTextCorrect: {
    color: '#28a745',
  },
  blankTextIncorrect: {
    color: '#dc3545',
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionsLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  optionIcon: {
    marginLeft: theme.spacing.xs,
  },
  optionButtonSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  optionButtonCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 3,
  },
  optionButtonIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 3,
  },
  optionText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#4A90E2',
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionTextCorrect: {
    color: '#28a745',
  },
  optionTextIncorrect: {
    color: '#dc3545',
  },
  optionButtonDisabled: {
    opacity: 0.5,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  optionTextDisabled: {
    color: '#999',
  },
});
