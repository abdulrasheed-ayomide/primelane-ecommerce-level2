import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const listeners = [];

onAuthStateChanged(auth, (user) => {
  listeners.forEach((cb) => cb(user));
});

export function onAuthChange(callback) {
  listeners.push(callback);
}

export function logout() {
  signOut(auth);
}