import "./header.js";
import {
  onCartChange, increaseQuantity, decreaseQuantity, removeFromCart, setQuantity,
  clearCart, cartSubtotal, syncCartWithProducts,
} from "./cart.js";
import { listProducts } from "./services/products.js";
import { getStoreSettings, shippingFor } from "./services/settings.js";
import { confirmDialog, stateBlock } from "./ui.js";
import { escapeHTML, formatPrice, safeUrl } from "./utils.js";
import { DEFAULT_DELIVERY_FEE, MAX_QTY_PER_LINE } from "./config.js";

const list = document.getElementById("cartPageContainer");
const layout = document.getElementById("cartLayout");
const notice = document.getElementById("cartNotice");
let settings = { deliveryFee: DEFAULT_DELIVERY_FEE, freeDeliveryThreshold: 0 };

function itemHTML(item) {
  const max = Math.min(item.stock, MAX_QTY_PER_LINE);
  const url = `/pages/product.html?id=${encodeURIComponent(item.id)}`;
  return `
  <li class="flex gap-4 p-4 sm:p-5" data-id="${escapeHTML(item.id)}">
    <a href="${url}" class="shrink-0" tabindex="-1" aria-hidden="true">
      <img src="${escapeHTML(safeUrl(item.image))}" alt="" loading="lazy" class="h-20 w-20 rounded-lg bg-gray-100 object-cover sm:h-28 sm:w-28 dark:bg-gray-800"
        onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
    </a>
    <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h3 class="line-clamp-2 font-semibold"><a href="${url}" class="hover:text-indigo-600 dark:hover:text-indigo-400">${escapeHTML(item.title)}</a></h3>
        <p class="mt-1 text-sm text-gray-500">${formatPrice(item.price)} each</p>
        ${item.stock <= 5 ? `<p class="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">Only ${item.stock} left</p>` : ""}
      </div>
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-end">
        <div class="flex items-center rounded-lg border border-gray-300 dark:border-gray-700" role="group" aria-label="Quantity for ${escapeHTML(item.title)}">
          <button type="button" data-action="decrease" class="icon-btn h-9 w-9" aria-label="Decrease quantity" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
          <input type="number" data-action="set" value="${item.quantity}" min="1" max="${max}" inputmode="numeric" aria-label="Quantity"
            class="h-9 w-12 border-0 bg-transparent text-center text-sm font-semibold focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none">
          <button type="button" data-action="increase" class="icon-btn h-9 w-9" aria-label="Increase quantity" ${item.quantity >= max ? "disabled" : ""}>+</button>
        </div>
        <p class="font-semibold tabular-nums">${formatPrice(item.price * item.quantity)}</p>
        <button type="button" data-action="remove" class="w-full py-1 text-left text-sm font-medium text-red-600 hover:underline sm:w-auto sm:text-right dark:text-red-400">Remove</button>
      </div>
    </div>
  </li>`;
}

function renderSummary(cart) {
  const subtotal = cartSubtotal(cart);
  const delivery = shippingFor(subtotal, settings);
  document.getElementById("itemCount").textContent = cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("delivery").textContent = delivery === 0 ? "Free" : formatPrice(delivery);
  document.getElementById("grandTotal").textContent = formatPrice(subtotal + delivery);

  const hint = document.getElementById("freeDeliveryHint");
  const remaining = settings.freeDeliveryThreshold - subtotal;
  if (settings.freeDeliveryThreshold > 0 && remaining > 0) {
    hint.textContent = `Add ${formatPrice(remaining)} more to get free delivery.`;
    hint.classList.remove("hidden");
  } else {
    hint.classList.add("hidden");
  }
}

function render(cart) {
  if (!cart.length) {
    layout.innerHTML = `<div class="card lg:col-span-2">${stateBlock({
      title: "Your cart is empty",
      message: "Looks like you haven't added anything yet.",
      action: { label: "Start shopping", href: "/pages/shop.html" },
    })}</div>`;
    return;
  }
  list.innerHTML = cart.map(itemHTML).join("");
  renderSummary(cart);
}

list.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action]");
  const id = e.target.closest("[data-id]")?.dataset.id;
  if (!button || !id) return;
  if (button.dataset.action === "increase") increaseQuantity(id);
  if (button.dataset.action === "decrease") decreaseQuantity(id);
  if (button.dataset.action === "remove") removeFromCart(id);
});
list.addEventListener("change", (e) => {
  if (e.target.dataset.action !== "set") return;
  const id = e.target.closest("[data-id]").dataset.id;
  const applied = setQuantity(id, e.target.value);
  e.target.value = applied;
});

document.getElementById("clearCartBtn").addEventListener("click", async () => {
  const ok = await confirmDialog({ title: "Remove all items?", message: "This empties your cart.", confirmText: "Remove all", danger: true });
  if (ok) clearCart();
});

onCartChange(render);

// Refresh prices/stock from the database so the cart never shows stale data.
(async function refresh() {
  try {
    const [products, storeSettings] = await Promise.all([listProducts({ fresh: true }), getStoreSettings()]);
    settings = storeSettings;
    const notes = syncCartWithProducts(new Map(products.map((p) => [p.id, p])));
    if (notes.length) {
      notice.innerHTML = `<p class="font-semibold">Your cart was updated</p><ul class="mt-1 list-disc pl-5">${notes.map((n) => `<li>${escapeHTML(n)}</li>`).join("")}</ul>`;
      notice.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Could not refresh cart", error);
  }
})();
