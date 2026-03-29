import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ImageBackground,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { formatDinar } from '../utils/helpers';
import { triggerTapHaptic } from '../utils/haptics';
import { EASE, T } from '../utils/animation';

const AnimatedView = Animated.View;

const RoomCard = ({ room, occupiedCount = 0, onJoin, gameStarted = false, image }) => {
  const isFull = occupiedCount >= room.maxPlayers;
  const isRunning = Boolean(gameStarted);
  const isDisabled = isFull || isRunning;
  const pressScale = useRef(new Animated.Value(1)).current;
  const tapAnimRef = useRef(null);

  const gainPercent = Math.round((room.topf / room.einsatz - 1) * 100);
  const accentColor = room.accentColor || COLORS.greenAccent;

  const buttonLabel = isRunning ? 'En cours' : isFull ? 'Complet' : 'Jouer!';

  useEffect(() => () => tapAnimRef.current?.stop(), []);

  const onJoinPress = async () => {
    if (isDisabled || !onJoin) return;
    await triggerTapHaptic();
    tapAnimRef.current = Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.97, duration: T.tap, easing: EASE, useNativeDriver: true }),
      Animated.timing(pressScale, { toValue: 1, duration: T.tap, easing: EASE, useNativeDriver: true }),
    ]);
    tapAnimRef.current.start();
    setTimeout(() => onJoin(room), T.tap);
  };

  const cardInner = (
    <>
      {/* Very subtle overlay — just enough for edge contrast, image stays vivid */}
      <View style={styles.overlay} />

      {/* Main row: [POT badge] [spacer] [Right panel] */}
      <View style={styles.mainRow}>

        {/* Left: circular POT badge */}
        <View style={[styles.potBadge, { borderColor: accentColor }]}>
          <Text style={styles.potLabel}>POT</Text>
          <Text style={styles.potAmount}>{formatDinar(room.topf)}</Text>
          <View style={styles.playersRow}>
            <Text style={styles.playerIcon}>👥</Text>
            <Text style={styles.playerCount}>{occupiedCount}/{room.maxPlayers}</Text>
          </View>
        </View>

        {/* Center: room name floats over image */}
        <View style={styles.center}>
          <Text style={styles.nameAr}>{room.nameAr}</Text>
          <Text style={styles.nameFr}>{room.nameFr}</Text>
        </View>

        {/* Right: dark panel with stake + button */}
        <View style={styles.rightPanel}>
          <Text style={styles.stakeLabel}>Mise</Text>
          <Text style={styles.stakeAmount}>{formatDinar(room.einsatz)}</Text>
          <TouchableOpacity
            style={[styles.joinButton, isDisabled && styles.joinButtonDisabled]}
            onPress={onJoinPress}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <Text style={[styles.joinText, isDisabled && styles.joinTextDisabled]}>
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom colored bar: gain percentage */}
      <View style={[styles.bottomBar, { backgroundColor: accentColor }]}>
        <Text style={styles.gainText}>🏆  {gainPercent}% de gain</Text>
      </View>
    </>
  );

  if (image) {
    return (
      <AnimatedView style={[styles.cardWrapper, { transform: [{ scale: pressScale }] }]}>
        <ImageBackground
          source={image}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          {cardInner}
        </ImageBackground>
      </AnimatedView>
    );
  }

  /* Hobby room: no image → gradient-like dark background */
  return (
    <AnimatedView style={[styles.cardWrapper, { transform: [{ scale: pressScale }] }]}>
      <View style={[styles.card, styles.cardNoImage]}>
        {cardInner}
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 14,
    marginVertical: 7,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  card: {
    height: 155,
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 18,
    top: 0,
  },
  cardNoImage: {
    backgroundColor: '#0f2710',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 18,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },

  /* POT badge — left circular element */
  potBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  potLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  potAmount: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: 'bold',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  playerIcon: {
    fontSize: 10,
  },
  playerCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Center spacer — image shows through */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  nameAr: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  nameFr: {
    color: '#ffffff',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  /* Right dark panel */
  rightPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 82,
    gap: 3,
  },
  stakeLabel: {
    color: '#ddd',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stakeAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  joinButton: {
    backgroundColor: '#43a047',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    marginTop: 4,
    minWidth: 68,
    alignItems: 'center',
    elevation: 2,
  },
  joinButtonDisabled: {
    backgroundColor: '#333',
  },
  joinText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  joinTextDisabled: {
    color: '#666',
  },

  /* Bottom colored gain bar */
  bottomBar: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});

export default RoomCard;
