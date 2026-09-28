// settings/store: store-wide values an admin can change (delivery fee).
// firestore.rules reads the same document to check the delivery fee on new orders.
import { db, doc, getDoc, setDoc, serverTimestamp } from "../firebase.js";
import { DEFAULT_DELIVERY_FEE } from "../config.js";

const ref = () => doc(db, "settings", "store");

export async function getStoreSettings() {
  const snap = await getDoc(ref());
  const data = snap.exists() ? snap.data() : {};
  return {
    exists: snap.exists(),
    deliveryFee: Number(data.deliveryFee ?? DEFAULT_DELIVERY_FEE),
    freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? 0),
  };
}

export async function saveStoreSettings({ deliveryFee, freeDeliveryThreshold }) {
  await setDoc(ref(), {
    deliveryFee: Number(deliveryFee),
    freeDeliveryThreshold: Number(freeDeliveryThreshold),
    updatedAt: serverTimestamp(),
  });
}

/** Delivery fee for a given subtotal. 0 threshold = no free delivery. */
export function shippingFor(subtotal, settings) {
  if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryFee;
}
