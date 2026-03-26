import { createContext } from 'react';

export const AuthContext = createContext({
  userId: null,
  authReady: false,
});

