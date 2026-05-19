import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSXN7w4H8gfOx6e5vFdz2Qv9kE8mL3nY0",
  authDomain: "lucys-warehouse.firebaseapp.com",
  projectId: "lucys-warehouse",
  storageBucket: "lucys-warehouse.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
