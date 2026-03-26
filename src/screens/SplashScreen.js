import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../utils/constants';
import { EASE, T } from '../utils/animation';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const leftCardAnim = useRef(new Animated.Value(-90)).current;
  const rightCardAnim = useRef(new Animated.Value(90)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const outroFade = useRef(new Animated.Value(1)).current;
  const fadeOutRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(leftCardAnim, { toValue: 0, duration: T.normal, easing: EASE, useNativeDriver: true }),
        Animated.timing(rightCardAnim, { toValue: 0, duration: T.normal, easing: EASE, useNativeDriver: true }),
        Animated.timing(progressAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
      ]),
    ]);
    intro.start();

    timerRef.current = setTimeout(() => {
      fadeOutRef.current = Animated.timing(outroFade, {
        toValue: 0,
        duration: T.slow,
        easing: EASE,
        useNativeDriver: true,
      });
      fadeOutRef.current.start(() => navigation.replace('Main'));
    }, 2600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      intro.stop();
      fadeOutRef.current?.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: outroFade }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.arabicLogo}>رامي تونسي</Text>
        <Text style={styles.subtitle}>Rami Tounsi Café</Text>
        <View style={styles.divider} />
        <View style={styles.cardsRow}>
          <Animated.Text style={[styles.cardIcon, { transform: [{ translateX: leftCardAnim }] }]}>🂠</Animated.Text>
          <Animated.Text style={[styles.cardIcon, { transform: [{ translateX: rightCardAnim }] }]}>🂠</Animated.Text>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.loading, { opacity: fadeAnim }]}>
        Chargement...
      </Animated.Text>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  arabicLogo: {
    fontSize: 52,
    fontWeight: 'bold',
    color: COLORS.gold,
    textShadowColor: 'rgba(201,160,42,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textLight,
    letterSpacing: 3,
    fontWeight: '300',
    marginBottom: 20,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: COLORS.gold,
    opacity: 0.5,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 26,
    color: COLORS.gold,
    letterSpacing: 10,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 6,
  },
  cardIcon: {
    fontSize: 36,
    color: COLORS.gold,
  },
  loading: {
    position: 'absolute',
    bottom: 88,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 58,
    width: '70%',
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(240,240,240,0.18)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,160,42,0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
});

export default SplashScreen;
