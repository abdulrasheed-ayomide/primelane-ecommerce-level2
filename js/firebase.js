// Firebase setup. Every other module imports Firebase functions from here,
// so the SDK version lives in one place.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase web config values identify the project; they are not secrets.
// Access to data is controlled by firestore.rules (and storage.rules).
const firebaseConfig = {
  apiKey: "AIzaSyAHRV1wkGr6fRI6y7CSg6AM-_gPUOd9Ibw",
  authDomain: "e-commerce-website-proje-9af1a.firebaseapp.com",
  projectId: "e-commerce-website-proje-9af1a",
  storageBucket: "e-commerce-website-proje-9af1a.firebasestorage.app",
  messagingSenderId: "1059874177756",
  appId: "1:1059874177756:web:086483c6b60490db82aa19",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch,
  increment,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
