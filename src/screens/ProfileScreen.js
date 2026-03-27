import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../firebase';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import { t } from '../utils/i18n';
import { getInitials, formatDinar } from '../utils/helpers';
import { triggerTapHaptic } from '../utils/haptics';

const USERNAME_KEY = 'username';
const BALANCE_KEY = 'balance';
const LANGUAGE_KEY = 'language';

const ProfileScreen = ({ navigation }) => {
  const { language, setLanguage } = useContext(LanguageContext);
  const [name, setName] = useState('Joueur#1234');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [balance, setBalance] = useState(50);
  const [showRecharge, setShowRecharge] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const langFade = useRef(new Animated.Value(1)).current;
  const closeTimerRef = useRef(null);
  const isArabic = language === 'ar';

  const stats = useMemo(() => ({
    gamesPlayed: 42,
    gamesWon: 18,
    winRate: '42.9%',
    totalEarned: formatDinar(73.5),
  }), []);

  const loadProfile = useCallback(async () => {
    try {
      const [savedName, savedBalance] = await Promise.all([
        AsyncStorage.getItem(USERNAME_KEY),
        AsyncStorage.getItem(BALANCE_KEY),
      ]);
      if (savedName && savedName.trim()) setName(savedName.trim());
      if (savedBalance) setBalance(parseFloat(savedBalance));
    } catch (error) {
      // Keep fallback values.
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfile();
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [loadProfile]));

  const saveName = async () => {
    await triggerTapHaptic();
    const trimmedName = tempName.trim();
    if (trimmedName.length < 2) return;
    setName(trimmedName);
    setEditingName(false);
    try {
      await AsyncStorage.setItem(USERNAME_KEY, trimmedName);
    } catch (error) {
      // UI already updated.
    }
  };

  const switchLanguage = async (nextLanguage) => {
    if (nextLanguage === language) return;
    await triggerTapHaptic();
    Animated.sequence([
      Animated.timing(langFade, { toValue: 0.35, duration: 120, useNativeDriver: true }),
      Animated.timing(langFade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setLanguage(nextLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
    } catch (error) {
      // Keep runtime state.
    }
  };

  const applyTopUp = async (amount) => {
    await triggerTapHaptic();
    const next = +(balance + amount).toFixed(2);
    setBalance(next);
    setSuccessMessage(`✅ ${amount} ${t(language, 'charged')}`);
    try {
      await AsyncStorage.setItem(BALANCE_KEY, String(next));
    } catch (error) {
      // Demo mode only.
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setShowRecharge(false);
      setSuccessMessage('');
    }, 1500);
  };

  const onLogout = () => {
    Alert.alert(
      t(language, 'logout'),
      t(language, 'confirmLogout'),
      [
        { text: t(language, 'cancel'), style: 'cancel' },
        {
          text: t(language, 'disconnect'),
          style: 'destructive',
          onPress: async () => {
            await triggerTapHaptic();
            try {
              await signOut(auth);
            } catch (error) {
              // Continue to reset app state.
            }
            await AsyncStorage.multiRemove([USERNAME_KEY, BALANCE_KEY, LANGUAGE_KEY, 'rulesShown', 'profileSettings']);
            navigation.getParent()?.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Splash' }],
            });
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: '📋', key: 'history', color: '#4a9eff', onPress: () => navigation.navigate('Historique') },
    { icon: '🏆', key: 'ranking', color: '#c9a02a', onPress: () => navigation.navigate('ClassementGlobal') },
    { icon: '⚙️', key: 'settings', color: '#888888', onPress: () => navigation.navigate('Parametres') },
    { icon: '🚪', key: 'logout', color: '#ff4444', onPress: onLogout },
  ];

  const rtlRow = isArabic ? styles.rowReverse : null;
  const textDir = isArabic ? styles.rtlText : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.container, isArabic && styles.rtlDirection]}>
        <LinearGradient colors={['#0d1f0f', '#1a3a1a']} style={styles.topGradient}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
          </View>

          {editingName ? (
            <View style={[styles.nameEditRow, rtlRow]}>
              <TextInput
                style={[styles.nameInput, textDir]}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{t(language, 'save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.nameRow, rtlRow]}
              activeOpacity={0.85}
              onPress={() => { setTempName(name); setEditingName(true); }}
            >
              <Text style={[styles.userName, textDir]}>{name}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.memberId, textDir]}>ID: rami_1234</Text>
        </LinearGradient>

        <Animated.View style={{ opacity: langFade }}>
          <View style={[styles.balanceCard, rtlRow]}>
            <View style={styles.balanceLeftLine} />
            <View style={styles.balanceContent}>
              <Text style={[styles.balanceLabel, textDir]}>{t(language, 'balance')}</Text>
              <Text style={[styles.balanceAmount, textDir]}>🪙 {formatDinar(balance)}</Text>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => setShowRecharge(true)} activeOpacity={0.85}>
              <Text style={styles.topUpText}>{t(language, 'recharge')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, textDir]}>{t(language, 'profile')}</Text>
            <View style={[styles.statsGrid, rtlRow]}>
              {[
                ['🎮', t(language, 'parties'), stats.gamesPlayed],
                ['🏆', t(language, 'victories'), stats.gamesWon],
                ['📈', t(language, 'winRate'), stats.winRate],
                ['💰', t(language, 'totalWon'), stats.totalEarned],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statIcon}>{icon}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={[styles.statLabel, textDir]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, textDir]}>{t(language, 'language')}</Text>
            <View style={[styles.langRow, rtlRow]}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'fr' ? styles.langBtnActive : styles.langBtnInactive]}
                onPress={() => switchLanguage('fr')}
                activeOpacity={0.85}
              >
                <Text style={[styles.langText, language === 'fr' && styles.langTextActive]}>FR Français</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'ar' ? styles.langBtnActive : styles.langBtnInactive]}
                onPress={() => switchLanguage('ar')}
                activeOpacity={0.85}
              >
                <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>AR عربي</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, textDir]}>{t(language, 'settings')}</Text>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, rtlRow, index < menuItems.length - 1 && styles.menuSeparator]}
                  activeOpacity={0.85}
                  onPress={item.onPress}
                >
                  <Text style={[styles.menuIcon, { color: item.color }]}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, textDir]}>{t(language, item.key)}</Text>
                  <Text style={styles.menuChevron}>{isArabic ? '‹' : '›'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <Text style={styles.version}>RamiTounsi v1.0.0</Text>
      </ScrollView>

      <Modal visible={showRecharge} transparent animationType="fade" onRequestClose={() => setShowRecharge(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, textDir]}>{t(language, 'recharge')}</Text>
            {[5, 10, 20, 50].map((amount) => (
              <TouchableOpacity key={amount} style={styles.amountBtn} onPress={() => applyTopUp(amount)} activeOpacity={0.85}>
                <Text style={styles.amountText}>+ {amount} Dinar</Text>
              </TouchableOpacity>
            ))}
            {!!successMessage && <Text style={[styles.successText, textDir]}>{successMessage}</Text>}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowRecharge(false)} activeOpacity={0.85}>
              <Text style={styles.cancelModalText}>{t(language, 'cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 24 },
  rtlDirection: { direction: 'rtl' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  rowReverse: { flexDirection: 'row-reverse' },
  topGradient: { paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', marginBottom: 10 },
  avatarGlow: {
    shadowColor: '#c9a02a',
    shadowRadius: 15,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#c9a02a',
  },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  userName: { color: COLORS.textLight, fontSize: 23, fontWeight: 'bold' },
  editIcon: { fontSize: 16 },
  memberId: { color: '#888888', fontSize: 12, marginTop: 4 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  nameInput: {
    backgroundColor: COLORS.cardBackground,
    color: COLORS.textLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
    minWidth: 180,
  },
  saveBtn: { backgroundColor: '#c9a02a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtnText: { color: '#111', fontWeight: 'bold' },
  balanceCard: {
    marginHorizontal: 10,
    marginBottom: 18,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 14,
    overflow: 'hidden',
  },
  balanceLeftLine: { width: 4, alignSelf: 'stretch', backgroundColor: '#c9a02a' },
  balanceContent: { flex: 1, paddingHorizontal: 12 },
  balanceLabel: { color: COLORS.textMuted, fontSize: 13 },
  balanceAmount: { color: COLORS.gold, fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  topUpBtn: { backgroundColor: COLORS.gold, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  topUpText: { color: '#111', fontWeight: 'bold' },
  section: { marginBottom: 16, paddingHorizontal: 10 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    width: '49%',
    backgroundColor: '#0a1a0b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statIcon: { fontSize: 18, marginBottom: 3 },
  statValue: { color: '#c9a02a', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  langBtnActive: { backgroundColor: '#c9a02a', borderColor: '#c9a02a' },
  langBtnInactive: { backgroundColor: 'transparent', borderColor: '#c9a02a' },
  langText: { color: '#c9a02a', fontWeight: '700' },
  langTextActive: { color: '#111' },
  menuList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3d20',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  menuSeparator: { borderBottomWidth: 1, borderBottomColor: '#1e3d20' },
  menuIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, color: COLORS.textLight, fontWeight: '600' },
  menuChevron: { color: '#789278', fontSize: 18 },
  version: { color: '#6f7f6f', textAlign: 'center', fontSize: 10, marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0d1f0f',
    borderWidth: 1,
    borderColor: '#c9a02a',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  modalTitle: { color: '#f0f0f0', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  amountBtn: { backgroundColor: '#c9a02a', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  amountText: { color: '#111', fontWeight: '700' },
  successText: { color: '#8cf58c', textAlign: 'center', marginTop: 6, fontWeight: '600' },
  cancelModalBtn: { marginTop: 4, backgroundColor: '#263226', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelModalText: { color: '#d4d4d4', fontWeight: '600' },
});

export default ProfileScreen;
