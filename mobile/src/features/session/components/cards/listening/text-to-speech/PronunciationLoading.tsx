import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { pronunciationStyles, CardColors } from '../shared';

import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  cardColors: CardColors;
};

/**
 * Loading screen shown while pronunciation is being analyzed.
 */
export function PronunciationLoading({ cardColors }: Props) {
  return (
    <View
      style={[
        pronunciationStyles.loadingContent,
        {
          borderLeftWidth: 3,
          borderLeftColor: cardColors.border,
          paddingLeft: baseTheme.spacing.sm,
          borderRadius: baseTheme.radius.sm,
        },
      ]}
    >
      <ActivityIndicator
        size="large"
        color="#14B8A6"
        style={pronunciationStyles.spinner}
      />
      <Text style={pronunciationStyles.loadingTitle}>
        Analysing pronunciation...
      </Text>
    </View>
  );
}
