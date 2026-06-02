import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ENDPOINTS } from '../../constants/api';
import { api } from '../../utils/apiHelper';
import { Storage } from '../../utils/storage';
import { formatRupiah, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import SummaryCard from '../../components/SummaryCard';
import TransactionCard from '../../components/TransactionCard';
import EmptyState from '../../components/EmptyState';
import { DashboardSkeleton } from '../../components/LoadingSkeleton';
import ToastNotification from '../../components/ToastNotification';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface User {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Service {
  service_name?: string;
  unit?: string;
}

interface Transaction {
  id: number;
  invoice_code?: string;
  status?: string;
  service?: Service;
  weight?: number | string;
  payment_method?: string;
  total_price?: number | string;
  created_at?: string;
}

interface Stats {
  total_income?: number;
  monthly_income?: number;
  total_transactions?: number;
  active_transactions?: number;
  completed_transactions?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]                     = useState<User | null>(null);
  const [stats, setStats]                   = useState<Stats | null>(null);
  const [transactions, setTransactions]     = useState<Transaction[]>([]);
  const [loading, setLoading]               = useState<boolean>(true);
  const [refreshing, setRefreshing]         = useState<boolean>(false);
  const [toast, setToast]                   = useState<ToastState>({
    visible: false, message: '', type: 'info',
  });

  function showToast(msg: string, type: ToastType = 'error') {
    setToast({ visible: true, message: msg, type });
  }

async function loadData() {
  try {
    const [trxRes, savedUser] = await Promise.all([
      api.get('/history'),
      Storage.getUser(),
    ]);

    const trxData =
      trxRes.data?.data ??
      trxRes.data ??
      trxRes ??
      [];

    const trxArray = Array.isArray(trxData)
      ? trxData
      : trxData.data ?? [];

    setTransactions(trxArray.slice(0, 5));

    // bikin stats manual dari transaksi customer
    const monthlyIncome = trxArray.reduce(
      (sum: number, item: Transaction) =>
        sum + Number(item.total_price ?? 0),
      0
    );

    const activeTransactions = trxArray.filter(
      (t: Transaction) => t.status !== 'diambil'
    ).length;

    setStats({
      total_transactions: trxArray.length,
      monthly_income: monthlyIncome,
      active_transactions: activeTransactions,
    });

    setUser(savedUser as User | null);

  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : 'Gagal memuat data';

    showToast(message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  const activeCount = transactions.filter(t => t.status !== 'diambil').length;

  if (loading) return <DashboardSkeleton />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={[Colors.navy, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Halo, {user?.name?.split(' ')[0] ?? 'Pelanggan'}
              </Text>
              <Text style={styles.greetingSub}>Cek status laundry kamu</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Laundry Banner */}
          {activeCount > 0 && (
            <View style={styles.activeBanner}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBannerText}>
                {activeCount} laundry sedang diproses
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          {/* Summary Cards */}
          <View style={styles.cardsRow}>
            <SummaryCard
              title="Total Transaksi"
              value={String(stats?.total_transactions ?? '—')}
              icon="receipt-outline"
              color={Colors.primary}
              bg={Colors.primaryLight}
            />
            <View style={{ width: 12 }} />
            <SummaryCard
              title="Total Pengeluaran"
              value={formatRupiah(stats?.monthly_income ?? 0)}
              icon="wallet-outline"
              color={Colors.navy}
              bg="#E8EEF5"
            />
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as any)}>
                <Text style={styles.seeAll}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {transactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="Belum ada transaksi"
                subtitle="Transaksi kamu akan muncul di sini"
              />
            ) : (
              transactions.map((t: Transaction) => (
                <TransactionCard
                  key={t.id}
                  item={t}
                  onPress={() => router.push(`/transactions/${t.id}` as any)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56, paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  activeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.white },
  body: { padding: 20 },
  cardsRow: { flexDirection: 'row', marginBottom: 24 },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.navy },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});