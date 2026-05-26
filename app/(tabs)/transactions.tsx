import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { ENDPOINTS, BASE_URL } from '../../constants/api';
import { api } from '../../utils/apiHelper';
import { Storage } from '../../utils/storage';
import { formatRupiah } from '../../utils/formatters';
import TransactionCard from '../../components/TransactionCard';
import EmptyState from '../../components/EmptyState';
import { TransactionSkeleton } from '../../components/LoadingSkeleton';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import ToastNotification from '../../components/ToastNotification';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface Service {
  id: number;
  service_name: string;
  price: number | string;
  unit: string;
}

interface Transaction {
  id: number;
  invoice_code?: string;
  status?: string;
  service?: {
    service_name?: string;
    unit?: string;
  };
  weight?: number | string;
  payment_method?: string;
  total_price?: number | string;
  created_at?: string;
}

interface FormState {
  customer_id: string;
  service_id: string;
  weight: string;
  payment_method: string;
  proofFile: ImagePicker.ImagePickerAsset | null;
}

export default function Transactions() {
  const router = useRouter();
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [loading, setLoading]             = useState<boolean>(true);
  const [refreshing, setRefreshing]       = useState<boolean>(false);
  const [showModal, setShowModal]         = useState<boolean>(false);
  const [services, setServices]           = useState<Service[]>([]);
  const [saving, setSaving]               = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [toast, setToast]                 = useState<ToastState>({
    visible: false, message: '', type: 'info',
  });
  const [form, setForm] = useState<FormState>({
    customer_id: '',
    service_id: '',
    weight: '',
    payment_method: 'cash',
    proofFile: null,
  });

  function showToast(msg: string, type: ToastType = 'info') {
    setToast({ visible: true, message: msg, type });
  }

  function setF(key: keyof FormState) {
    return (val: string) => setForm(f => ({ ...f, [key]: val }));
  }

async function loadData() {
  try {
    const res = await api.get('/history');

    const trxData =
      res.data?.data ??
      res.data ??
      res ??
      [];

    const trxArray = Array.isArray(trxData)
      ? trxData
      : trxData.data ?? [];

    setTransactions(trxArray);

  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : 'Gagal memuat data';

    showToast(message, 'error');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}

  async function loadFormData() {
    try {
      const [svcRes] = await Promise.all([
        api.get('/services'),
      ]);
      setServices(svcRes.data?.data ?? svcRes.data ?? []);
    } catch (e: unknown) {}
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

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setForm(f => ({ ...f, proofFile: result.assets[0] }));
      showToast('Bukti pembayaran dipilih', 'success');
    }
  }

  const totalPrice =
    selectedService && form.weight
      ? Number(selectedService.price) * Number(form.weight)
      : 0;

  async function handleSave() {
    if (!form.service_id || !form.weight) {
      showToast('Layanan dan berat wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const token = await Storage.getToken();
      const fd = new FormData();
      if (form.customer_id) fd.append('customer_id', form.customer_id);
      fd.append('service_id', form.service_id);
      fd.append('weight', form.weight);
      fd.append('payment_method', form.payment_method);

      if (form.proofFile) {
        fd.append('payment_proof', {
          uri: form.proofFile.uri,
          type: 'image/jpeg',
          name: 'proof.jpg',
        } as any);
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.transactions}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal membuat transaksi');

      showToast('Transaksi berhasil dibuat', 'success');
      setShowModal(false);
      setForm({
        customer_id: '', service_id: '', weight: '',
        payment_method: 'cash', proofFile: null,
      });
      setSelectedService(null);
      loadData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal membuat transaksi';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

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
        <Text style={styles.headerTitle}>Transaksi</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          [1, 2, 3].map(i => <TransactionSkeleton key={i} />)
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            subtitle="Buat transaksi baru untuk mulai"
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
      </ScrollView>

      {/* Create Transaction Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: Colors.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buat Transaksi</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {/* Service Picker */}
            <Text style={styles.fieldLabel}>Pilih Layanan</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {services.map((s: Service) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setF('service_id')(String(s.id));
                    setSelectedService(s);
                  }}
                  style={[
                    styles.serviceChip,
                    form.service_id === String(s.id) && styles.serviceChipActive,
                  ]}
                >
                  <Text style={[
                    styles.serviceChipText,
                    form.service_id === String(s.id) && styles.serviceChipTextActive,
                  ]}>
                    {s.service_name}
                  </Text>
                  <Text style={[
                    styles.serviceChipPrice,
                    form.service_id === String(s.id) && { color: Colors.white },
                  ]}>
                    {`Rp ${Number(s.price).toLocaleString('id-ID')}/${s.unit}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <CustomInput
              label={selectedService?.unit === 'pcs' ? 'Jumlah (pcs)' : 'Berat (kg)'}
              value={form.weight}
              onChangeText={setF('weight')}
              placeholder={selectedService?.unit === 'pcs' ? 'Jumlah pcs' : 'Berat kg'}
              keyboardType="numeric"
              icon="scale-outline"
            />

            {totalPrice > 0 && (
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Estimasi Total</Text>
                <Text style={styles.totalValue}>
                  {`Rp ${totalPrice.toLocaleString('id-ID')}`}
                </Text>
              </View>
            )}

            {/* Payment Method */}
            <Text style={styles.fieldLabel}>Metode Pembayaran</Text>
            <View style={styles.payRow}>
              {(['cash', 'transfer'] as const).map(pm => (
                <TouchableOpacity
                  key={pm}
                  onPress={() => setF('payment_method')(pm)}
                  style={[
                    styles.payChip,
                    form.payment_method === pm && styles.payChipActive,
                  ]}
                >
                  <Ionicons
                    name={pm === 'cash' ? 'cash-outline' : 'card-outline'}
                    size={16}
                    color={form.payment_method === pm ? Colors.white : Colors.gray500}
                  />
                  <Text style={[
                    styles.payChipText,
                    form.payment_method === pm && { color: Colors.white },
                  ]}>
                    {pm.charAt(0).toUpperCase() + pm.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Proof Upload */}
            <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
              <Ionicons
                name={form.proofFile ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={22}
                color={form.proofFile ? Colors.success : Colors.primary}
              />
              <Text style={[
                styles.uploadText,
                form.proofFile && { color: Colors.success },
              ]}>
                {form.proofFile ? 'Bukti dipilih' : 'Upload Bukti Pembayaran (opsional)'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.navy },
  addBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  scroll: { padding: 20, paddingTop: 8 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.navy },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.navy, marginBottom: 10 },
  serviceChip: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    padding: 12, marginRight: 10, minWidth: 110, backgroundColor: Colors.white,
  },
  serviceChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  serviceChipText: { fontSize: 13, fontWeight: '600', color: Colors.navy, marginBottom: 2 },
  serviceChipTextActive: { color: Colors.white },
  serviceChipPrice: { fontSize: 11, color: Colors.textSecondary },
  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  payRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  payChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  payChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  payChipText: { fontSize: 14, fontWeight: '600', color: Colors.gray500 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 14, padding: 16, marginBottom: 20, backgroundColor: Colors.white,
  },
  uploadText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
});