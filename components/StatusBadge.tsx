import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors } from '../constants/colors';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = StatusColors[status as keyof typeof StatusColors] ?? StatusColors['antrian'];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: s.dot }, isSmall && styles.dotSm]} />
      <Text style={[styles.label, { color: s.text }, isSmall && styles.labelSm]}>
        {status ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 100, alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotSm: { width: 5, height: 5 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  labelSm: { fontSize: 11 },
});