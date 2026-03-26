import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import PlayingCard from './PlayingCard';
import { COLORS } from '../utils/constants';

const CardHand = ({ cards = [], selectedCards = [], onCardPress, fanLayout = false }) => {
  if (fanLayout && cards.length > 0) {
    const total = cards.length;
    const angleStep = Math.min(4, 60 / total);
    const startAngle = -(total / 2) * angleStep;

    return (
      <View style={styles.fanContainer}>
        {cards.map((card, i) => {
          const angle = startAngle + i * angleStep;
          const isSelected = selectedCards.some((s) => s.id === card.id);
          return (
            <View
              key={card.id}
              style={[
                styles.fanCard,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: isSelected ? -15 : 0 },
                  ],
                  zIndex: i,
                  left: i * 22,
                },
              ]}
            >
              <PlayingCard
                card={card}
                selected={isSelected}
                onPress={() => onCardPress && onCardPress(card)}
              />
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollContainer}
    >
      {cards.map((card) => {
        const isSelected = selectedCards.some((s) => s.id === card.id);
        return (
          <PlayingCard
            key={card.id}
            card={card}
            selected={isSelected}
            onPress={() => onCardPress && onCardPress(card)}
            style={styles.cardSpacing}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fanContainer: {
    height: 110,
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
  },
  fanCard: {
    position: 'absolute',
    bottom: 0,
  },
  scrollContainer: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  cardSpacing: {
    marginHorizontal: 3,
  },
});

export default CardHand;
