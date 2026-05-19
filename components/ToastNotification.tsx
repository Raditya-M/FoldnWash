import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  border: string;
}

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
}

const CONFIG: Record<ToastType, ToastConfig> = {
  success: { icon: 'checkmark-circle', color: Colors.success, bg: Colors.successLight, border: Colors.success },
  error:   { icon: 'close-circle',     color: Colors.error,   bg: Colors.errorLight,   border: Colors.error   },
  warning: { icon: 'warning',          color: Colors.warning, bg: Colors.warningLight, border: Colors.warning },
  info:    { icon: 'information-circle', color: Colors.primary, bg: Colors.primaryLight, border: Colors.primary },
};

export default function ToastNotification({
  visible,
  message,
  type = 'info',
  onHide,
}: ToastNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const c = CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,   useNativeDriver: true, tension: 80 }),
        Animated.timing(opacity,    { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity,    { toValue: 0,    duration: 250, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.toast,
      { backgroundColor: c.bg, borderLeftColor: c.border },
      { transform: [{ translateY }], opacity },
    ]}>
      <Ionicons name={c.icon} size={20} color={c.color} />
      <Text style={[styles.msg, { color: c.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 56, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 9999,
  },
  msg: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});