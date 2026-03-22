import { onAuthChange } from "./auth.js";

let currentUser = null;
let initialized = false;
const listeners = [];

// Listen to firebase/auth once globally
onAuthChange((user) => {
  currentUser = user;
  initialized = true;

  // notify all UI parts
  listeners.forEach(cb => cb(user));
});

// allow UI files to listen safely
export function onUserChange(callback) {
  listeners.push(callback);

  // instantly send state if already known
  if (initialized) {
    callback(currentUser);
  }
}

// allow UI to know when auth finished loading
export function isAuthReady() {
  return initialized;
}