import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import StatusBadge from './StatusBadge';
import { formatRupiah, formatDate, formatWeight } from '../utils/formatters';

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
  totalPrice?: number | string; // Tambahan antisipasi jika properti dari API berupa camelCase
  created_at?: string;
}

interface TransactionCardProps {
  item: Transaction;
  onPress: () => void;
}

export default function TransactionCard({ item, onPress }: TransactionCardProps) {
  // Ambil nilai harga dari total_price atau totalPrice, jika keduanya kosong default ke 0
  const rawPrice = item.total_price ?? item.totalPrice ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.invoiceWrap}>
          <View style={styles.iconBox}>
            <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.invoice}>{item.invoice_code ?? `#${item.id}`}</Text>
        </View>
        <StatusBadge status={item.status ?? 'antrian'} size="sm" />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Info */}
      <View style={styles.row}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Layanan</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.service?.service_name ?? '—'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Berat/Jumlah</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {formatWeight(item.weight, item.service?.unit)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Pembayaran</Text>
          <Text style={[styles.infoValue, { textTransform: 'capitalize' }]} numberOfLines={1}>
            {item.payment_method ?? '—'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.date} numberOfLines={1}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
          {'  '}{formatDate(item.created_at)}
        </Text>
        <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
          {formatRupiah(rawPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20, 
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, 
    shadowRadius: 12, 
    elevation: 3,
    borderWidth: 1, 
    borderColor: Colors.border,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  invoiceWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  iconBox: {
    width: 30, 
    height: 30, 
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  invoice: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: Colors.navy 
  },
  divider: { 
    height: 1, 
    backgroundColor: Colors.border, 
    marginVertical: 12 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
    gap: 8 // Memberikan jarak aman antar kolom info
  },
  infoItem: { 
    flex: 1 // Membagi rata porsi space baris info agar adil
  },
  infoLabel: { 
    fontSize: 11, 
    color: Colors.textMuted, 
    marginBottom: 3, 
    fontWeight: '500' 
  },
  infoValue: { 
    fontSize: 13, 
    color: Colors.text, 
    fontWeight: '600' 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: 10
  },
  date: { 
    flex: 1, // Agar area teks tanggal mengalah jika harga terlalu panjang
    fontSize: 12, 
    color: Colors.textMuted 
  },
  total: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Colors.primary,
    textAlign: 'right'
  },
});