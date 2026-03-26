import { CARD_SUITS, CARD_VALUES } from '../utils/constants';
import { shuffleArray } from '../utils/helpers';

export const createDeck = () => {
  const cards = [];

  CARD_SUITS.forEach((suit) => {
    CARD_VALUES.forEach((value) => {
      cards.push({
        id: `${value}_${suit}`,
        value,
        suit,
        isJoker: false,
        color: suit === '♥' || suit === '♦' ? 'red' : 'black',
      });
    });
  });

  // 4 Joker
  for (let i = 1; i <= 4; i++) {
    cards.push({
      id: `JOKER_${i}`,
      value: 'JOKER',
      suit: null,
      isJoker: true,
      color: 'rainbow',
    });
  }

  return shuffleArray(cards);
};

export const dealCards = (deck, numPlayers = 4, cardsPerPlayer = 14) => {
  const hands = Array.from({ length: numPlayers }, () => []);
  let index = 0;

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < numPlayers; p++) {
      if (index < deck.length) {
        hands[p].push(deck[index++]);
      }
    }
  }

  const discardPile = [deck[index++]];
  const drawPile = deck.slice(index);

  return { hands, drawPile, discardPile };
};

export const sortHand = (cards) => {
  const jokers = cards.filter((c) => c.isJoker);
  const normal = cards.filter((c) => !c.isJoker);

  const suitOrder = ['♠', '♥', '♦', '♣'];
  const valueOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  normal.sort((a, b) => {
    const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return valueOrder.indexOf(a.value) - valueOrder.indexOf(b.value);
  });

  return [...normal, ...jokers];
};
