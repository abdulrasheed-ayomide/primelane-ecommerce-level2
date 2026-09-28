// settings/store: store-wide values an admin can change (delivery fee).
// firestore.rules reads the same document to check the delivery fee on new orders.
import { db, doc, getDoc, setDoc, serverTimestamp } from "../firebase.js";
import { DEFAULT_DELIVERY_FEE } from "../config.js";

const ref = () => doc(db, "settings", "store");
const CACHE_KEY = "store-settings-cache-v1";
const CACHE_MS = 5 * 60 * 1000;

/**
 * Read the store settings.
 * `cached: true` re-uses a copy for up to 5 minutes. Only use it for promotional
 * messages (home / product page). The cart and checkout always read fresh values.
 */
export async function getStoreSettings({ cached = false } = {}) {
  if (cached) {
    try {
      const hit = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (hit && Date.now() - hit.time < CACHE_MS) return hit.settings;
    } catch {}
  }
  const snap = await getDoc(ref());
  const data = snap.exists() ? snap.data() : {};
  const settings = {
    exists: snap.exists(),
    deliveryFee: Number(data.deliveryFee ?? DEFAULT_DELIVERY_FEE),
    freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? 0),
  };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), settings }));
  } catch {}
  return settings;
}

export async function saveStoreSettings({ deliveryFee, freeDeliveryThreshold }) {
  await setDoc(ref(), {
    deliveryFee: Number(deliveryFee),
    freeDeliveryThreshold: Number(freeDeliveryThreshold),
    updatedAt: serverTimestamp(),
  });
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

/**
 * Delivery fee for a given subtotal. 0 threshold = no free delivery.
 * This is THE delivery calculation: cart, checkout and placeOrder() all use it,
 * and validShippingFee() in firestore.rules mirrors it on the server.
 */
export function shippingFor(subtotal, settings) {
  if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryFee;
}

/**
 * Free-delivery status for customer-facing messages (same threshold test as shippingFor()).
 * { enabled, qualifies, remaining, threshold }
 */
export function freeDeliveryStatus(subtotal, settings) {
  const threshold = Number(settings?.freeDeliveryThreshold) || 0;
  if (threshold <= 0) return { enabled: false, qualifies: false, remaining: 0, threshold: 0 };
  const qualifies = subtotal >= threshold; // the same test shippingFor() uses
  return { enabled: true, qualifies, remaining: qualifies ? 0 : Math.max(0, threshold - subtotal), threshold };
}
