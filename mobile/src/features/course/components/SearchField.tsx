import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

interface SearchFieldProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  editable?: boolean;
  /** Optional for controlled usage */
  accessibilityLabel?: string;
}

const DEFAULT_PLACEHOLDER = 'Search modules';

export function SearchField({
  value,
  onChangeText,
  placeholder = DEFAULT_PLACEHOLDER,
  style,
  editable = true,
  accessibilityLabel = 'Search modules',
}: SearchFieldProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.wrap, style]}>
      <Ionicons
        name="search"
        size={18}
        color={theme.colors.mutedText}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.border + '40',
            borderColor: theme.colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    marginTop: -9,
    zIndex: 1,
  },
  input: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    paddingLeft: 42,
    paddingRight: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
