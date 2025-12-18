import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  title?: string;
  address?: string;
  description?: string;
}

export default function ExpandingTile({ title, address, description }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          style={styles.toggleButton}
        >
          <Text style={[styles.toggleText, { color: colors.secondary }]}>
            {expanded ? 'Less' : 'More'}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.content}>
          {address ? (
            <Text style={[typography.body2, { color: colors.textSecondary }]}>
              {' '}
              {address}{' '}
            </Text>
          ) : null}
          {description ? (
            <Text style={[typography.body2, { color: colors.textSecondary }]}>
              {' '}
              {description}{' '}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    marginTop: 8,
  },
});
