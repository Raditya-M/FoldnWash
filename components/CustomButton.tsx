import React, { ReactNode } from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
  icon?: ReactNode;
  style?: object;
}

export default function CustomButton({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon = null,
  style = {},
}: CustomButtonProps) {
  const isOutline     = variant === 'outline';
  const isGhost       = variant === 'ghost';
  const isDestructive = variant === 'destructive';

  const bgColor = isOutline || isGhost
    ? 'transparent'
    : isDestructive
    ? Colors.error
    : Colors.primary;

  const textColor = isOutline
    ? Colors.primary
    : isGhost
    ? Colors.textSecondary
    : Colors.white;

  const borderColor = isOutline ? Colors.primary : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: bgColor, borderColor, borderWidth: isOutline ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.white} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { marginRight: 4 },
  label: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  disabled: { opacity: 0.5 },
});