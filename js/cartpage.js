import "./header.js";
import {
  onCartChange,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
} from "./cart.js";
import { showToast } from "./toast.js";


const container = document.getElementById("cartPageContainer");
const summary = document.getElementById("cartSummary");
const subtotalEl = document.getElementById("subtotal");
const grandTotalEl = document.getElementById("grandTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

checkoutBtn.addEventListener("click", () => {
  showToast("Checking out...", "info");

      setTimeout(() => {
      window.location.href = "../pages/checkout.html";
    }, 1500);

});




onCartChange((cart) => {

  container.innerHTML = "";

  if (cart.length === 0) {
    summary.classList.add("hidden");

    container.innerHTML = `
      <div class="text-center py-20">
        <h2 class="text-xl font-semibold mb-3">
          Your cart is empty 🛒
        </h2>
        <a href="shop.html"
           class="bg-indigo-600 text-white px-6 py-3 rounded-lg">
          Continue Shopping
        </a>
      </div>
    `;
    return;
  }

  summary.classList.remove("hidden");

  let subtotal = 0;

  cart.forEach(item => {

    subtotal += item.price * item.quantity;

    const div = document.createElement("div");
    div.className =
      "bg-white dark:bg-gray-800 p-5 rounded-xl shadow flex flex-col sm:flex-row gap-6";

    div.innerHTML = `
      <img src="${item.image}"
           class="w-full sm:w-40 h-40 object-cover rounded-lg">

      <div class="flex-1">

        <h3 class="text-lg font-semibold mb-2">
          ${item.title}
        </h3>

        <p class="text-indigo-600 font-bold mb-3">
          $${item.price}
        </p>

        <div class="flex items-center gap-3 mb-3">
          <button  class="border border-gray-400 dark:border-gray-600 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition decrease">-</button>
          <span>${item.quantity}</span>
          <button class="border border-gray-400 dark:border-gray-600 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition increase">+</button>
        </div>

        <button class="text-red-500 remove">
          Remove
        </button>

      </div>
    `;

    div.querySelector(".increase")
      .addEventListener("click", () =>
        increaseQuantity(item.id)
      );

    div.querySelector(".decrease")
      .addEventListener("click", () =>
        decreaseQuantity(item.id)
      );

    div.querySelector(".remove")
      .addEventListener("click", () =>
        removeFromCart(item.id)
      );

    container.appendChild(div);
  });

  const delivery = 10;
  const grandTotal = subtotal + delivery;

  subtotalEl.textContent = subtotal.toFixed(2);
  grandTotalEl.textContent = grandTotal.toFixed(2);
});