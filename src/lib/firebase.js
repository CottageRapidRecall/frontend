import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAphIzwHuLG_LqE7nv5yuHkwpVLTxQa7AQ",
  authDomain: "recallmd-83caf.firebaseapp.com",
  projectId: "recallmd-83caf",
  storageBucket: "recallmd-83caf.firebasestorage.app",
  messagingSenderId: "218440428095",
  appId: "1:218440428095:web:1b80fb8ed8279ed951a68a",
  measurementId: "G-L4PPFQTLX0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
