import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import { t } from '../utils/i18n';

const SETTINGS_KEY = 'profileSettings';

const ParametresScreen = ({ navigation }) => {
  const { language } = useContext(LanguageContext);
  const isArabic = language === 'ar';
  const [settings, setSettings] = useState({
    notifications: true,
    sounds: true,
    vibrations: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch (error) {
        // Keep defaults if storage fails.
      }
    };
    load();
  }, []);

  const save = async (next) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (error) {
      // Keep UI responsive if persistence fails.
    }
  };

  const toggle = (key) => save({ ...settings, [key]: !settings[key] });

  return (
    <SafeAreaView style={[styles.safe, isArabic && styles.rtlDirection]}>
      <View style={[styles.header, isArabic && styles.rowReverse]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backBtn}>
          <Text style={styles.backText}>{isArabic ? '→ رجوع' : '← Zurück'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isArabic && styles.rtlText]}>{t(language, 'settings')}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.container}>
        {[
          { key: 'notifications', label: `🔔 ${t(language, 'notifications')}` },
          { key: 'sounds', label: `🔊 ${t(language, 'sounds')}` },
          { key: 'vibrations', label: `📳 ${t(language, 'vibrations')}` },
        ].map((item) => (
          <View key={item.key} style={[styles.row, isArabic && styles.rowReverse]}>
            <Text style={[styles.label, isArabic && styles.rtlText]}>{item.label}</Text>
            <Switch
              value={settings[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: '#444', true: '#c9a02a' }}
              thumbColor={settings[item.key] ? '#0d1f0f' : '#ddd'}
            />
          </View>
        ))}

        <View style={[styles.row, styles.lockedRow, isArabic && styles.rowReverse]}>
          <Text style={[styles.label, isArabic && styles.rtlText]}>🌙 {t(language, 'darkTheme')}</Text>
          <Text style={styles.lockedText}>On</Text>
        </View>
      </View>
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: COLORS.textLight, fontSize: 15, fontWeight: '600' },
  lockedRow: { opacity: 0.9 },
  lockedText: { color: '#a0a0a0' },
});

export default ParametresScreen;
