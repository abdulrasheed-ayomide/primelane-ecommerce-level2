// products collection: reading for the storefront, writing for admins.
import {
  db, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp,
} from "../firebase.js";
import { toDate } from "../utils.js";

const CACHE_KEY = "products-cache-v1";
const CACHE_MS = 5 * 60 * 1000; // re-use the catalog for 5 minutes to save Firestore reads

/** Turn a Firestore document into a plain product object with safe defaults. */
function fromDoc(snap) {
  const d = snap.data();
  // Older data used rating: { rate, count }; the catalog uses rating + reviews.
  const rating = typeof d.rating === "object" && d.rating ? d.rating.rate : d.rating;
  const reviews = typeof d.rating === "object" && d.rating ? d.rating.count : d.reviews;
  return {
    id: snap.id,
    title: d.title ?? "Untitled product",
    price: Number(d.price) || 0,
    originalPrice: Number(d.originalPrice ?? d.oldPrice) || null,
    category: d.category ?? "Other",
    subCategory: d.subCategory ?? "",
    brand: d.brand ?? "",
    description: d.description ?? "",
    image: d.image ?? "",
    rating: Number(rating) || 0,
    reviews: Number(reviews) || 0,
    badge: d.badge ?? "",
    stock: Math.max(0, Math.floor(Number(d.stock) || 0)),
    features: Array.isArray(d.features) ? d.features : [],
    colors: Array.isArray(d.colors) ? d.colors : [],
    featured: Boolean(d.featured),
    createdAt: toDate(d.createdAt)?.getTime() ?? 0,
  };
}

function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached?.products?.length && Date.now() - cached.time < CACHE_MS) return cached.products;
  } catch {}
  return null;
}

export function clearProductCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

/** All products. The catalog is small, so filtering/sorting happens in the browser. */
export async function listProducts({ fresh = false } = {}) {
  if (!fresh) {
    const cached = readCache();
    if (cached) return cached;
  }
  const snap = await getDocs(collection(db, "products"));
  const products = snap.docs.map(fromDoc);
  // Never cache an empty catalog: products added a moment later must show up straight away.
  if (products.length) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), products }));
    } catch {}
  } else {
    clearProductCache();
  }
  return products;
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, "products", String(id)));
  return snap.exists() ? fromDoc(snap) : null;
}

export function getCategories(products) {
  const counts = new Map();
  products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// ---------- Admin ----------

/** Validate + clean product form input. Returns { data, errors }. */
export function sanitizeProductInput(input) {
  const errors = {};
  const text = (v, max) => String(v ?? "").trim().slice(0, max);
  const list = (v) =>
    (Array.isArray(v) ? v : String(v ?? "").split(","))
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 12);

  const data = {
    title: text(input.title, 120),
    brand: text(input.brand, 60),
    category: text(input.category, 40),
    subCategory: text(input.subCategory, 60),
    description: text(input.description, 2000),
    image: text(input.image, 20000),
    badge: text(input.badge, 30),
    price: Number(input.price),
    originalPrice: input.originalPrice === "" || input.originalPrice == null ? null : Number(input.originalPrice),
    stock: Number(input.stock),
    features: list(input.features),
    colors: list(input.colors),
    featured: Boolean(input.featured),
  };

  if (data.title.length < 3) errors.title = "Name must be at least 3 characters.";
  if (!data.category) errors.category = "Category is required.";
  if (data.description.length < 10) errors.description = "Add a description of at least 10 characters.";
  const embeddedImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(data.image) && data.image.length <= 20000;
  if (!/^https:\/\/\S+$/i.test(data.image) && !embeddedImage) errors.image = "Enter an image URL starting with https://";
  if (!Number.isFinite(data.price) || data.price <= 0) errors.price = "Price must be greater than 0.";
  if (data.originalPrice !== null && (!Number.isFinite(data.originalPrice) || data.originalPrice <= data.price)) {
    errors.originalPrice = "Original price must be higher than the price (or leave it empty).";
  }
  if (!Number.isInteger(data.stock) || data.stock < 0) errors.stock = "Stock must be a whole number, 0 or more.";

  data.price = Math.round(data.price * 100) / 100;
  if (data.originalPrice !== null) data.originalPrice = Math.round(data.originalPrice * 100) / 100;
  return { data, errors };
}

export async function createProduct(data) {
  const ref = await addDoc(collection(db, "products"), {
    ...data,
    rating: 0,
    reviews: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  clearProductCache();
  return ref.id;
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
  clearProductCache();
}

export async function setProductStock(id, stock) {
  await updateDoc(doc(db, "products", id), { stock, updatedAt: serverTimestamp() });
  clearProductCache();
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
  clearProductCache();
}

/**
 * One-time import of the original hard-coded catalog (js/data/products.seed.js).
 * Keeps the numeric ids as document ids (1..100) so existing carts still work.
 */
export async function importSeedCatalog(seedProducts) {
  const batch = writeBatch(db);
  seedProducts.forEach((p) => {
    const { id, thumbnail, discountPercentage, ...rest } = p;
    // A few seed products embed their photo as a small base64 "data:" image (~13 KB).
    // Keep it (their hosted thumbnails are dead links); anything large would not belong in Firestore.
    const image = String(rest.image).startsWith("data:") && rest.image.length > 100_000 ? "" : rest.image;
    batch.set(doc(db, "products", String(id)), {
      ...rest,
      image,
      category: rest.category === "Outdoors" ? "Outdoor" : rest.category,
      originalPrice: rest.originalPrice ?? null,
      featured: ["Best Seller", "Bestseller", "Top Rated", "Editors' Choice", "Popular", "Trending"].includes(rest.badge),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  clearProductCache();
}
