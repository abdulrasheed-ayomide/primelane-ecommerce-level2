import "./header.js";
import { getCart } from "./cart.js";
import { showToast } from "./toast.js";
import { auth, db } from "./firebase.js";

import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const container = document.getElementById("checkoutItems");
const totalElement = document.getElementById("checkoutTotal");
const form = document.getElementById("checkoutForm");

const cart = getCart();

let total = 0;

if (cart.length === 0) {
  container.innerHTML = "<p>Your cart is empty.</p>";
} else {

  cart.forEach(item => {

    const subtotal = item.price * item.quantity;
    total += subtotal;

    const div = document.createElement("div");
    div.className = "border p-3 rounded-lg";

    div.innerHTML = `
      <h4 class="font-semibold">${item.title}</h4>
      <p>$${item.price} × ${item.quantity}</p>
      <p class="font-bold">Subtotal: $${subtotal.toFixed(2)}</p>
    `;

    container.appendChild(div);

  });

}

totalElement.textContent = total.toFixed(2);

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    showToast("Please login first", "warning");
    return;
  }

  try {

    // 🔥 SAVE ORDER TO FIREBASE
    await addDoc(collection(db, "orders"), {

      userEmail: user.email,
      items: cart,
      total: total,
      createdAt: serverTimestamp()

    });

    showToast("Order placed successfully!", "success");

    // clear cart
    localStorage.removeItem("cart");

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1500);

  } catch (error) {

    console.error(error);
    showToast("Failed to place order", "error");

  }

});