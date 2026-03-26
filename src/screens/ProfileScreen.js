import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/constants';
import { getInitials, formatDinar } from '../utils/helpers';
import { triggerTapHaptic } from '../utils/haptics';

const ProfileScreen = () => {
  const [name, setName] = useState('Joueur#1234');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [balance, setBalance] = useState(50.0);
  const [language, setLanguage] = useState('FR');
  const USERNAME_KEY = 'username';

  const stats = {
    gamesPlayed: 42,
    gamesWon: 18,
    winRate: '42.9',
    totalEarned: 73.5,
  };

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const saved = await AsyncStorage.getItem(USERNAME_KEY);
        if (saved && saved.trim()) setName(saved.trim());
      } catch (error) {
        // Ignore storage read issues.
      }
    };
    loadUsername();
  }, []);

  const saveName = async () => {
    await triggerTapHaptic();
    if (tempName.trim().length < 2) {
      Alert.alert('Nom trop court', 'Minimum 2 caractères');
      return;
    }
    const trimmedName = tempName.trim();
    setName(trimmedName);
    try {
      await AsyncStorage.setItem(USERNAME_KEY, trimmedName);
    } catch (error) {
      // Keep updated name in UI even if persistence fails.
    }
    setEditingName(false);
  };

  const handleTopUp = async () => {
    await triggerTapHaptic();
    Alert.alert(
      'Recharger',
      'Choisissez un montant:',
      [
        { text: '10 D', onPress: () => setBalance((b) => +(b + 10).toFixed(2)) },
        { text: '20 D', onPress: () => setBalance((b) => +(b + 20).toFixed(2)) },
        { text: '50 D', onPress: () => setBalance((b) => +(b + 50).toFixed(2)) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const StatBox = ({ label, value, sub }) => (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                maxLength={20}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingName(false)} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{name}</Text>
              <TouchableOpacity
                onPress={() => { setTempName(name); setEditingName(true); }}
                style={styles.editBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.memberId}>ID: rami_1234</Text>
        </View>

        {/* Balance */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Mon solde</Text>
            <Text style={styles.balanceAmount}>{formatDinar(balance)}</Text>
          </View>
          <TouchableOpacity style={styles.topUpBtn} onPress={handleTopUp} activeOpacity={0.85}>
            <Text style={styles.topUpText}>+ Recharger</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Parties jouées" value={stats.gamesPlayed} />
            <StatBox label="Victoires" value={stats.gamesWon} />
            <StatBox label="Taux victoire" value={`${stats.winRate}%`} />
            <StatBox label="Total gagné" value={formatDinar(stats.totalEarned)} />
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langue / اللغة</Text>
          <View style={styles.langRow}>
            {['FR', 'AR'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, language === lang && styles.langBtnActive]}
                onPress={async () => { await triggerTapHaptic(); setLanguage(lang); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                  {lang === 'FR' ? '🇫🇷 Français' : '🇹🇳 عربي'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          {[
            { icon: '📜', label: 'Historique des parties' },
            { icon: '🏆', label: 'Classement global' },
            { icon: '⚙️', label: 'Paramètres' },
            { icon: '🚪', label: 'Se déconnecter' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.85} onPress={triggerTapHaptic}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>RamiTounsi v1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.gold,
    marginBottom: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: COLORS.textLight, fontSize: 20, fontWeight: 'bold' },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 16 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameInput: {
    backgroundColor: COLORS.cardBackground,
    color: COLORS.textLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
    minWidth: 140,
  },
  saveBtn: {
    backgroundColor: COLORS.greenAccent,
    borderRadius: 8,
    padding: 8,
  },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold' },
  cancelBtn: {
    backgroundColor: '#c62828',
    borderRadius: 8,
    padding: 8,
  },
  cancelBtnText: { color: COLORS.white, fontWeight: 'bold' },
  memberId: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  balanceCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: { color: COLORS.textMuted, fontSize: 13 },
  balanceAmount: { color: COLORS.gold, fontSize: 28, fontWeight: 'bold' },
  topUpBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topUpText: { color: COLORS.black, fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flex: 1,
    minWidth: '44%',
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statValue: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold' },
  statSub: { color: COLORS.textMuted, fontSize: 10 },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  langBtnActive: { borderColor: COLORS.gold, backgroundColor: '#1a3010' },
  langText: { color: COLORS.textMuted, fontSize: 15 },
  langTextActive: { color: COLORS.gold, fontWeight: 'bold' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e3d20',
    gap: 12,
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, color: COLORS.textLight, fontSize: 14 },
  menuChevron: { color: COLORS.textMuted, fontSize: 18 },
  version: { color: COLORS.textMuted, textAlign: 'center', fontSize: 11, marginTop: 10 },
});

export default ProfileScreen;
