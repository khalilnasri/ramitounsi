import { CARD_POINTS, WIN_DISTRIBUTION } from '../utils/constants';

// Berechnet Punkte einer Hand (Verlierer-Punkte)
export const calcHandPoints = (cards) => {
  return cards.reduce((sum, card) => {
    const pts = CARD_POINTS[card.value] ?? 0;
    return sum + pts;
  }, 0);
};

// Berechnet Gewinn-Beträge
export const calcPrizes = (topf) => ({
  first: parseFloat((topf * WIN_DISTRIBUTION.first).toFixed(2)),
  second: parseFloat((topf * WIN_DISTRIBUTION.second).toFixed(2)),
  app: parseFloat((topf * WIN_DISTRIBUTION.app).toFixed(2)),
});

// Rangliste erstellen aus Spieler-Ergebnissen
// winner = Spieler der Rami gemacht hat (Rang 1)
// rest = nach Punkte aufsteigend (weniger Punkte = besser)
export const buildRanking = (players, winnerId) => {
  const winner = players.find((p) => p.id === winnerId);
  const rest = players
    .filter((p) => p.id !== winnerId)
    .sort((a, b) => calcHandPoints(a.cards) - calcHandPoints(b.cards));

  return [winner, ...rest].map((p, i) => ({
    ...p,
    rank: i + 1,
    handPoints: p.id === winnerId ? 0 : calcHandPoints(p.cards),
  }));
};

// Statistik-Update für Profil
export const updateStats = (stats, won) => ({
  gamesPlayed: (stats.gamesPlayed || 0) + 1,
  gamesWon: (stats.gamesWon || 0) + (won ? 1 : 0),
  winRate: (((stats.gamesWon || 0) + (won ? 1 : 0)) /
    ((stats.gamesPlayed || 0) + 1) * 100).toFixed(1),
});
