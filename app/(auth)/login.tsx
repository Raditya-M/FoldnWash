import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, Animated, Dimensions, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ENDPOINTS } from '../../constants/api';
import { Storage } from '../../utils/storage';
import { api } from '../../utils/apiHelper';
import ToastNotification from '../../components/ToastNotification';
import CustomButton from '../../components/CustomButton';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastState { visible: boolean; message: string; type: ToastType; }

const { height } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  // DIUBAH: Mengubah state 'login' menjadi 'name'
  const [name, setName] = useState<string>('');
  const [password, setPassword]         = useState<string>('');
  const [showPass, setShowPass]         = useState<boolean>(false);
  const [loading, setLoading]           = useState<boolean>(false);
  const [nameFocused, setNameFocused]   = useState<boolean>(false);
  const [passFocused, setPassFocused]   = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  function showToast(message: string, type: ToastType = 'error') {
    setToast({ visible: true, message, type });
  }

  async function handleLogin() {
    // DIUBAH: Validasi menggunakan 'name'
    if (!name.trim() || !password.trim()) {
      showToast('Nama dan password wajib diisi', 'warning');
      return;
    }
    setLoading(true);
    try {
      // DIUBAH: Payload mengirimkan 'name' ke API backend
      const res = await api.post(ENDPOINTS.login, {
        name: name.trim(),
        password: password.trim(),
      });
      const token = res.token ?? res.data?.token;
      const user  = res.user  ?? res.data?.user ?? {};
      if (!token) throw new Error('Token tidak ditemukan');
      await Storage.setToken(token);
      await Storage.setUser(user);
      router.replace('/(tabs)/dashboard' as any);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Login gagal', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ToastNotification
        visible={toast.visible} message={toast.message} type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* ── Tosca background full screen ── */}
      <View style={styles.toscaBg}>
        {/* Contour rings */}
        {[...Array(8)].map((_, i) => (
          <View key={i} style={[styles.contour, {
            width:  80 + i * 65,
            height: 80 + i * 65,
            top:  height * 0.02 - i * 8,
            right: -30 + i * 8,
            opacity: 0.13,
          }]} />
        ))}

        {/* Welcome text */}
        <Animated.View style={[styles.welcomeWrap, { opacity: fadeAnim }]}>
          <Text style={styles.welcomeTitle}>Selamat Datang</Text>
          <Text style={styles.welcomeSub}>Masuk untuk kelola laundry kamu</Text>
        </Animated.View>
      </View>

      {/* ── White card yang overlap ke atas (wave effect) ── */}
      <KeyboardAvoidingView
        style={styles.cardOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formScroll}
          >
            <Text style={styles.signInTitle}>Masuk</Text>
            <View style={styles.signInUnderline} />

            {/* Nama */}
            <Text style={styles.fieldLabel}>Nama</Text>

            <View style={[styles.inputRow, nameFocused && styles.inputRowFocused]}>
              <Ionicons
                name="person-outline"
                size={16}
                color={nameFocused ? Colors.primary : Colors.gray400}
                style={styles.inputIcon}
              />

              <View style={styles.inputDivider} />

              <TextInput
                style={styles.textInput}
                value={name} // DIUBAH: value diarahkan ke state name
                onChangeText={setName} // DIUBAH: menggunakan setter setName
                placeholder="Masukkan nama"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
              <Ionicons
                name="lock-closed-outline" size={16}
                color={passFocused ? Colors.primary : Colors.gray400}
                style={styles.inputIcon}
              />
              <View style={styles.inputDivider} />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={password}
                onChangeText={(text) => setPassword(text.trim())}
                placeholder="Masukkan password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={16} color={Colors.gray400}
                />
              </TouchableOpacity>
            </View>

            {/* Button */}
            <CustomButton
              title="Masuk"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  /* ── Tosca area ── */
  toscaBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: height * 0.48,
  },
  contour: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  welcomeWrap: {},
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },

  /* ── White card ── */
  cardOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.62,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  formScroll: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },

  /* ── Form ── */
  signInTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
  },
  signInUnderline: {
    width: 40,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    marginBottom: 24,
    paddingBottom: 10,
  },
  inputRowFocused: {
    borderBottomColor: Colors.primary,
  },
  inputIcon: { marginRight: 10 },
  inputDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  loginBtn: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});