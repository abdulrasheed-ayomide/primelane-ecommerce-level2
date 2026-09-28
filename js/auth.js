// Auth state shared by every page: the Firebase user plus their Firestore profile.
//
// Email verification: an account whose email is NOT verified is treated as signed out
// by the whole site (header, protected pages, checkout, admin). Its Firebase session is
// kept only so the login page can offer "Resend verification email".
// firestore.rules enforce the same thing on the server (request.auth.token.email_verified).
import {
  auth, onAuthStateChanged, signOut, reload, sendEmailVerification,
} from "./firebase.js";
import { ensureUserProfile } from "./services/users.js";

const listeners = [];
let state = { ready: false, user: null, profile: null, unverifiedUser: null };
let resolveReady;
const readyPromise = new Promise((resolve) => (resolveReady = resolve));

/**
 * Work out the app-level state for a Firebase user.
 * The cached user object can be stale, so reload it from Firebase first to get the
 * current emailVerified value.
 */
async function applyUser(user) {
  let profile = null;
  let unverifiedUser = null;

  if (user) {
    try {
      await reload(user);
    } catch {
      /* offline: fall back to the cached value */
    }
    if (!user.emailVerified) {
      unverifiedUser = user;
      user = null;
    } else {
      try {
        profile = await ensureUserProfile(user);
      } catch (error) {
        console.error("Could not load user profile", error);
      }
    }
  }

  state = { ready: true, user, profile, unverifiedUser };
  resolveReady(state);
  listeners.forEach((cb) => cb(state.user, state.profile));
  return state;
}

onAuthStateChanged(auth, (user) => applyUser(user));

/** Subscribe to sign-in / sign-out. Called immediately if the state is already known. */
export function onAuthChange(callback) {
  listeners.push(callback);
  if (state.ready) callback(state.user, state.profile);
}

/** Resolves once Firebase has restored the session. */
export function authReady() {
  return readyPromise.then(() => state);
}

/** Resolves once a VERIFIED user and their profile are loaded (use right after signing in). */
export function waitForSignedIn() {
  return new Promise((resolve) => {
    onAuthChange((user, profile) => {
      if (user) resolve({ user, profile });
    });
  });
}

export function getAuthState() {
  return state;
}

export function isAdmin(profile = state.profile) {
  return profile?.role === "admin";
}

/** Update the cached profile after the user edits it. */
export function setCachedProfile(profile) {
  state = { ...state, profile };
}

/**
 * Re-check the signed-in account after the user clicked the link in their email.
 * Reloads the user from Firebase and, once verified, forces a new ID token so
 * Firestore sees `email_verified: true` straight away.
 * Returns true when the account is verified.
 */
export async function refreshVerification() {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  if (!user.emailVerified) return false;
  await user.getIdToken(true);
  await applyUser(user);
  return true;
}

/* ---------- Verification email (with a cooldown to prevent spamming) ---------- */

const COOLDOWN_MS = 60 * 1000;
const COOLDOWN_KEY = "verify-email-sent-at";

export function verificationCooldownLeft() {
  let last = 0;
  try {
    last = Number(localStorage.getItem(COOLDOWN_KEY)) || 0;
  } catch {}
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

/** Where Firebase's "email verified" page sends the user back to. */
function verificationSettings() {
  return { url: `${location.origin}/pages/login.html?verified=1` };
}

/** Send (or resend) the verification email to the signed-in, unverified account. */
export async function sendVerificationEmail(user = auth.currentUser) {
  if (!user) throw Object.assign(new Error("no user"), { userMessage: "Please log in again to resend the verification email." });
  if (verificationCooldownLeft() > 0) {
    throw Object.assign(new Error("cooldown"), { userMessage: "Please wait a minute before requesting another email." });
  }
  try {
    await sendEmailVerification(user, verificationSettings());
  } catch (error) {
    // The return link only works on domains listed under Firebase Auth → Settings →
    // Authorized domains. If this domain isn't listed, send the email without it.
    if (error?.code === "auth/unauthorized-continue-uri" || error?.code === "auth/invalid-continue-uri") {
      await sendEmailVerification(user);
    } else {
      throw error;
    }
  }
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {}
}

/* ---------- Page guards ---------- */

export function loginUrl() {
  const next = window.location.pathname + window.location.search;
  return `/pages/login.html?next=${encodeURIComponent(next)}`;
}

/**
 * Redirects to login unless a user with a VERIFIED email is signed in.
 * Resolves with the auth state otherwise.
 */
export async function requireUser() {
  const current = await authReady();
  if (!current.user) {
    window.location.replace(loginUrl());
    return new Promise(() => {}); // never resolves; page is navigating away
  }
  return current;
}

export async function logout() {
  await signOut(auth);
}
