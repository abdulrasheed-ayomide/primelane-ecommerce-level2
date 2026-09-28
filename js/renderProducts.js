// Product cards + loading skeletons, used by home, shop and product pages.
import { addToCart } from "./cart.js";
import { openModal } from "./productModal.js";
import { escapeHTML, formatPrice, safeUrl, discountPercent, starsHTML } from "./utils.js";
import { LOW_STOCK_THRESHOLD } from "./config.js";

export function productUrl(id) {
  return `/pages/product.html?id=${encodeURIComponent(id)}`;
}

export function stockLabel(stock) {
  if (stock <= 0) return `<span class="text-sm font-medium text-red-600 dark:text-red-400">Out of stock</span>`;
  if (stock <= LOW_STOCK_THRESHOLD) return `<span class="text-sm font-medium text-amber-700 dark:text-amber-400">Only ${stock} left</span>`;
  return `<span class="text-sm font-medium text-green-700 dark:text-green-400">In stock</span>`;
}

export function productCardHTML(product) {
  const { id, title, category, price, originalPrice, rating, reviews, stock, badge } = product;
  const url = productUrl(id);
  const off = discountPercent(price, originalPrice);
  const soldOut = stock <= 0;

  return `
  <article class="group card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg" data-product-id="${escapeHTML(id)}">
    <a href="${url}" class="relative block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800" tabindex="-1" aria-hidden="true">
      <img src="${escapeHTML(safeUrl(product.image))}" alt="" loading="lazy" decoding="async" width="400" height="400"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105 ${soldOut ? "opacity-60 grayscale" : ""}"
        onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
      <span class="absolute left-3 top-3 flex flex-col items-start gap-1">
        ${off ? `<span class="badge bg-red-600 text-white">-${off}%</span>` : ""}
        ${badge && !soldOut ? `<span class="badge bg-white/90 text-gray-900 shadow-sm dark:bg-gray-900/90 dark:text-white">${escapeHTML(badge)}</span>` : ""}
        ${soldOut ? `<span class="badge bg-gray-900 text-white">Sold out</span>` : ""}
      </span>
    </a>

    <div class="flex flex-1 flex-col p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">${escapeHTML(category)}</p>
      <h3 class="mt-1 line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug">
        <a href="${url}" class="hover:text-indigo-600 dark:hover:text-indigo-400">${escapeHTML(title)}</a>
      </h3>
      <div class="mt-2">${starsHTML(rating, reviews)}</div>
      <div class="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span class="text-lg font-bold text-gray-900 dark:text-white">${formatPrice(price)}</span>
        ${off ? `<span class="text-sm text-gray-500 line-through">${formatPrice(originalPrice)}</span>` : ""}
      </div>
      <div class="mt-1">${stockLabel(stock)}</div>

      <div class="mt-auto flex gap-2 pt-4">
        <button type="button" data-action="add" class="btn-primary flex-1" ${soldOut ? "disabled" : ""}
          aria-label="Add ${escapeHTML(title)} to cart">${soldOut ? "Sold out" : "Add to cart"}</button>
        <button type="button" data-action="quick-view" class="btn-secondary px-3" aria-label="Quick view: ${escapeHTML(title)}">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

export function skeletonCardsHTML(count = 8) {
  return Array.from({ length: count }, () => `
    <div class="card overflow-hidden" aria-hidden="true">
      <div class="skeleton aspect-square rounded-none"></div>
      <div class="space-y-3 p-4">
        <div class="skeleton h-3 w-1/3"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-2/3"></div>
        <div class="skeleton h-5 w-1/2"></div>
        <div class="skeleton h-10 w-full"></div>
      </div>
    </div>`).join("");
}

/**
 * Render product cards into a container. One click listener per container
 * (event delegation) handles every card's buttons.
 */
export function renderProducts(products, container) {
  if (!container || !Array.isArray(products)) return;
  container.innerHTML = products.map(productCardHTML).join("");
  container.setAttribute("aria-busy", "false");

  container._products = new Map(products.map((p) => [String(p.id), p]));
  if (container.dataset.cardsBound) return;
  container.dataset.cardsBound = "true";

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest("[data-product-id]");
    const product = container._products.get(card?.dataset.productId);
    if (!product) return;
    if (button.dataset.action === "add") addToCart(product);
    if (button.dataset.action === "quick-view") openModal(product, button);
  });
}
