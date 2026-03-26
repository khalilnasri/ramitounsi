export const COLORS = {
  background: '#0d1f0f',
  gold: '#c9a02a',
  cardBackground: '#0f2710',
  greenAccent: '#2e7d32',
  tableGreen: '#1a3a1a',
  textLight: '#f0f0f0',
  textMuted: '#a0a0a0',
  red: '#e53935',
  black: '#1a1a1a',
  white: '#ffffff',
  slotOccupied: '#4caf50',
  slotFree: '#555555',
  goldDark: '#a07820',
};

export const ROOMS = [
  {
    id: 'hobby',
    nameAr: 'قاعة الهواية',
    nameFr: 'Salle Hobby (vs App)',
    symbol: '🤖',
    einsatz: 0.5,
    topf: 1,
    maxPlayers: 4,
  },
  {
    id: 'vip',
    nameAr: 'قاعة VIP',
    nameFr: 'Salle VIP',
    symbol: '♛',
    einsatz: 4,
    topf: 16,
    maxPlayers: 4,
  },
  {
    id: 'salle3',
    nameAr: 'القاعة 3',
    nameFr: 'Salle 3',
    symbol: '♠',
    einsatz: 3,
    topf: 12,
    maxPlayers: 4,
  },
  {
    id: 'salle2',
    nameAr: 'القاعة 2',
    nameFr: 'Salle 2',
    symbol: '♦',
    einsatz: 2,
    topf: 8,
    maxPlayers: 4,
  },
  {
    id: 'salle1',
    nameAr: 'القاعة 1',
    nameFr: 'Salle 1',
    symbol: '♣',
    einsatz: 1,
    topf: 4,
    maxPlayers: 4,
  },
];

export const CARD_SUITS = ['♠', '♥', '♦', '♣'];
export const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const CARD_POINTS = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 10, Q: 10, K: 10, JOKER: 0,
};

export const WIN_DISTRIBUTION = {
  first: 0.5,
  second: 0.3,
  app: 0.2,
};

export const COUNTDOWN_SECONDS = 10;
export const CARDS_PER_PLAYER = 14;
