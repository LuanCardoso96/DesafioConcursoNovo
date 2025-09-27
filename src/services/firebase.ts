import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD_duDp22Wxmo1Tn3phtMDl78nLtUtCvH4",
  authDomain: "dateperfeito-e93ed.firebaseapp.com",
  projectId: "dateperfeito-e93ed",
  storageBucket: "dateperfeito-e93ed.appspot.com",
  messagingSenderId: "685860554840",
  appId: "1:685860554840:web:84fd18bd1785933506222d",
  measurementId: "G-F1ETSP4MYV"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Auth com persistência React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };
