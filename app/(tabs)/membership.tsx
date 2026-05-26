import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../utils/apiHelper";
import { Storage } from "../../utils/storage";
import ToastNotification from "../../components/ToastNotification";

const { width } = Dimensions.get("window");

type ToastType = "success" | "error" | "warning" | "info";
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface User {
  name?: string;
  username?: string;
  is_member?: boolean;
  membership_expired_at?: string;
  remaining_days?: number;
}

interface BenefitProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  delay: number;
}

function BenefitRow({ icon, title, subtitle, color, bg, delay }: BenefitProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        delay,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.benefitRow,
        { opacity: anim, transform: [{ translateX: slide }] },
      ]}
    >
      <View style={[styles.benefitIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.benefitTextWrap}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitSub}>{subtitle}</Text>
      </View>
      <View style={[styles.benefitCheck, { backgroundColor: bg }]}>
        <Ionicons name="checkmark" size={12} color={color} />
      </View>
    </Animated.View>
  );
}

export default function MembershipPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  function showToast(msg: string, type: ToastType = "error") {
    setToast({ visible: true, message: msg, type });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      // Coba dari API dulu
      const res = await api.get("/profile");
      const userData: User = res.data ?? res;
      setUser(userData);
      animateIn(userData.remaining_days ?? 0);
    } catch {
      // Fallback ke storage
      try {
        const saved = (await Storage.getUser()) as User | null;
        setUser(saved);
        animateIn(saved?.remaining_days ?? 0);
      } catch (e: unknown) {
        showToast("Gagal memuat data", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  function animateIn(remaining: number) {
    const ratio = Math.min(remaining / 30, 1);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: ratio,
        duration: 1200,
        delay: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }

  function formatExpired(dateStr?: string): string {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  function getRemainingDays(dateStr?: string): number {
    if (!dateStr) return 0;
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / 86400000,
    );
    return Math.max(diff, 0);
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const remaining =
    user?.remaining_days ?? getRemainingDays(user?.membership_expired_at);
  const isActive = (user?.is_member ?? false) && remaining > 0;

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat data membership...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Page Header ── */}
        <Animated.View style={[styles.pageHeader, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.pageTitle}>Membership</Text>
            <Text style={styles.pageSub}>Status & keuntungan akun kamu</Text>
          </View>
          <TouchableOpacity onPress={loadProfile} style={styles.reloadBtn}>
            <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Membership Card ── */}
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={isActive ? ["#0FAAB2", "#1C3F60"] : ["#64748B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Decorative blobs */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={[styles.blob3, { opacity: isActive ? 0.12 : 0.06 }]} />

            {/* Top row */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardBrandRow}>
                <Text style={styles.cardBrandName}>Fold & Wash</Text>
              </View>
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: isActive
                      ? "rgba(74,222,128,0.2)"
                      : "rgba(248,113,113,0.2)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isActive ? "#4ade80" : "#f87171" },
                  ]}
                />
                <Text
                  style={[
                    styles.activeBadgeText,
                    { color: isActive ? "#4ade80" : "#f87171" },
                  ]}
                >
                  {isActive ? "AKTIF" : "HABIS"}
                </Text>
              </View>
            </View>

            {/* User info */}
            <View style={styles.cardUserSection}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View>
                <Text style={styles.cardName}>{user?.name ?? "—"}</Text>
                <Text style={styles.cardUsername}>
                  @{user?.username ?? "—"}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Expired & Days */}
            <View style={styles.cardInfoRow}>
              <View style={styles.cardInfoItem}>
                <Text style={styles.cardInfoLabel}>Berlaku Hingga</Text>
                <Text style={styles.cardInfoValue}>
                  {formatExpired(user?.membership_expired_at)}
                </Text>
              </View>
              <View style={styles.cardInfoDivider} />
              <View style={[styles.cardInfoItem, { alignItems: "flex-end" }]}>
                <Text style={styles.cardInfoLabel}>Sisa Masa Aktif</Text>
                <View style={styles.daysWrap}>
                  <Text style={styles.daysNumber}>{remaining}</Text>
                  <Text style={styles.daysUnit}> hari</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            {isActive && (
              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[styles.progressFill, { width: progressWidth }]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Masa aktif</Text>
                  <Text style={styles.progressLabel}>
                    {remaining} hari
                  </Text>
                </View>
              </View>
            )}

            {/* Card number decoration */}
            <View style={styles.cardChipRow}>
              <View style={styles.cardChip}>
                <View style={styles.cardChipInner} />
              </View>
              <Text style={styles.cardNumber}>
                •••• •••• ••••
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Status Info Strip ── */}
        <Animated.View style={[styles.stripWrap, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={isActive ? ["#E0F7F8", "#F0FFFE"] : ["#FEE2E2", "#FFF1F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.strip}
          >
            <Ionicons
              name={isActive ? "shield-checkmark" : "alert-circle"}
              size={18}
              color={isActive ? Colors.primary : Colors.error}
            />
            <Text
              style={[
                styles.stripText,
                { color: isActive ? Colors.primary : Colors.error },
              ]}
            >
              {isActive
                ? `Membership aktif hingga ${formatExpired(user?.membership_expired_at)}`
                : "Membership kamu sudah tidak aktif. Lakukan transaksi untuk mengaktifkan kembali."}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Benefits ── */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Keuntungan Member</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>4 benefit</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <BenefitRow
              icon="add-circle-outline"
              title="+5 Hari per Transaksi"
              subtitle="Masa aktif bertambah setiap laundry berhasil"
              color="#0FAAB2"
              bg="#E0F7F8"
              delay={100}
            />
            <View style={styles.benefitDivider} />
            <BenefitRow
              icon="flash-outline"
              title="Prioritas Antrian"
              subtitle="Laundry kamu diproses lebih cepat dari non-member"
              color="#8B5CF6"
              bg="#EDE9FE"
              delay={200}
            />
            <View style={styles.benefitDivider} />
            <BenefitRow
              icon="pricetag-outline"
              title="Promo Khusus Member"
              subtitle="Akses diskon & penawaran eksklusif setiap bulan"
              color="#F59E0B"
              bg="#FEF3C7"
              delay={300}
            />
            <View style={styles.benefitDivider} />
            <BenefitRow
              icon="bar-chart-outline"
              title="Riwayat Lengkap"
              subtitle="Pantau semua aktivitas transaksi & membership"
              color="#10B981"
              bg="#D1FAE5"
              delay={400}
            />
          </View>
        </Animated.View>

        {/* ── How It Works ── */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Cara Kerja Membership</Text>
          <View style={styles.howCard}>
            {[
              {
                step: "1",
                text: "Daftar & buat akun customer",
                icon: "person-add-outline",
              },
              {
                step: "2",
                text: "Membership aktif otomatis 30 hari",
                icon: "card-outline",
              },
              {
                step: "3",
                text: "Setiap transaksi = +5 hari masa aktif",
                icon: "add-circle-outline",
              },
              {
                step: "4",
                text: "Nikmati semua keuntungan member",
                icon: "star-outline",
              },
            ].map((item, index, arr) => (
              <View key={item.step}>
                <View style={styles.howItem}>
                  <LinearGradient
                    colors={["#0FAAB2", "#1C3F60"]}
                    style={styles.howStep}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={14}
                      color={Colors.white}
                    />
                  </LinearGradient>
                  <Text style={styles.howText}>{item.text}</Text>
                </View>
                {index < arr.length - 1 && <View style={styles.howLine} />}
              </View>
            ))}
          </View>
        </Animated.View>

        <Text style={styles.footnote}>
          Membership diperpanjang otomatis setiap transaksi berhasil diproses.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: { fontSize: 13, color: Colors.textSecondary },

  scroll: { paddingBottom: 48 },

  /* Header */
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.navy,
    letterSpacing: -0.3,
  },
  pageSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Card */
  cardWrap: {
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 10,
    left: -30,
  },
  blob3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: 80,
    right: 60,
  },

  /* Card top */
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardBrandIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBrandName: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  /* Card user */
  cardUserSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cardAvatarText: { fontSize: 22, fontWeight: "800", color: Colors.white },
  cardName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 2,
  },
  cardUsername: { fontSize: 13, color: "rgba(255,255,255,0.65)" },

  /* Card divider */
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 18,
  },

  /* Card info */
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardInfoItem: { flex: 1 },
  cardInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 16,
  },
  cardInfoLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cardInfoValue: { fontSize: 14, fontWeight: "700", color: Colors.white },
  daysWrap: { flexDirection: "row", alignItems: "baseline" },
  daysNumber: { fontSize: 26, fontWeight: "800", color: Colors.white },
  daysUnit: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  /* Progress */
  progressSection: { marginBottom: 20 },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 999,
  },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },

  /* Card chip */
  cardChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardChip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardChipInner: {
    width: 24,
    height: 16,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardNumber: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    letterSpacing: 1,
  },

  /* Strip */
  stripWrap: { marginHorizontal: 20, marginBottom: 20 },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stripText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 18 },

  /* Section */
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.navy },
  sectionBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },

  /* Benefit card */
  benefitCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  benefitIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTextWrap: { flex: 1 },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 2,
  },
  benefitSub: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  benefitCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  /* How it works */
  howCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  howItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  howStep: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  howText: { fontSize: 13, color: Colors.navy, fontWeight: "600", flex: 1 },
  howLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 15,
    marginVertical: 4,
    borderRadius: 999,
  },

  /* Footnote */
  footnote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 32,
    marginTop: 4,
  },
});
