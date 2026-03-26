import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../utils/constants';
import { getInitials } from '../utils/helpers';

const PlayerSlot = ({ player, isCurrentTurn = false, cardCount = 0, style }) => {
  const isEmpty = !player;
  const readyGlow = useRef(new Animated.Value(0)).current;
  const isReady = Boolean(player?.bereit);

  useEffect(() => {
    if (!isReady) {
      readyGlow.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(readyGlow, { toValue: 1, duration: 650, useNativeDriver: false }),
        Animated.timing(readyGlow, { toValue: 0, duration: 650, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isReady, readyGlow]);

  return (
    <View style={[styles.container, isCurrentTurn && styles.activeTurn, style]}>
      <Animated.View
        style={[
          styles.avatar,
          isEmpty && styles.emptyAvatar,
          isReady && {
            borderWidth: 1,
            borderColor: COLORS.gold,
            shadowColor: COLORS.gold,
            shadowOpacity: readyGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.75] }),
            shadowRadius: readyGlow.interpolate({ inputRange: [0, 1], outputRange: [4, 12] }),
            elevation: 4,
          },
        ]}
      >
        {isEmpty ? (
          <Text style={styles.emptyIcon}>?</Text>
        ) : (
          <Text style={styles.initials}>{getInitials(player.name)}</Text>
        )}
      </Animated.View>
      <Text style={[styles.name, isEmpty && styles.emptyName]} numberOfLines={1}>
        {isEmpty ? 'En attente...' : player.name}
      </Text>
      {!isEmpty && (
        <Text style={styles.cardCount}>{cardCount} cartes</Text>
      )}
      {isCurrentTurn && !isEmpty && (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>▶</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    minWidth: 70,
  },
  activeTurn: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,160,42,0.1)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyAvatar: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
    borderStyle: 'dashed',
  },
  initials: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyIcon: {
    color: '#555',
    fontSize: 20,
    fontWeight: 'bold',
  },
  name: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 70,
    textAlign: 'center',
  },
  emptyName: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  cardCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  turnIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnText: {
    fontSize: 8,
    color: COLORS.black,
  },
});

export default PlayerSlot;
