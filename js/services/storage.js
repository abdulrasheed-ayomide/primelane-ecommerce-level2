// Optional product image uploads with Firebase Storage.
// Disabled by default (ENABLE_IMAGE_UPLOADS in js/config.js) because Storage needs the Blaze plan.
// The Storage SDK is loaded only when an upload actually happens.
import { app } from "../firebase.js";

const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadProductImage(file) {
  if (!file.type.startsWith("image/")) throw Object.assign(new Error("not image"), { userMessage: "Choose an image file." });
  if (file.size > MAX_BYTES) throw Object.assign(new Error("too big"), { userMessage: "Images must be smaller than 2 MB." });

  const { getStorage, ref, uploadBytes, getDownloadURL } = await import(
    "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js"
  );
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
  const fileRef = ref(getStorage(app), `products/${Date.now()}-${safeName}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
