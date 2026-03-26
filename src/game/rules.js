const VALUE_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Prüft ob ein Set ein Brelan/Carré ist (gleiche Werte)
export const isBrelanOrCarre = (cards) => {
  if (cards.length < 3 || cards.length > 4) return false;

  const nonJokers = cards.filter((c) => !c.isJoker);
  if (nonJokers.length === 0) return false;

  const value = nonJokers[0].value;
  return nonJokers.every((c) => c.value === value);
};

// Prüft ob eine Sequenz gültig ist
export const isSequence = (cards) => {
  if (cards.length < 3) return false;

  const nonJokers = cards.filter((c) => !c.isJoker);
  if (nonJokers.length === 0) return false;

  const suit = nonJokers[0].suit;
  if (!nonJokers.every((c) => c.suit === suit)) return false;

  // Sortiere nach Wert
  const sorted = [...nonJokers].sort(
    (a, b) => VALUE_ORDER.indexOf(a.value) - VALUE_ORDER.indexOf(b.value)
  );

  const jokerCount = cards.length - nonJokers.length;
  let gaps = 0;

  for (let i = 1; i < sorted.length; i++) {
    const diff = VALUE_ORDER.indexOf(sorted[i].value) - VALUE_ORDER.indexOf(sorted[i - 1].value);
    if (diff === 0) return false; // Duplikat
    gaps += diff - 1;
  }

  return gaps <= jokerCount;
};

// Validiert eine Kombination
export const isValidCombination = (cards) => {
  if (!cards || cards.length < 3) return false;
  return isBrelanOrCarre(cards) || isSequence(cards);
};

// Prüft ob ein Spieler Rami machen kann (alle Karten in Kombis)
export const canDeclareRami = (hand, combinations) => {
  if (hand.length !== 0) return false;
  return combinations.every((combo) => isValidCombination(combo));
};

// Prüft ob eine Karte zu einer bestehenden Kombination passt
export const canAddToCombo = (card, combo) => {
  const extended = [...combo, card];
  return isValidCombination(extended);
};

// Validiert einen Spielzug
export const validateMove = (action, gameState, playerId) => {
  const { currentPlayer, drawPile, discardPile } = gameState;

  if (currentPlayer !== playerId) {
    return { valid: false, error: 'Nicht dein Zug' };
  }

  if (action.type === 'DRAW_FROM_PILE' && drawPile.length === 0) {
    return { valid: false, error: 'Zieh-Stapel leer' };
  }

  if (action.type === 'DRAW_FROM_DISCARD' && discardPile.length === 0) {
    return { valid: false, error: 'Ablage-Stapel leer' };
  }

  return { valid: true };
};
