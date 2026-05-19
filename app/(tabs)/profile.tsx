import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Storage } from '../../utils/storage';
import { api } from '../../utils/apiHelper';
import { ENDPOINTS } from '../../constants/api';
import { formatRupiah } from '../../utils/formatters';
import ToastNotification from '../../components/ToastNotification';
import { Modal } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface User {
  id?: number;
  name?: string;
  phone?: string;
  address?: string;
}

interface Stats {
  total_transactions?: number;
  active_transactions?: number;
  completed_transactions?: number;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.menuItem}
    >
      <View style={[styles.menuIcon, danger && { backgroundColor: Colors.errorLight }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const [logoutModal, setLogoutModal] = useState(false);
  const [user, setUser]     = useState<User | null>(null);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [toast, setToast]   = useState<ToastState>({
    visible: false, message: '', type: 'info',
  });

  function showToast(msg: string, type: ToastType = 'info') {
    setToast({ visible: true, message: msg, type });
  }

  useFocusEffect(
    useCallback(() => {
      async function load() {
  try {
    const profileRes = await api.get('/profile');

    const userData =
      profileRes.data?.data ??
      profileRes.data;

    setUser(userData);

    // update storage juga
    await Storage.setUser(userData);

    const res = await api.get('/history');

    const trxData =
      res.data?.data ??
      res.data ??
      res ??
      [];

    const trxArray = Array.isArray(trxData)
      ? trxData
      : trxData.data ?? [];

    const activeTransactions = trxArray.filter(
      (t: any) => t.status !== 'diambil'
    ).length;

    const completedTransactions = trxArray.filter(
      (t: any) => t.status === 'diambil'
    ).length;

    setStats({
      total_transactions: trxArray.length,
      active_transactions: activeTransactions,
      completed_transactions: completedTransactions,
    });

  } catch (e) {
    console.log(e);
  }
}
      load();
    }, [])
  );

  function handleLogout() {
    setLogoutModal(true);
  }

  async function confirmLogout() {
    try {
      await api.post(ENDPOINTS.logout, {});
    } catch (e: unknown) {}

    await Storage.clear();

    setLogoutModal(false);

    router.replace('/(auth)/login' as any);
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_transactions ?? '—'}</Text>
            <Text style={styles.statLabel}>Transaksi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.active_transactions ?? '—'}</Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.completed_transactions ?? '—'}</Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Akun</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline"   label="Nama"     value={user?.name ?? '—'} />
            <MenuItem icon="call-outline"     label="Telepon"  value={user?.phone ?? '—'} />
            <MenuItem icon="location-outline" label="Alamat"   value={user?.address ?? '—'} />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Lainnya</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Keluar"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>Fold & Wash v1.0.0</Text>
      </ScrollView>

        <Modal
          visible={logoutModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>

              <View style={styles.modalIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={28}
                  color={Colors.error}
                />
              </View>

              <Text style={styles.modalTitle}>
                Keluar Akun?
              </Text>

              <Text style={styles.modalSubtitle}>
                Kamu yakin ingin logout dari aplikasi?
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setLogoutModal(false)}
                >
                  <Text style={styles.cancelText}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={confirmLogout}
                >
                  <Text style={styles.logoutText}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center', paddingTop: 64, paddingBottom: 28,
    paddingHorizontal: 24, backgroundColor: Colors.white,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4, marginBottom: 20,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  name: { fontSize: 20, fontWeight: '700', color: Colors.navy, marginBottom: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 20, marginHorizontal: 20, marginBottom: 20,
    padding: 16, shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1,
    shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.navy, marginBottom: 4 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  menuSection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  menuValue: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  version: {
    textAlign: 'center', fontSize: 12,
    color: Colors.textMuted, paddingVertical: 24,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
},

modalCard: {
  width: '100%',
  backgroundColor: Colors.white,
  borderRadius: 28,
  padding: 24,
  alignItems: 'center',
},

modalIcon: {
  width: 72,
  height: 72,
  borderRadius: 999,
  backgroundColor: Colors.errorLight,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 18,
},

modalTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: Colors.navy,
  marginBottom: 8,
},

modalSubtitle: {
  fontSize: 14,
  color: Colors.textSecondary,
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 24,
},

modalActions: {
  flexDirection: 'row',
  gap: 12,
  width: '100%',
},

cancelBtn: {
  flex: 1,
  height: 50,
  borderRadius: 16,
  backgroundColor: Colors.background,
  alignItems: 'center',
  justifyContent: 'center',
},

logoutBtn: {
  flex: 1,
  height: 50,
  borderRadius: 16,
  backgroundColor: Colors.error,
  alignItems: 'center',
  justifyContent: 'center',
},

cancelText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.textSecondary,
},

logoutText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.white,
},
});