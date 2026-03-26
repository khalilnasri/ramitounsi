import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "DEINE_API_KEY",
  authDomain: "ramitounsi.firebaseapp.com",
  projectId: "ramitounsi",
  storageBucket: "ramitounsi.appspot.com",
  messagingSenderId: "DEINE_ID",
  appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signInAnon = () => signInAnonymously(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export default app;
