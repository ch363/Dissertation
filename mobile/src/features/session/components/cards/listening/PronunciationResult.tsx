import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { listeningStyles, pronunciationStyles } from './listeningStyles';

import { ContentContinueButton, SpeakerButton } from '@/components/ui';
import { theme as baseTheme } from '@/services/theme/tokens';
import { PronunciationResult as PronunciationResultType } from '@/types/session';

type CardColors = {
  border: string;
  instruction: string;
};

type Props = {
  expected: string;
  translation?: string;
  pronunciationResult: PronunciationResultType;
  cardColors: CardColors;
  onPlayWordAudio: (word: string) => void;
  onPracticeAgain?: () => void;
  onContinue?: () => void;
};

const SCORE_LABELS = [
  { label: 'Poor', min: 0, max: 49 },
  { label: 'Fair', min: 50, max: 69 },
  { label: 'Good', min: 70, max: 79 },
  { label: 'Great', min: 80, max: 89 },
  { label: 'Excellent', min: 90, max: 100 },
];

/**
 * Displays pronunciation assessment results with score and word-by-word analysis.
 */
export function PronunciationResult({
  expected,
  translation,
  pronunciationResult,
  cardColors,
  onPlayWordAudio,
  onPracticeAgain,
  onContinue,
}: Props) {
  const scoreLabel = SCORE_LABELS.find(
    (s) =>
      pronunciationResult.overallScore >= s.min &&
      pronunciationResult.overallScore <= s.max,
  );

  const wordsNeedingImprovement = pronunciationResult.words.filter(
    (w) => w.feedback === 'could_improve',
  );
  const firstImproveWord = wordsNeedingImprovement[0];
  const shouldShowSpecificWord = wordsNeedingImprovement.length === 1;

  return (
    <View
      style={[
        listeningStyles.pronunciationContainer,
        {
          borderLeftWidth: 3,
          borderLeftColor: cardColors.border,
          paddingLeft: baseTheme.spacing.sm,
          borderRadius: baseTheme.radius.sm,
        },
      ]}
    >
      <Text style={[pronunciationStyles.resultHeading, { color: cardColors.instruction }]}>
        PRONUNCIATION RESULT
      </Text>

      <Text style={pronunciationStyles.phrase}>{expected}</Text>
      <Text style={pronunciationStyles.translation}>
        {translation ? `(${translation})` : ''}
      </Text>

      <Text style={pronunciationStyles.score}>
        {pronunciationResult.overallScore}%
      </Text>
      <Text style={pronunciationStyles.scoreLabel}>
        {scoreLabel?.label ?? '—'} ({scoreLabel?.min ?? 0}–{scoreLabel?.max ?? 100})
      </Text>

      {/* Progress bar */}
      <View style={pronunciationStyles.barContainer}>
        <View style={pronunciationStyles.barTrack}>
          <View
            style={[
              pronunciationStyles.barFill,
              { width: `${Math.min(100, Math.max(0, pronunciationResult.overallScore))}%` },
            ]}
          />
          <View
            style={[
              pronunciationStyles.barMarker,
              { left: `${Math.min(100, Math.max(0, pronunciationResult.overallScore))}%` },
            ]}
          />
        </View>
        <View style={pronunciationStyles.barLabels}>
          <Text style={pronunciationStyles.barLabelText}>Poor</Text>
          <Text style={pronunciationStyles.barLabelText}>Excellent</Text>
        </View>
      </View>

      {/* Word-by-word analysis */}
      <Text style={pronunciationStyles.analysisTitle}>WORD-BY-WORD ANALYSIS</Text>
      <View style={pronunciationStyles.wordList}>
        {pronunciationResult.words.map((word, index) => (
          <View key={index} style={pronunciationStyles.wordRow}>
            <Ionicons
              name={word.feedback === 'perfect' ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={word.feedback === 'perfect' ? '#22C55E' : '#F97316'}
              style={pronunciationStyles.wordIcon}
            />
            <Text style={pronunciationStyles.wordText}>{word.word}</Text>
            <View style={pronunciationStyles.wordBadgeWrap}>
              <View
                style={[
                  pronunciationStyles.wordBadge,
                  word.feedback === 'perfect'
                    ? pronunciationStyles.wordBadgePerfect
                    : pronunciationStyles.wordBadgeImprove,
                ]}
              >
                <Text
                  style={[
                    pronunciationStyles.wordBadgeText,
                    word.feedback === 'perfect'
                      ? pronunciationStyles.wordBadgeTextPerfect
                      : pronunciationStyles.wordBadgeTextImprove,
                  ]}
                >
                  {word.feedback === 'perfect' ? 'Perfect' : 'Could improve'}
                </Text>
              </View>
              {word.feedback === 'could_improve' && (
                <View style={pronunciationStyles.wordSpeaker} pointerEvents="box-none">
                  <SpeakerButton
                    size={32}
                    onPress={() => onPlayWordAudio(word.word)}
                    accessibilityLabel={`Play ${word.word}`}
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Practice again button */}
      {firstImproveWord && (
        <Pressable
          style={pronunciationStyles.practiceAgainButton}
          onPress={onPracticeAgain}
          accessibilityLabel={
            shouldShowSpecificWord
              ? `Practice ${firstImproveWord.word} again`
              : 'Practice again'
          }
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#fff"
            style={pronunciationStyles.practiceAgainIcon}
          />
          <Text style={pronunciationStyles.practiceAgainText}>
            {shouldShowSpecificWord
              ? `Practice "${firstImproveWord.word}" again`
              : 'Practice again'}
          </Text>
        </Pressable>
      )}

      <ContentContinueButton
        title="Continue"
        onPress={onContinue ?? (() => {})}
        disabled={!onContinue}
        accessibilityLabel="Continue"
        accessibilityHint="Goes to next question"
      />
    </View>
  );
}
