import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHRV1wkGr6fRI6y7CSg6AM-_gPUOd9Ibw",
    authDomain: "e-commerce-website-proje-9af1a.firebaseapp.com",
    projectId: "e-commerce-website-proje-9af1a",
    storageBucket: "e-commerce-website-proje-9af1a.firebasestorage.app",
    messagingSenderId: "1059874177756",
    appId: "1:1059874177756:web:086483c6b60490db82aa19"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

