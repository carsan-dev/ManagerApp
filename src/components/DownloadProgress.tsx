import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  progress: number;
  version: string;
};

export const DownloadProgress: React.FC<Props> = ({ visible, progress, version }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Descargando actualización</Text>
          <Text style={styles.version}>Versión {version}</Text>

          <ProgressBar
            progress={progress / 100}
            color={colors.primary}
            style={styles.progressBar}
          />

          <Text style={styles.percentage}>{progress}%</Text>
          <Text style={styles.hint}>No cierres la aplicación</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.md,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
