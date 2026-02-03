import React from 'react';
import { Pressable, View } from 'react-native';
import renderer from 'react-test-renderer';

import { Button, IconButton, ListRow } from '@/components/ui';
import { TabBarButton } from '@/components/navigation';
import { ThemeProvider } from '@/services/theme/ThemeProvider';

function wrap(node: React.ReactElement) {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe('UI accessibility primitives', () => {
  it('Button sets role/label/hint and exposes busy/disabled state', () => {
    const tree = renderer.create(
      wrap(
        <Button
          title="Save"
          onPress={() => {}}
          accessibilityHint="Saves your changes"
        />,
      ),
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Save');
    expect(pressable.props.accessibilityHint).toBe('Saves your changes');
    expect(pressable.props.accessibilityState).toEqual({ disabled: false, busy: false });
  });

  it('Button marks itself busy+disabled when loading', () => {
    const tree = renderer.create(
      wrap(
        <Button
          title="Save"
          onPress={() => {}}
          loading
        />,
      ),
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(pressable.props.disabled).toBe(true);
  });

  it('IconButton requires a label and hides icon content from screen readers', () => {
    const tree = renderer.create(
      <IconButton
        accessibilityLabel="Open settings"
        onPress={() => {}}
      >
        <View />
      </IconButton>,
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Open settings');

    const inner = tree.root.findAllByType(View).find((v) => v.props?.importantForAccessibility === 'no');
    expect(inner?.props.accessible).toBe(false);
  });

  it('ListRow defaults accessibilityLabel to title and uses role=button when pressable', () => {
    const tree = renderer.create(
      wrap(
        <ListRow
          title="Session defaults"
          subtitle="Preferred session length and exercise types"
          onPress={() => {}}
        />,
      ),
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Session defaults');
  });

  it('TabBarButton uses role=tab and selected state', () => {
    const tree = renderer.create(
      wrap(
        <TabBarButton
          label="Home"
          iconName="home"
          isFocused
          onPress={() => {}}
          onLongPress={() => {}}
        />,
      ),
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('tab');
    expect(pressable.props.accessibilityState).toEqual({ selected: true });
  });
});

