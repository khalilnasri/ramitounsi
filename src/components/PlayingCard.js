import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../utils/constants';

const PlayingCard = ({
  card,
  selected = false,
  faceDown = false,
  onPress,
  small = false,
  style,
}) => {
  if (!card) return null;

  const cardColor = card.isJoker
    ? COLORS.gold
    : card.color === 'red'
    ? COLORS.red
    : COLORS.black;

  const size = small ? styles.small : styles.normal;
  const fontSize = small ? 10 : 14;

  if (faceDown) {
    return (
      <View style={[styles.card, size, styles.faceDown, style]}>
        <Text style={styles.faceDownText}>🂠</Text>
      </View>
    );
  }

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      onPress={onPress}
      style={[
        styles.card,
        size,
        selected && styles.selected,
        card.isJoker && styles.jokerCard,
        style,
      ]}
      activeOpacity={0.7}
    >
      {card.isJoker ? (
        <Text style={[styles.jokerText, { fontSize: small ? 16 : 22 }]}>J</Text>
      ) : (
        <>
          <Text style={[styles.valueTop, { color: cardColor, fontSize }]}>
            {card.value}
          </Text>
          <Text style={[styles.suit, { color: cardColor, fontSize: small ? 12 : 18 }]}>
            {card.suit}
          </Text>
          <Text style={[styles.valueBottom, { color: cardColor, fontSize }]}>
            {card.value}
          </Text>
        </>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  normal: {
    width: 48,
    height: 70,
  },
  small: {
    width: 32,
    height: 46,
  },
  faceDown: {
    backgroundColor: '#1565c0',
  },
  faceDownText: {
    fontSize: 28,
    color: '#1565c0',
  },
  selected: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    transform: [{ translateY: -10 }],
    elevation: Platform.OS === 'android' ? 4 : 8,
  },
  jokerCard: {
    backgroundColor: '#fff9c4',
    borderColor: COLORS.gold,
  },
  valueTop: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontWeight: 'bold',
  },
  suit: {
    fontWeight: 'bold',
  },
  valueBottom: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    fontWeight: 'bold',
    transform: [{ rotate: '180deg' }],
  },
  jokerText: {
    fontWeight: 'bold',
    color: COLORS.gold,
  },
});

export default PlayingCard;
