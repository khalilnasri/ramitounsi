import React, { useContext } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import { t } from '../utils/i18n';

const MOCK_HISTORY = [
  { id: 'h1', date: '27/03/2026', room: 'Salle Hobby', rank: 1, delta: +1.5 },
  { id: 'h2', date: '26/03/2026', room: 'Salle 2', rank: 3, delta: -2 },
  { id: 'h3', date: '25/03/2026', room: 'Salle VIP', rank: 2, delta: +3.2 },
  { id: 'h4', date: '25/03/2026', room: 'Salle 1', rank: 4, delta: -1 },
];

const HistoriqueScreen = ({ navigation }) => {
  const { language } = useContext(LanguageContext);
  const isArabic = language === 'ar';
  return (
  <SafeAreaView style={[styles.safe, isArabic && styles.rtlDirection]}>
    <View style={[styles.header, isArabic && styles.rowReverse]}>
      <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
        <Text style={styles.backText}>{isArabic ? '→ رجوع' : '← Zurück'}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, isArabic && styles.rtlText]}>{t(language, 'history')}</Text>
      <View style={styles.spacer} />
    </View>

    <ScrollView contentContainerStyle={styles.container}>
      {MOCK_HISTORY.map((item) => (
        <View key={item.id} style={[styles.row, isArabic && styles.rowReverse]}>
          <Text style={[styles.date, isArabic && styles.rtlText]}>{item.date}</Text>
          <Text style={[styles.room, isArabic && styles.rtlText]}>{item.room}</Text>
          <Text style={styles.rank}>#{item.rank}</Text>
          <Text style={[styles.delta, item.delta >= 0 ? styles.plus : styles.minus]}>
            {item.delta >= 0 ? `+${item.delta.toFixed(2)} D` : `${item.delta.toFixed(2)} D`}
          </Text>
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
    justifyContent: 'space-between',
    shadowColor: '#c9a02a',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  date: { color: '#a0a0a0', fontSize: 12, width: 82 },
  room: { color: COLORS.textLight, flex: 1 },
  rank: { color: COLORS.gold, width: 40, textAlign: 'center', fontWeight: '700' },
  delta: { width: 70, textAlign: 'right', fontWeight: '700' },
  plus: { color: '#4caf50' },
  minus: { color: '#ff6666' },
});

export default HistoriqueScreen;
