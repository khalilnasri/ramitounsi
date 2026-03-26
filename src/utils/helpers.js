export const formatDinar = (amount) => `${Number(amount).toFixed(2)} D`;

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const generateRoomId = (roomType) => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${roomType}_${ts}_${rand}`;
};

export const generateUserId = () => {
  return 'user_' + Math.random().toString(36).slice(2, 10);
};

export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCardColor = (suit) => {
  return suit === '♥' || suit === '♦' ? '#e53935' : '#1a1a1a';
};

export const isRedSuit = (suit) => suit === '♥' || suit === '♦';

export const calcWinnings = (topf) => ({
  first: topf * 0.5,
  second: topf * 0.3,
});

export const ordinalRank = (rank) => {
  const map = { 1: '1er', 2: '2ème', 3: '3ème', 4: '4ème' };
  return map[rank] || `${rank}ème`;
};
