import "./header.js";
import { getProduct, listProducts } from "./services/products.js";
import { addToCart, getCart } from "./cart.js";
import { renderProducts, stockLabel } from "./renderProducts.js";
import { stateBlock } from "./ui.js";
import { escapeHTML, formatPrice, safeUrl, discountPercent, starsHTML, getParam, friendlyError } from "./utils.js";
import { MAX_QTY_PER_LINE } from "./config.js";
import { getStoreSettings, freeDeliveryStatus } from "./services/settings.js";

const detail = document.getElementById("productDetail");
const breadcrumb = document.getElementById("breadcrumb");

// Delivery settings (only used for the free-delivery note). Loaded in parallel with the product.
const settingsPromise = getStoreSettings({ cached: true }).catch(() => null);

function freeDeliveryNoteHTML(product, settings) {
  const free = freeDeliveryStatus(product.price, settings);
  if (!free.enabled || product.stock <= 0) return "";
  const text = free.qualifies
    ? "This item qualifies for free delivery."
    : `Spend ${formatPrice(free.threshold)} or more to qualify for free delivery.`;
  return `<p class="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" data-free-delivery><span aria-hidden="true">🚚</span>${escapeHTML(text)}</p>`;
}

function renderProduct(product, settings = null) {
  const off = discountPercent(product.price, product.originalPrice);
  const soldOut = product.stock <= 0;
  const inCart = getCart().find((i) => i.id === product.id)?.quantity ?? 0;
  const maxQty = Math.max(0, Math.min(product.stock, MAX_QTY_PER_LINE) - inCart);

  document.title = `${product.title} | PrimeLane`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", product.description.slice(0, 155));

  breadcrumb.innerHTML = `
    <a href="/index.html" class="hover:text-indigo-600">Home</a> /
    <a href="/pages/shop.html" class="hover:text-indigo-600">Shop</a> /
    <a href="/pages/shop.html?category=${encodeURIComponent(product.category)}" class="hover:text-indigo-600">${escapeHTML(product.category)}</a> /
    <span class="text-gray-700 dark:text-gray-300" aria-current="page">${escapeHTML(product.title)}</span>`;

  detail.innerHTML = `
  <div class="grid gap-8 md:grid-cols-2 lg:gap-12">
    <div class="relative self-start overflow-hidden rounded-2xl bg-gray-100 md:sticky md:top-24 dark:bg-gray-800">
      <img src="${escapeHTML(safeUrl(product.image))}" alt="${escapeHTML(product.title)}" width="800" height="800"
        class="aspect-square w-full object-cover ${soldOut ? "opacity-70 grayscale" : ""}" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
      ${off ? `<span class="badge absolute left-4 top-4 bg-red-600 px-3 py-1 text-sm text-white">-${off}%</span>` : ""}
    </div>

    <div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <a href="/pages/shop.html?category=${encodeURIComponent(product.category)}" class="badge bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200">${escapeHTML(product.category)}</a>
        ${product.subCategory ? `<span class="text-gray-500">${escapeHTML(product.subCategory)}</span>` : ""}
        ${product.badge ? `<span class="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">${escapeHTML(product.badge)}</span>` : ""}
      </div>

      <h1 class="mt-3 text-2xl font-bold leading-tight sm:text-3xl">${escapeHTML(product.title)}</h1>
      ${product.brand ? `<p class="mt-1 text-gray-500 dark:text-gray-400">by <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHTML(product.brand)}</span></p>` : ""}
      ${product.rating ? `<div class="mt-3">${starsHTML(product.rating, product.reviews)}</div>` : ""}

      <div class="mt-6 flex flex-wrap items-baseline gap-3">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">${formatPrice(product.price)}</span>
        ${off ? `<span class="text-lg text-gray-500 line-through">${formatPrice(product.originalPrice)}</span>
                 <span class="text-sm font-semibold text-red-600 dark:text-red-400">You save ${formatPrice(product.originalPrice - product.price)}</span>` : ""}
      </div>
      <div class="mt-2">${stockLabel(product.stock)}</div>
      ${settings ? freeDeliveryNoteHTML(product, settings) : ""}

      <div class="mt-6 border-y border-gray-200 py-6 dark:border-gray-800">
        ${soldOut
          ? `<p class="rounded-lg bg-gray-100 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">This product is currently out of stock. Check back soon or browse <a class="font-medium text-indigo-600 underline" href="/pages/shop.html?category=${encodeURIComponent(product.category)}">similar products</a>.</p>`
          : maxQty === 0
            ? `<p class="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">You already have the maximum available quantity in your cart. <a href="/pages/cartpage.html" class="font-medium underline">View cart</a></p>`
            : `
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="flex items-center justify-between rounded-lg border border-gray-300 sm:justify-start dark:border-gray-700" role="group" aria-label="Quantity">
              <button type="button" class="icon-btn h-12 w-12" data-qty="-1" aria-label="Decrease quantity">−</button>
              <label for="qtyInput" class="sr-only">Quantity</label>
              <input id="qtyInput" type="number" inputmode="numeric" min="1" max="${maxQty}" value="1" class="h-12 w-16 border-0 bg-transparent text-center font-semibold focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none">
              <button type="button" class="icon-btn h-12 w-12" data-qty="1" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" id="addToCartBtn" class="btn-primary btn-lg flex-1">Add to cart</button>
          </div>
          ${inCart ? `<p class="mt-3 text-sm text-gray-500">${inCart} already in your cart.</p>` : ""}`}
      </div>

      <div class="mt-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold">Description</h2>
          <p class="mt-2 leading-relaxed whitespace-pre-line text-gray-600 dark:text-gray-400">${escapeHTML(product.description)}</p>
        </div>
        ${product.features.length ? `
        <div>
          <h2 class="text-lg font-semibold">Features</h2>
          <ul class="mt-2 grid gap-2 sm:grid-cols-2">
            ${product.features.map((f) => `<li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><svg class="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>${escapeHTML(f)}</li>`).join("")}
          </ul>
        </div>` : ""}
        ${product.colors.length ? `
        <div>
          <h2 class="text-lg font-semibold">Available colours</h2>
          <p class="mt-2 flex flex-wrap gap-2">${product.colors.map((c) => `<span class="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">${escapeHTML(c)}</span>`).join("")}</p>
        </div>` : ""}
      </div>
    </div>
  </div>`;
  detail.setAttribute("aria-busy", "false");

  const qtyInput = document.getElementById("qtyInput");
  const clampQty = () => {
    const v = Math.max(1, Math.min(maxQty, Math.floor(Number(qtyInput.value) || 1)));
    qtyInput.value = v;
    return v;
  };
  detail.querySelectorAll("[data-qty]").forEach((btn) =>
    btn.addEventListener("click", () => {
      qtyInput.value = Number(qtyInput.value) + Number(btn.dataset.qty);
      clampQty();
    })
  );
  qtyInput?.addEventListener("change", clampQty);
  document.getElementById("addToCartBtn")?.addEventListener("click", () => {
    if (addToCart(product, clampQty())) renderProduct(product, settings); // refresh "already in cart" limits
  });
}

async function loadRelated(product) {
  try {
    const all = await listProducts();
    const related = all
      .filter((p) => p.id !== product.id && p.category === product.category && p.stock > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
    if (!related.length) return;
    renderProducts(related, document.getElementById("relatedProducts"));
    document.getElementById("relatedSection").classList.remove("hidden");
  } catch {
    /* related products are optional; ignore errors */
  }
}

async function load() {
  const id = getParam("id");
  if (!id) {
    detail.innerHTML = stateBlock({ icon: "search", title: "Product not found", message: "This link is missing a product.", action: { label: "Browse products", href: "/pages/shop.html" } });
    return;
  }
  try {
    const product = await getProduct(id);
    if (!product) {
      detail.innerHTML = stateBlock({ icon: "search", title: "Product not found", message: "It may have been removed from the store.", action: { label: "Browse products", href: "/pages/shop.html" } });
      return;
    }
    renderProduct(product, await settingsPromise);
    loadRelated(product);
  } catch (error) {
    console.error(error);
    detail.innerHTML = stateBlock({ icon: "error", title: "Couldn't load this product", message: friendlyError(error), action: { label: "Try again", id: "retryProduct" } });
    document.getElementById("retryProduct").addEventListener("click", load);
  }
}

load();
