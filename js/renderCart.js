import {
  onCartChange,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
} from "./cart.js";

const cartItemsContainer = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

onCartChange((cart) => {

  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "border-b py-3";

    div.innerHTML = `
      <h3 class="font-semibold">${item.title}</h3>

      <p>$${item.price} × ${item.quantity}</p>

      <div class="flex gap-2 mt-2">
        <button class="bg-gray-500 px-2 decrease">-</button>
        <button class="bg-gray-500 text-black px-2 increase">+</button>
        <button class="text-red-500 remove">Remove</button>
      </div>
    `;

    div.querySelector(".increase")
      .addEventListener("click", () => increaseQuantity(item.id));

    div.querySelector(".decrease")
      .addEventListener("click", () => decreaseQuantity(item.id));

    div.querySelector(".remove")
      .addEventListener("click", () => removeFromCart(item.id));

    cartItemsContainer.appendChild(div);
  });

  cartTotal.textContent = total.toFixed(2);
});