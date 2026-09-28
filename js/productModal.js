// Quick-view dialog for a product. Built on the native <dialog> element,
// which traps focus, closes on Escape and restores focus automatically.
import { addToCart } from "./cart.js";
import { escapeHTML, formatPrice, safeUrl, discountPercent, starsHTML } from "./utils.js";

let dialog;
let currentProduct = null;

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "productModal";
  dialog.setAttribute("aria-labelledby", "modalTitle");
  dialog.className =
    "w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-gray-800 shadow-2xl dark:bg-gray-900 dark:text-gray-100";
  document.body.appendChild(dialog);

  // click on the backdrop closes the dialog
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) dialog.close();
    if (e.target.closest("#modalAddToCart") && currentProduct) {
      const qty = Number(dialog.querySelector("#modalQty")?.value) || 1;
      if (addToCart(currentProduct, qty)) dialog.close();
    }
  });
  return dialog;
}

export function openModal(product) {
  currentProduct = product;
  const d = ensureDialog();
  const off = discountPercent(product.price, product.originalPrice);
  const soldOut = product.stock <= 0;
  const maxQty = Math.min(product.stock, 20);

  d.innerHTML = `
    <div class="grid max-h-[90vh] overflow-y-auto md:grid-cols-2">
      <div class="aspect-square bg-gray-100 dark:bg-gray-800">
        <img id="modalImage" src="${escapeHTML(safeUrl(product.image))}" alt="${escapeHTML(product.title)}" class="h-full w-full object-cover"
          onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
      </div>
      <div class="flex flex-col p-6">
        <div class="flex items-start justify-between gap-4">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">${escapeHTML(product.category)}</p>
          <button type="button" data-close class="icon-btn -mr-2 -mt-2" aria-label="Close">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <h2 id="modalTitle" class="mt-1 text-xl font-bold">${escapeHTML(product.title)}</h2>
        <div class="mt-2">${starsHTML(product.rating, product.reviews)}</div>
        <div class="mt-4 flex flex-wrap items-baseline gap-2">
          <span class="text-2xl font-bold">${formatPrice(product.price)}</span>
          ${off ? `<span class="text-gray-500 line-through">${formatPrice(product.originalPrice)}</span><span class="badge bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Save ${off}%</span>` : ""}
        </div>
        <p class="mt-4 line-clamp-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">${escapeHTML(product.description)}</p>
        <p class="mt-4 text-sm font-medium ${soldOut ? "text-red-600" : "text-green-700 dark:text-green-400"}">
          ${soldOut ? "Out of stock" : `In stock (${product.stock} available)`}
        </p>
        <div class="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
          ${soldOut ? "" : `
          <label class="sr-only" for="modalQty">Quantity</label>
          <select id="modalQty" class="input sm:w-24">
            ${Array.from({ length: maxQty }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
          </select>`}
          <button type="button" id="modalAddToCart" class="btn-primary flex-1" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold out" : "Add to cart"}</button>
        </div>
        <a href="/pages/product.html?id=${encodeURIComponent(product.id)}" class="mt-3 text-center text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">View full details →</a>
      </div>
    </div>`;
  d.showModal();
}
