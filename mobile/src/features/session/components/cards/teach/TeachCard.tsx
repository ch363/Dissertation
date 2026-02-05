import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { teachStyles as styles, CARD_GRADIENT, USAGE_ICON_SLATE } from './teachStyles';

import { CARD_TYPE_COLORS } from '@/features/session/constants/cardTypeColors';
import { SpeakerButton } from '@/components/ui';
import { useTtsAudio } from '@/hooks/useTtsAudio';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { TeachCard as TeachCardType } from '@/types/session';

const logger = createLogger('TeachCard');

type Props = {
  card: TeachCardType;
};

export function TeachCard({ card }: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const { speak, isSpeaking } = useTtsAudio();
  const [showTapHint, setShowTapHint] = useState(true);

  const handleSpeak = async () => {
    setShowTapHint(false);

    const phrase = card.content.phrase || '';
    if (!phrase) {
      logger.warn('No phrase to speak');
      return;
    }

    logger.info('Speaking phrase', { phrase, language: 'it-IT' });
    await speak(phrase, 'it-IT');
  };

  return (
    <View style={styles.container} testID="teach-card">
      <LinearGradient
        colors={CARD_GRADIENT}
        style={[
          styles.teachCard,
          isSpeaking && styles.teachCardSpeaking,
          { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.teach.border },
        ]}
      >
        <View style={styles.teachCardInner}>
          {card.content.emoji ? <Text style={styles.teachEmoji}>{card.content.emoji}</Text> : null}

          <View style={styles.phraseBlock}>
            <Text style={[styles.teachPhrase, { color: theme.colors.text }]}>
              {card.content.phrase}
            </Text>
            {card.content.translation ? (
              <Text style={[styles.teachTranslation, { color: theme.colors.mutedText }]}>
                {card.content.translation}
              </Text>
            ) : null}
          </View>

          <SpeakerButton
            size={80}
            isPlaying={isSpeaking}
            onPress={handleSpeak}
            showTapHint={showTapHint}
            tapHintText="Tap to listen"
            accessibilityLabel={isSpeaking ? 'Playing audio' : 'Play pronunciation'}
          />
        </View>
      </LinearGradient>

      {card.content.usageNote ? (
        <View style={styles.usageNoteCard}>
          <Ionicons
            name="book-outline"
            size={18}
            color={USAGE_ICON_SLATE}
            style={styles.usageNoteIcon}
          />
          <Text style={[styles.usageNoteText, { color: theme.colors.mutedText }]}>
            {card.content.usageNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
