import React, { useContext } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import { t } from '../utils/i18n';

const BASE_PLAYERS = Array.from({ length: 10 }).map((_, i) => ({
  id: `p-${i + 1}`,
  rank: i + 1,
  name: i === 5 ? 'Joueur#1234' : `Player ${i + 1}`,
  points: 1450 - (i * 60),
  wins: 52 - (i * 3),
}));

const medalColor = (rank) => {
  if (rank === 1) return '#c9a02a';
  if (rank === 2) return '#c0c0c0';
  if (rank === 3) return '#cd7f32';
  return '#2a4a2a';
};

const ClassementScreen = ({ navigation }) => {
  const { userId } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const isArabic = language === 'ar';
  const players = BASE_PLAYERS.map((p, i) => (i === 5 ? { ...p, id: userId || p.id, name: 'Joueur#1234' } : p));
  return (
  <SafeAreaView style={[styles.safe, isArabic && styles.rtlDirection]}>
    <View style={[styles.header, isArabic && styles.rowReverse]}>
      <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
        <Text style={styles.backText}>{isArabic ? '→ رجوع' : '← Zurück'}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, isArabic && styles.rtlText]}>{t(language, 'ranking')}</Text>
      <View style={styles.spacer} />
    </View>
    <ScrollView contentContainerStyle={styles.container}>
      {players.map((p) => (
        <View
          key={p.id}
          style={[styles.row, isArabic && styles.rowReverse, p.id === userId && styles.myRow]}
        >
          <Text style={[styles.rank, { color: medalColor(p.rank) }]}>#{p.rank}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{p.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, isArabic && styles.rtlText]}>{p.name}</Text>
          <Text style={styles.points}>{p.points} pts</Text>
          <Text style={styles.wins}>{p.wins} W</Text>
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3d20',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { padding: 6 },
  backText: { color: COLORS.gold, fontWeight: '700' },
  title: { color: COLORS.textLight, fontWeight: '700', fontSize: 16 },
  spacer: { width: 48 },
  container: { padding: 12, gap: 10 },
  rtlDirection: { direction: 'rtl' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  rowReverse: { flexDirection: 'row-reverse' },
  row: {
    backgroundColor: '#0a1a0b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3d20',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myRow: {
    borderColor: COLORS.gold,
    shadowColor: '#c9a02a',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  rank: { width: 32, textAlign: 'center', fontWeight: '800' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.textLight, fontSize: 11, fontWeight: '700' },
  name: { flex: 1, color: COLORS.textLight, fontWeight: '600' },
  points: { color: COLORS.gold, width: 82, textAlign: 'right', fontWeight: '700' },
  wins: { color: '#7fd37f', width: 46, textAlign: 'right' },
});

export default ClassementScreen;
