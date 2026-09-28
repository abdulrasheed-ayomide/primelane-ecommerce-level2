import "./header.js";
import { listProducts, getCategories } from "./services/products.js";
import { sendMessage } from "./services/messages.js";
import { getStoreSettings, freeDeliveryStatus } from "./services/settings.js";
import { renderProducts, skeletonCardsHTML, productUrl } from "./renderProducts.js";
import { escapeHTML, safeUrl, discountPercent, formatPrice, friendlyError } from "./utils.js";
import { stateBlock, validateForm, validators, setButtonLoading } from "./ui.js";
import { showToast } from "./toast.js";

const featuredEl = document.getElementById("featuredProducts");
const topRatedEl = document.getElementById("topRatedProducts");
const categoryEl = document.getElementById("categoryGrid");

featuredEl.innerHTML = skeletonCardsHTML(4);
topRatedEl.innerHTML = skeletonCardsHTML(4);
categoryEl.innerHTML = Array.from({ length: 6 }, () => `<div class="skeleton aspect-[4/3] rounded-xl"></div>`).join("");

async function loadHome() {
  try {
    const products = await listProducts();

    if (!products.length) {
      const empty = stateBlock({ title: "No products yet", message: "Products will appear here once the store is stocked." });
      featuredEl.innerHTML = empty;
      topRatedEl.innerHTML = "";
      categoryEl.innerHTML = "";
      return;
    }

    renderStats(products);
    renderCategories(products);

    const inStockFirst = (a, b) => (b.stock > 0) - (a.stock > 0);
    const featured = products.filter((p) => p.featured).sort(inStockFirst);
    renderProducts((featured.length ? featured : products).slice(0, 8), featuredEl);

    const topRated = [...products]
      .filter((p) => !p.featured && p.stock > 0)
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 4);
    renderProducts(topRated, topRatedEl);

    renderPromo(products);
  } catch (error) {
    console.error(error);
    const block = stateBlock({ icon: "error", title: "Couldn't load products", message: friendlyError(error), action: { label: "Try again", id: "retryHome" } });
    featuredEl.innerHTML = block;
    topRatedEl.innerHTML = "";
    categoryEl.innerHTML = "";
    document.getElementById("retryHome")?.addEventListener("click", () => location.reload());
  }
}

function renderStats(products) {
  const set = (key, value) => document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => (el.textContent = value));
  const rated = products.filter((p) => p.rating > 0);
  const avg = rated.reduce((s, p) => s + p.rating, 0) / (rated.length || 1);
  set("products", products.length);
  set("categories", getCategories(products).length);
  set("rating", rated.length ? `${avg.toFixed(1)}/5` : "—");

  const maxOff = Math.max(0, ...products.filter((p) => p.stock > 0).map((p) => discountPercent(p.price, p.originalPrice)));
  if (maxOff > 0) {
    set("maxDiscount", maxOff);
    document.getElementById("heroDeal").hidden = false;
  }
}

function renderCategories(products) {
  const categories = getCategories(products).slice(0, 12);
  categoryEl.innerHTML = categories
    .map(({ name, count }) => {
      const cover = products.find((p) => p.category === name && p.image);
      return `
      <a href="/pages/shop.html?category=${encodeURIComponent(name)}" class="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
        <img src="${escapeHTML(safeUrl(cover?.image))}" alt="" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
        <span class="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"></span>
        <span class="absolute inset-x-0 bottom-0 p-3 text-white">
          <span class="block truncate font-semibold">${escapeHTML(name)}</span>
          <span class="text-xs text-white/80">${count} product${count === 1 ? "" : "s"}</span>
        </span>
      </a>`;
    })
    .join("");
  categoryEl.setAttribute("aria-busy", "false");
}

function renderPromo(products) {
  const best = products
    .filter((p) => p.stock > 0 && discountPercent(p.price, p.originalPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice))[0];
  if (!best) return;
  const off = discountPercent(best.price, best.originalPrice);
  document.getElementById("promoTitle").textContent = `${off}% off ${best.title}`;
  document.getElementById("promoText").textContent = `Now ${formatPrice(best.price)} (was ${formatPrice(best.originalPrice)}). While stock lasts: ${best.stock} left.`;
  document.getElementById("promoLink").href = productUrl(best.id);
  const img = document.getElementById("promoImage");
  img.src = safeUrl(best.image);
  img.alt = best.title;
  document.getElementById("promoSection").hidden = false;
}

/* ---------- Contact form ---------- */

const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const valid = validateForm(contactForm, {
    name: validators.required("Your name"),
    email: validators.email,
    subject: validators.required("Subject"),
    message: (v) => (v.length >= 10 ? "" : "Please write at least 10 characters."),
  });
  if (!valid) return;

  const restore = setButtonLoading(contactForm.querySelector('button[type="submit"]'), "Sending…");
  try {
    const f = contactForm.elements;
    await sendMessage({ name: f.name.value.trim(), email: f.email.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim() });
    contactForm.reset();
    showToast("Message sent. We'll get back to you soon.", "success");
  } catch (error) {
    showToast(friendlyError(error), "error");
  } finally {
    restore();
  }
});

/* ---------- Back to top ---------- */

const backToTop = document.getElementById("backToTop");
let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const show = window.scrollY > 600;
    backToTop.classList.toggle("invisible", !show);
    backToTop.classList.toggle("opacity-0", !show);
    ticking = false;
  });
}, { passive: true });
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Free-delivery offer (only when configured in Admin → Settings) ---------- */

getStoreSettings({ cached: true })
  .then((settings) => {
    const free = freeDeliveryStatus(0, settings);
    if (!free.enabled) return;
    const promo = document.getElementById("freeDeliveryPromo");
    promo.querySelector("[data-text]").textContent = `Free delivery on orders of ${formatPrice(free.threshold)} or more`;
    promo.hidden = false;
  })
  .catch(() => {}); // the offer is optional; never block the page

loadHome();
