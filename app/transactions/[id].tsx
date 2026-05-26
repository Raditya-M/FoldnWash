import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ENDPOINTS } from '../../constants/api';
import { api } from '../../utils/apiHelper';
import { formatRupiah, formatDateTime, formatWeight } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import ToastNotification from '../../components/ToastNotification';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface Service {
  service_name?: string;
  unit?: string;
}

interface Customer {
  user?: {
    name?: string;
  };
}

interface Transaction {
  id: number;
  invoice_code?: string;
  status?: string;
  service?: Service;
  customer?: Customer;
  weight?: number | string;
  payment_method?: string;
  total_price?: number | string;
  payment_proof?: string;
  created_at?: string;
}

const STATUS_LIST = ['antrian', 'dicuci', 'disetrika', 'siap diambil', 'diambil'] as const;

interface TimelineStepProps {
  status: string;
  current: string;
  index: number;
  total: number;
}

function TimelineStep({ status, current, index, total }: TimelineStepProps) {
  const currentIndex = STATUS_LIST.indexOf(
    current as typeof STATUS_LIST[number]
  );

  const isCompleted = current === 'diambil';

  const isDone =
    index < currentIndex ||
    (isCompleted && index === currentIndex);

  const isActive =
    index === currentIndex && !isCompleted;

  const isPending = index > currentIndex;

  const isLast = index === total - 1;

  return (
    <View style={styles.timelineStep}>
      {index > 0 && (
        <View
          style={[
            styles.timelineLine,
            {
              backgroundColor:
                isDone || isActive
                  ? Colors.primary
                  : Colors.border,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.timelineDot,

          isActive && {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
            width: 16,
            height: 16,
          },

          isDone && {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
          },

          isPending && {
            backgroundColor: Colors.white,
            borderColor: Colors.border,
          },
        ]}
      >
        {isDone && (
          <Ionicons
            name="checkmark"
            size={8}
            color={Colors.white}
          />
        )}
      </View>

      {!isLast && (
        <View
          style={[
            styles.timelineLine,
            {
              backgroundColor:
                isDone
                  ? Colors.primary
                  : Colors.border,
            },
          ]}
        />
      )}

      <Text
        style={[
          styles.timelineLabel,

          (isActive || isDone) && {
            color: Colors.primary,
            fontWeight: '700',
          },

          isPending && {
            color: Colors.textMuted,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ icon, label, value, last = false }: InfoRowProps) {
  return (
    <View style={[
      styles.infoRow,
      !last && { borderBottomWidth: 1, borderBottomColor: Colors.border },
    ]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trx, setTrx]         = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast]     = useState<ToastState>({
    visible: false, message: '', type: 'info',
  });

  function showToast(msg: string, type: ToastType = 'info') {
    setToast({ visible: true, message: msg, type });
  }

useEffect(() => {
  async function load() {
    try {
      const res = await api.get(`/transactions/${id}`);

      const data =
        res.data?.data ??
        res.data ??
        res;

      setTrx(data);

    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Gagal memuat data';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  load();
}, [id]);

  if (loading) return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: Colors.background,
    }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  if (!trx) return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: Colors.background,
    }}>
      <Text style={{ color: Colors.textSecondary }}>Transaksi tidak ditemukan</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Invoice Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.invoiceCode}>
                {trx.invoice_code ?? `#${trx.id}`}
              </Text>
              <Text style={styles.invoiceDate}>
                {formatDateTime(trx.created_at)}
              </Text>
            </View>
            <StatusBadge status={trx.status ?? 'antrian'} />
          </View>
          <View style={styles.heroDivider} />
          <Text style={styles.heroTotal}>{formatRupiah(trx.total_price)}</Text>
          <Text style={styles.heroTotalLabel}>Total Pembayaran</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Status Timeline */}
          <Text style={styles.sectionTitle}>Status Laundry</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              {STATUS_LIST.map((s, i) => (
                <TimelineStep
                  key={s}
                  status={s}
                  current={trx.status ?? 'antrian'}
                  index={i}
                  total={STATUS_LIST.length}
                />
              ))}
            </View>
          </View>

          {/* Service Info */}
          <Text style={styles.sectionTitle}>Informasi Layanan</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="shirt-outline"
              label="Layanan"
              value={trx.service?.service_name ?? '—'}
            />
            <InfoRow
              icon="scale-outline"
              label="Berat/Jumlah"
              value={formatWeight(trx.weight, trx.service?.unit)}
            />
            <InfoRow
              icon="person-outline"
              label="Pelanggan"
              value={trx.customer?.user?.name ?? '—'}
            />
            <InfoRow
              icon="card-outline"
              label="Pembayaran"
              value={trx.payment_method?.toUpperCase() ?? '—'}
              last
            />
          </View>

          {/* Payment Proof */}
          {trx.payment_proof && (
            <>
              <Text style={styles.sectionTitle}>Bukti Pembayaran</Text>
              <View style={styles.proofCard}>
                <Image
                  source={{ uri: trx.payment_proof }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.navy },
  heroCard: {
    backgroundColor: Colors.navy, marginHorizontal: 20,
    borderRadius: 24, padding: 22, marginBottom: 24,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  invoiceCode: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  invoiceDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  heroTotal: { fontSize: 32, fontWeight: '800', color: Colors.white },
  heroTotalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.navy, marginBottom: 10 },
  timelineCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  timelineRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  timelineStep: { flex: 1, alignItems: 'center' },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  timelineLine: { width: 2, height: 12 },
  timelineLabel: {
    fontSize: 9, textAlign: 'center', marginTop: 6,
    color: Colors.textMuted, fontWeight: '500', textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 20, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.navy },
  proofCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  proofImage: { width: '100%', height: 220 },
});