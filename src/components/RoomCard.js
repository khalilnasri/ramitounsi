import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../utils/constants';
import { formatDinar } from '../utils/helpers';
import { triggerTapHaptic } from '../utils/haptics';
import { EASE, T } from '../utils/animation';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlayerDots = ({ occupied, total }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: EASE, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: EASE, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            i < occupied ? styles.dotOccupied : styles.dotFree,
            i < occupied && {
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const RoomCard = ({ room, occupiedCount = 0, onJoin, gameStarted = false }) => {
  const isFull = occupiedCount >= room.maxPlayers;
  const isRunning = Boolean(gameStarted);
  const isDisabled = isFull || isRunning;
  const buttonLabel = isRunning ? 'Läuft...' : (isFull ? 'Voll' : 'Jouer!');
  const pressScale = useRef(new Animated.Value(1)).current;
  const tapAnimRef = useRef(null);

  const animatePress = () => {
    tapAnimRef.current = Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.97, duration: T.tap, easing: EASE, useNativeDriver: true }),
      Animated.timing(pressScale, { toValue: 1, duration: T.tap, easing: EASE, useNativeDriver: true }),
    ]);
    tapAnimRef.current.start();
  };

  useEffect(() => () => tapAnimRef.current?.stop(), []);

  const onJoinPress = async () => {
    if (isDisabled || !onJoin) return;
    await triggerTapHaptic();
    animatePress();
    setTimeout(() => onJoin(room), T.tap);
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, { transform: [{ scale: pressScale }] }]}
      activeOpacity={0.85}
      onPress={onJoinPress}
      disabled={isDisabled}
    >
      <View style={styles.symbolContainer}>
        <Text style={styles.symbol}>{room.symbol}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nameAr}>{room.nameAr}</Text>
        <Text style={styles.nameFr}>{room.nameFr}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pot</Text>
            <Text style={styles.statValue}>{formatDinar(room.topf)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Mise</Text>
            <Text style={styles.statValue}>{formatDinar(room.einsatz)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Joueurs</Text>
            <PlayerDots occupied={occupiedCount} total={room.maxPlayers} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, isDisabled && styles.joinButtonFull]}
        onPress={onJoinPress}
        activeOpacity={0.85}
        disabled={isDisabled}
      >
        <Text style={[styles.joinText, isDisabled && styles.joinTextFull]}>
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3d20',
    elevation: 4,
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  symbol: {
    fontSize: 24,
    color: COLORS.gold,
  },
  info: {
    flex: 1,
  },
  nameAr: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  nameFr: {
    color: COLORS.textLight,
    fontSize: 13,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  statValue: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#2a4a2a',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOccupied: {
    backgroundColor: COLORS.slotOccupied,
  },
  dotFree: {
    backgroundColor: COLORS.slotFree,
  },
  joinButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  joinButtonFull: {
    backgroundColor: '#333',
  },
  joinText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  joinTextFull: {
    color: '#666',
  },
});

export default RoomCard;
