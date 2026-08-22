import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
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

// API Keys
export const IMGBB_API_KEY = "0298c2843fc0f575928ba0562d0fb697";
export const GROQ_API_KEY = "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";