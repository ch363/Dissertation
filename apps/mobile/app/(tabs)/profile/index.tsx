import { View, Text, StyleSheet, Switch } from 'react-native';

import { theme } from '../../../src/theme';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile & Settings</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch
          value={false}
          onValueChange={() => {}}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Adaptivity</Text>
        <Switch value onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch value onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
  },
});
