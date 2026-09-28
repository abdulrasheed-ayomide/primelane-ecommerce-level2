// orders collection: placing orders (customers) and managing them (admins).
import {
  db, collection, doc, getDoc, getDocs, query, where,
  runTransaction, writeBatch, serverTimestamp, Timestamp, increment,
} from "../firebase.js";
import { CURRENCY, ORDER_END_STATES } from "../config.js";
import { roundMoney, toDate } from "../utils.js";
import { shippingFor } from "./settings.js";
import { clearProductCache } from "./products.js";

function fromDoc(snap) {
  const d = snap.data();
  return { id: snap.id, ...d, createdAtMs: toDate(d.createdAt)?.getTime() ?? 0 };
}

class CheckoutError extends Error {
  constructor(userMessage) {
    super(userMessage);
    this.userMessage = userMessage;
  }
}

/**
 * Creates an order in ONE transaction:
 *  - reads each product to get the real, current price and stock
 *  - saves the order with those prices (so later price changes don't affect it)
 *  - reduces stock for each product
 * firestore.rules re-checks prices, totals, delivery fee and stock changes on the server.
 */
export async function placeOrder({ uid, customer, shipping, cartItems }) {
  if (!cartItems.length) throw new CheckoutError("Your cart is empty.");

  const orderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (tx) => {
    const settingsSnap = await tx.get(doc(db, "settings", "store"));
    if (!settingsSnap.exists()) {
      throw new CheckoutError("The store isn't accepting orders yet (delivery settings missing). Please try again later.");
    }
    const settings = {
      deliveryFee: Number(settingsSnap.data().deliveryFee) || 0,
      freeDeliveryThreshold: Number(settingsSnap.data().freeDeliveryThreshold) || 0,
    };

    // 1. read all products first (transactions require reads before writes)
    const productSnaps = [];
    for (const item of cartItems) {
      productSnaps.push(await tx.get(doc(db, "products", item.id)));
    }

    // 2. validate and build order lines from the database values
    const items = [];
    const quantities = {};
    productSnaps.forEach((snap, i) => {
      const wanted = cartItems[i];
      if (!snap.exists()) throw new CheckoutError(`${wanted.title} is no longer available. Remove it from your cart.`);
      const p = snap.data();
      const stock = Number(p.stock) || 0;
      if (stock < wanted.quantity) {
        throw new CheckoutError(
          stock === 0 ? `${p.title} just sold out. Remove it from your cart.` : `Only ${stock} of ${p.title} left. Update the quantity in your cart.`
        );
      }
      const price = Number(p.price);
      items.push({
        productId: snap.id,
        title: p.title,
        image: p.image ?? "",
        price,
        quantity: wanted.quantity,
        lineTotal: roundMoney(price * wanted.quantity),
      });
      quantities[snap.id] = wanted.quantity;
    });

    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const shippingFee = shippingFor(subtotal, settings);

    // 3. write the order
    tx.set(orderRef, {
      userId: uid,
      customer,
      shipping,
      items,
      productIds: items.map((i) => i.productId),
      quantities,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      shippingFee,
      total: roundMoney(subtotal + shippingFee),
      currency: CURRENCY,
      status: "placed",
      statusHistory: [{ status: "placed", at: Timestamp.now(), by: "customer" }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. reduce stock
    productSnaps.forEach((snap, i) => {
      tx.update(snap.ref, {
        stock: Number(snap.data().stock) - items[i].quantity,
        lastOrderId: orderRef.id,
        updatedAt: serverTimestamp(),
      });
    });
  });

  clearProductCache();
  return orderRef.id;
}

export async function getOrder(id) {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? fromDoc(snap) : null;
}

/** A customer's own orders, newest first. (Sorted here to avoid needing a composite index.) */
export async function listMyOrders(uid) {
  const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid)));
  return snap.docs.map(fromDoc).sort((a, b) => b.createdAtMs - a.createdAtMs);
}

// ---------- Admin ----------

export async function listAllOrders() {
  const snap = await getDocs(collection(db, "orders"));
  return snap.docs.map(fromDoc).sort((a, b) => b.createdAtMs - a.createdAtMs);
}

/**
 * Change an order's status and record it in the tracking history.
 * Cancelling / failing an order puts its items back into stock.
 */
export async function updateOrderStatus(order, newStatus, note = "") {
  if (order.status === newStatus) return;
  if (ORDER_END_STATES.includes(order.status)) {
    throw new CheckoutError("Cancelled or failed orders can't be changed.");
  }

  const batch = writeBatch(db);
  batch.update(doc(db, "orders", order.id), {
    status: newStatus,
    statusHistory: [
      ...(order.statusHistory ?? []),
      { status: newStatus, at: Timestamp.now(), by: "admin", ...(note ? { note: note.slice(0, 200) } : {}) },
    ],
    updatedAt: serverTimestamp(),
  });

  if (ORDER_END_STATES.includes(newStatus)) {
    for (const item of order.items ?? []) {
      const productRef = doc(db, "products", item.productId);
      const exists = (await getDoc(productRef)).exists();
      if (exists) batch.update(productRef, { stock: increment(item.quantity), updatedAt: serverTimestamp() });
    }
  }
  await batch.commit();
  clearProductCache();
}
