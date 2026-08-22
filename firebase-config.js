import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8DIXVcymOd3-ImBuMjRfZ_u6VC4Iapkw",
  authDomain: "arcanix-portfolio.firebaseapp.com",
  projectId: "arcanix-portfolio",
  storageBucket: "arcanix-portfolio.firebasestorage.app",
  messagingSenderId: "895631575512",
  appId: "1:895631575512:web:abb6d30540e01e44960aad",
  measurementId: "G-1PRBZMP83L"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
};

// ⚠️ ADMIN EMAIL YAHAN APNA RAKHO:
export const ADMIN_EMAIL = "apna-email@gmail.com";

export const IMGBB_API_KEY = "0298c2843fc0f575928ba0562d0fb697";
export const GEMINI_API_KEY = "AQ.Ab8RN6Ii8UOz6k3MjH_1LBGtFkl22QFHqU1-qCCksUfbg2n9GQ";
