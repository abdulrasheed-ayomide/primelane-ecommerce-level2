import { auth } from "./firebase.js";
import { showToast } from "./toast.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const listeners = [];

function notifyCart() {
  listeners.forEach(callback => callback(cart));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  notifyCart();
}

// 🔐 Check if user is logged in
function isUserLoggedIn() {

  const user = auth.currentUser;

  if (!user) {

    showToast("Please sign in first", "warning");

    window.location.href = "../otherpages/login.html";
    

    return false;

  }

  return true;

}

// ✅ Add to cart
export function addToCart(product) {

  if (!isUserLoggedIn()) return;

  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();

  showToast(product.title + " added to cart", "success");

}

// ➕ Increase quantity
export function increaseQuantity(id) {

  if (!isUserLoggedIn()) return;

  const item = cart.find(item => item.id === id);

  if (item) {
    item.quantity += 1;
    saveCart();
  }

}

// ➖ Decrease quantity
export function decreaseQuantity(id) {

  if (!isUserLoggedIn()) return;

  const item = cart.find(item => item.id === id);

  if (!item) return;

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    cart = cart.filter(item => item.id !== id);
  }

  saveCart();

}

// ❌ Remove item
export function removeFromCart(id) {

  if (!isUserLoggedIn()) return;

  cart = cart.filter(item => item.id !== id);

  saveCart();

}

// 📦 Get cart
export function getCart() {
  return cart;
}

// 👂 Cart listeners
export function onCartChange(callback) {
  listeners.push(callback);
  callback(cart);
}