// Cart state, saved in localStorage so it survives reloads and works for guests.
// Prices here are only for display; checkout re-reads real prices from Firestore.
import { showToast } from "./toast.js";
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from "./config.js";
import { roundMoney } from "./utils.js";

const STORAGE_KEY = "cart";
const listeners = [];

function normalize(item) {
  return {
    id: String(item.id),
    title: String(item.title ?? ""),
    price: Number(item.price) || 0,
    image: item.image ?? "",
    stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : MAX_QTY_PER_LINE,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(saved) ? saved.map(normalize) : [];
  } catch {
    return [];
  }
}

let cart = load();

function maxFor(item) {
  return Math.max(0, Math.min(item.stock, MAX_QTY_PER_LINE));
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {}
  listeners.forEach((cb) => cb(cart));
}

// Keep several open tabs in sync.
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    cart = load();
    listeners.forEach((cb) => cb(cart));
  }
});

/** Add a product. Returns true if something was added. */
export function addToCart(product, quantity = 1) {
  const qty = Math.max(1, Math.floor(quantity));
  const stock = Number(product.stock) || 0;

  if (stock <= 0) {
    showToast(`${product.title} is out of stock.`, "warning");
    return false;
  }

  const existing = cart.find((item) => item.id === String(product.id));
  if (existing) {
    existing.stock = stock;
    existing.price = Number(product.price) || existing.price;
    const max = maxFor(existing);
    if (existing.quantity >= max) {
      showToast(`You already have the maximum available (${max}) in your cart.`, "warning");
      return false;
    }
    existing.quantity = Math.min(existing.quantity + qty, max);
  } else {
    if (cart.length >= MAX_CART_LINES) {
      showToast(`An order can contain up to ${MAX_CART_LINES} different products.`, "warning");
      return false;
    }
    const item = normalize({ ...product, quantity: qty });
    item.quantity = Math.min(item.quantity, maxFor(item));
    cart.push(item);
  }

  save();
  showToast(`${product.title} added to cart`, "success");
  return true;
}

export function setQuantity(id, quantity) {
  const item = cart.find((i) => i.id === String(id));
  if (!item) return;
  const max = maxFor(item);
  const next = Math.max(1, Math.min(Math.floor(Number(quantity) || 1), max));
  if (next !== item.quantity) {
    item.quantity = next;
    save();
  }
  return next;
}

export function increaseQuantity(id) {
  const item = cart.find((i) => i.id === String(id));
  if (!item) return;
  if (item.quantity >= maxFor(item)) {
    showToast(`Only ${maxFor(item)} available.`, "warning");
    return;
  }
  setQuantity(id, item.quantity + 1);
}

export function decreaseQuantity(id) {
  const item = cart.find((i) => i.id === String(id));
  if (item && item.quantity > 1) setQuantity(id, item.quantity - 1);
}

export function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== String(id));
  save();
}

export function clearCart() {
  cart = [];
  save();
}

export function getCart() {
  return cart;
}

export function cartSubtotal(items = cart) {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function onCartChange(callback) {
  listeners.push(callback);
  callback(cart);
}

/**
 * Update cart items with the latest product data (price, stock, name, image).
 * `productsById` is a Map of id -> product (missing = product deleted).
 * Returns human-readable notes about what changed.
 */
export function syncCartWithProducts(productsById) {
  const notes = [];
  const next = [];
  for (const item of cart) {
    const product = productsById.get(item.id);
    if (!product) {
      notes.push(`${item.title} is no longer available and was removed.`);
      continue;
    }
    if (product.price !== item.price) notes.push(`The price of ${product.title} changed.`);
    const updated = normalize({ ...item, title: product.title, price: product.price, image: product.image, stock: product.stock });
    if (updated.stock <= 0) {
      notes.push(`${product.title} is out of stock and was removed.`);
      continue;
    }
    if (updated.quantity > maxFor(updated)) {
      updated.quantity = maxFor(updated);
      notes.push(`Only ${updated.quantity} of ${product.title} available; quantity updated.`);
    }
    next.push(updated);
  }
  cart = next;
  save();
  return notes;
}
