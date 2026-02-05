import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { listeningStyles, CardColors } from '../shared';

import { SpeakerButton } from '@/components/ui';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  expected: string;
  translation?: string;
  cardColors: CardColors;
  userAnswer: string;
  onAnswerChange?: (answer: string) => void;
  showResult: boolean;
  isCorrect?: boolean;
  isPlaying: boolean;
  onPlayAudio: () => void;
  onCheckAnswer?: () => void;
};

/**
 * Speech-to-text delivery mode for ListeningCard.
 * User hears audio (TTS) and types what they heard.
 * 
 * Delivery method: audio → text input
 */
export function ListeningTypeMode({
  expected,
  translation,
  cardColors,
  userAnswer,
  onAnswerChange,
  showResult,
  isCorrect,
  isPlaying,
  onPlayAudio,
  onCheckAnswer,
}: Props) {
  return (
    <View style={listeningStyles.container} testID="listening-card">
      <Text style={[listeningStyles.instruction, { color: cardColors.instruction }]}>
        TYPE WHAT YOU HEAR
      </Text>

      {!showResult ? (
        // Input Screen
        <>
          <View
            style={[
              listeningStyles.audioCard,
              {
                borderLeftWidth: 3,
                borderLeftColor: cardColors.border,
                paddingLeft: baseTheme.spacing.sm,
              },
            ]}
          >
            <SpeakerButton
              size={72}
              isPlaying={isPlaying}
              onPress={onPlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
              accessibilityHint="Plays the phrase audio"
            />
          </View>

          <View style={listeningStyles.inputCard}>
            <Text style={listeningStyles.inputLabel}>YOUR ANSWER:</Text>
            <TextInput
              style={listeningStyles.textInput}
              value={userAnswer}
              onChangeText={onAnswerChange}
              placeholder="Type here..."
              autoFocus
              editable={!showResult}
              accessibilityLabel="Your answer"
              testID="listening-input"
            />
          </View>

          {userAnswer.trim().length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Check answer"
              onPress={() => onCheckAnswer?.()}
              style={listeningStyles.checkButton}
              testID="listening-check-button"
            >
              <Text style={listeningStyles.checkButtonText}>Check Answer</Text>
            </Pressable>
          )}
        </>
      ) : (
        // Result Screen
        <>
          <View
            style={[
              listeningStyles.audioCard,
              {
                borderLeftWidth: 3,
                borderLeftColor: cardColors.border,
                paddingLeft: baseTheme.spacing.sm,
              },
            ]}
          >
            <SpeakerButton
              size={72}
              isPlaying={isPlaying}
              onPress={onPlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            />
          </View>

          <View
            style={[
              listeningStyles.resultCard,
              isCorrect ? listeningStyles.resultCardCorrect : listeningStyles.resultCardWrong,
              { borderLeftWidth: 3, borderLeftColor: cardColors.border },
            ]}
            testID={isCorrect ? 'feedback-correct' : 'feedback-incorrect'}
          >
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={isCorrect ? '#28a745' : '#dc3545'}
            />
            <Text style={listeningStyles.resultTitle}>
              {isCorrect ? 'CORRECT!' : 'INCORRECT'}
            </Text>

            {!isCorrect && (
              <View style={listeningStyles.answerComparison}>
                <View style={listeningStyles.answerRow}>
                  <Text style={listeningStyles.answerLabel}>Your answer</Text>
                  <Text style={listeningStyles.answerValue}>
                    {userAnswer.trim() || '(empty)'}
                  </Text>
                </View>
                <View style={listeningStyles.answerRow}>
                  <Text style={listeningStyles.answerLabel}>Correct answer</Text>
                  <View style={listeningStyles.answerContainer}>
                    <Text style={listeningStyles.answerText}>{expected}</Text>
                    <SpeakerButton
                      size={36}
                      isPlaying={isPlaying}
                      onPress={onPlayAudio}
                      accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {isCorrect && translation && (
            <View style={listeningStyles.infoCard}>
              <Text style={listeningStyles.infoLabel}>MEANING</Text>
              <Text style={listeningStyles.infoText}>{translation}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
