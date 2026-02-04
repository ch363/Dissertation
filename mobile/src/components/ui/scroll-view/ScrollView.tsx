import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';

/**
 * A ScrollView component with bounce/overscroll disabled by default.
 * This prevents the gap that appears when pulling down or over-scrolling upward.
 *
 * Accepts all standard ScrollView props and can be used as a drop-in replacement.
 */
export const ScrollView = React.forwardRef<RNScrollView, ScrollViewProps>(
  ({ bounces = false, overScrollMode = 'never', ...props }, ref) => {
    return <RNScrollView ref={ref} bounces={bounces} overScrollMode={overScrollMode} {...props} />;
  },
);

ScrollView.displayName = 'ScrollView';
