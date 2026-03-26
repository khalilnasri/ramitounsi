import { Easing } from 'react-native';

export const T = {
  tap: 150,
  fast: 180,
  normal: 260,
  slow: 420,
  verySlow: 700,
  stagger: 100,
};

export const EASE = Easing.out(Easing.cubic);
export const BOUNCE_EASE = Easing.out(Easing.back(1.5));
