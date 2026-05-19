import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';
import { Colors } from '../constants/colors';

interface SkeletonBoxProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: object;
}

function SkeletonBox({ width, height, borderRadius = 8, style = {} }: SkeletonBoxProps) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{
      width, height, borderRadius,
      backgroundColor: Colors.gray200,
      opacity: anim,
    }, style]} />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox width={120} height={16} borderRadius={8} />
        <SkeletonBox width={70} height={24} borderRadius={12} />
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <SkeletonBox width={60} height={32} borderRadius={8} />
        <SkeletonBox width={60} height={32} borderRadius={8} />
        <SkeletonBox width={60} height={32} borderRadius={8} />
      </View>
      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox width={80} height={14} borderRadius={6} />
        <SkeletonBox width={90} height={18} borderRadius={6} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      <SkeletonBox width={180} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
      <SkeletonBox width={120} height={16} borderRadius={6} style={{ marginBottom: 24 }} />
      <View style={styles.row}>
        <SkeletonBox width="48%" height={100} borderRadius={20} />
        <SkeletonBox width="48%" height={100} borderRadius={20} />
      </View>
      <SkeletonBox width="100%" height={140} borderRadius={20} style={{ marginTop: 16 }} />
      {[1, 2].map(i => (
        <SkeletonBox key={i} width="100%" height={120} borderRadius={20} style={{ marginTop: 12 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
});