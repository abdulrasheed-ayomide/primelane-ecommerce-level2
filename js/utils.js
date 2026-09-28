// Small shared helpers: escaping, formatting, URLs.
import { CURRENCY, LOCALE, STATUS_META } from "./config.js";

/**
 * Escape text before putting it inside an HTML template string.
 * Use it for EVERY value that comes from Firestore or user input.
 */
export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Only allow http(s) and site-relative image URLs (blocks `javascript:` etc). */
export function safeUrl(url, fallback = "/multimedia/placeholder.svg") {
  const value = String(url ?? "").trim();
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) return value; // small embedded images from the original catalog
  return fallback;
}

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount) {
  return priceFormatter.format(Number(amount) || 0);
}

/** Round money to 2 decimals to avoid floating-point noise. */
export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Accepts a Firestore Timestamp, Date, or millis. */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  return null;
}

export function formatDate(value, withTime = false) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/** Short, readable order reference shown to customers. */
export function orderRef(id) {
  return "#" + String(id).slice(0, 8).toUpperCase();
}

export function discountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function statusLabel(status) {
  return STATUS_META[status]?.label ?? status;
}

const TONES = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  gray: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function statusBadge(status) {
  const meta = STATUS_META[status] ?? { short: status, tone: "gray" };
  return `<span class="badge ${TONES[meta.tone]}">${escapeHTML(meta.short)}</span>`;
}

/** Star rating (display only). */
export function starsHTML(rating = 0, reviews) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const pct = (value / 5) * 100;
  return `
    <span class="inline-flex items-center gap-1.5 text-sm" aria-label="Rated ${value.toFixed(1)} out of 5${reviews ? `, ${reviews} reviews` : ""}">
      <span class="relative inline-block leading-none text-gray-300 dark:text-gray-600" aria-hidden="true">★★★★★
        <span class="absolute inset-0 overflow-hidden text-amber-400" style="width:${pct}%">★★★★★</span>
      </span>
      <span class="font-medium text-gray-700 dark:text-gray-300">${value.toFixed(1)}</span>
      ${reviews ? `<span class="text-gray-500 dark:text-gray-400">(${Number(reviews).toLocaleString()})</span>` : ""}
    </span>`;
}

/** Turns a Firebase error into a message a customer can act on. */
export function friendlyError(error) {
  const code = error?.code ?? "";
  const map = {
    "permission-denied": "You don't have permission to do that.",
    "unavailable": "Can't reach the server. Check your internet connection and try again.",
    "auth/network-request-failed": "Can't reach the server. Check your internet connection and try again.",
    "not-found": "We couldn't find what you were looking for.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/invalid-email": "Invalid email address.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password is too weak. Use at least 8 characters with letters and numbers.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/missing-password": "Enter your password.",
    "auth/missing-email": "Enter your email address.",
    "auth/password-does-not-meet-requirements": "That password doesn't meet the requirements. Use at least 8 characters with letters and numbers.",
    "auth/requires-recent-login": "Please log in again to continue.",
    // Setup problems: customers get a neutral message, never Firebase internals.
    "auth/invalid-api-key": "Sign-in is temporarily unavailable. Please try again later.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Sign-in is temporarily unavailable. Please try again later.",
    "auth/operation-not-allowed": "Sign-in is temporarily unavailable. Please try again later.",
    "auth/configuration-not-found": "Sign-in is temporarily unavailable. Please try again later.",
    "auth/unauthorized-domain": "Sign-in is temporarily unavailable. Please try again later.",
    "auth/internal-error": "Sign-in is temporarily unavailable. Please try again later.",
  };
  if (map[code]) return map[code];
  if (!navigator.onLine) return map.unavailable;
  return error?.userMessage || "Something went wrong. Please try again.";
}
