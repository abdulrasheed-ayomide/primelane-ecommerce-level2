import "./header.js";
import { listProducts, getCategories } from "./services/products.js";
import { renderProducts, skeletonCardsHTML } from "./renderProducts.js";
import { stateBlock } from "./ui.js";
import { debounce, discountPercent, escapeHTML, friendlyError, formatPrice } from "./utils.js";
import { PRODUCTS_PER_PAGE } from "./config.js";

const els = {
  grid: document.getElementById("productGrid"),
  search: document.getElementById("searchInput"),
  sort: document.getElementById("sortSelect"),
  categoryList: document.getElementById("categoryList"),
  min: document.getElementById("minPrice"),
  max: document.getElementById("maxPrice"),
  inStock: document.getElementById("inStockOnly"),
  onSale: document.getElementById("onSaleOnly"),
  clear: document.getElementById("clearFilters"),
  count: document.getElementById("resultCount"),
  chips: document.getElementById("activeChips"),
  pagination: document.getElementById("pagination"),
  title: document.getElementById("shopTitle"),
  filtersToggle: document.getElementById("filtersToggle"),
  filtersPanel: document.getElementById("filtersPanel"),
  filterCount: document.getElementById("filterCount"),
};

let allProducts = [];

// Filter state lives in the URL, so filtered pages can be shared and the back button works.
const params = new URLSearchParams(location.search);
const state = {
  q: params.get("q") ?? "",
  // "Home" was renamed to "Home & Kitchen" so it can't be confused with the Home page; keep old links working.
  category: params.get("category") === "Home" ? "Home & Kitchen" : params.get("category") ?? "all",
  min: params.get("min") ?? "",
  max: params.get("max") ?? "",
  inStock: params.get("instock") === "1",
  sale: params.get("sale") === "1",
  sort: params.get("sort") ?? "featured",
  page: Math.max(1, Number(params.get("page")) || 1),
};

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.category !== "all") p.set("category", state.category);
  if (state.min) p.set("min", state.min);
  if (state.max) p.set("max", state.max);
  if (state.inStock) p.set("instock", "1");
  if (state.sale) p.set("sale", "1");
  if (state.sort !== "featured") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  const min = state.min === "" ? null : Number(state.min);
  const max = state.max === "" ? null : Number(state.max);

  let list = allProducts.filter((p) => {
    if (q && !`${p.title} ${p.brand} ${p.category} ${p.subCategory}`.toLowerCase().includes(q)) return false;
    if (state.category !== "all" && p.category !== state.category) return false;
    if (min !== null && p.price < min) return false;
    if (max !== null && p.price > max) return false;
    if (state.inStock && p.stock <= 0) return false;
    if (state.sale && !discountPercent(p.price, p.originalPrice)) return false;
    return true;
  });

  const sorters = {
    featured: (a, b) => (b.stock > 0) - (a.stock > 0) || b.featured - a.featured || b.reviews - a.reviews,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    discount: (a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice),
    name: (a, b) => a.title.localeCompare(b.title),
    "name-desc": (a, b) => b.title.localeCompare(a.title),
  };
  list = [...list].sort(sorters[state.sort] ?? sorters.featured);
  return list;
}

function render() {
  const results = applyFilters();
  const pages = Math.max(1, Math.ceil(results.length / PRODUCTS_PER_PAGE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PRODUCTS_PER_PAGE;
  const pageItems = results.slice(start, start + PRODUCTS_PER_PAGE);

  els.title.textContent = state.sale ? "Deals" : state.category !== "all" ? state.category : "All products";
  document.title = `${els.title.textContent} | PrimeLane`;

  if (!results.length) {
    els.grid.innerHTML = stateBlock({
      icon: "search",
      title: "No products match your filters",
      message: state.q ? `We couldn't find anything for "${state.q}". Try a different word or clear some filters.` : "Try widening the price range or clearing some filters.",
      action: { label: "Clear all filters", id: "emptyClear" },
    });
    document.getElementById("emptyClear").addEventListener("click", clearAll);
  } else {
    renderProducts(pageItems, els.grid);
  }

  els.count.textContent = results.length
    ? `Showing ${start + 1}–${start + pageItems.length} of ${results.length} product${results.length === 1 ? "" : "s"}`
    : "0 products";

  renderChips();
  renderPagination(pages);
  renderCategoryList();
  syncUrl();
}

function renderCategoryList() {
  const categories = getCategories(allProducts);
  const option = (value, label, count) => `
    <label class="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
      <span class="flex items-center gap-2"><input type="radio" name="category" value="${escapeHTML(value)}" class="accent-indigo-600" ${state.category === value ? "checked" : ""}> ${escapeHTML(label)}</span>
      <span class="text-xs text-gray-500">${count}</span>
    </label>`;
  els.categoryList.innerHTML =
    option("all", "All categories", allProducts.length) + categories.map((c) => option(c.name, c.name, c.count)).join("");
}

function renderChips() {
  const chips = [];
  if (state.q) chips.push(["q", `“${state.q}”`]);
  if (state.category !== "all") chips.push(["category", state.category]);
  if (state.min) chips.push(["min", `From ${formatPrice(state.min)}`]);
  if (state.max) chips.push(["max", `Up to ${formatPrice(state.max)}`]);
  if (state.inStock) chips.push(["inStock", "In stock"]);
  if (state.sale) chips.push(["sale", "On sale"]);

  els.chips.innerHTML = chips
    .map(([key, label]) => `
      <button type="button" data-chip="${key}" class="badge gap-1.5 bg-indigo-100 py-1 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200" aria-label="Remove filter ${escapeHTML(label)}">
        ${escapeHTML(label)} <span aria-hidden="true">×</span>
      </button>`)
    .join("");

  const filterTotal = chips.filter(([k]) => k !== "q").length;
  els.filterCount.textContent = filterTotal;
  els.filterCount.classList.toggle("hidden", filterTotal === 0);
}

function renderPagination(pages) {
  if (pages <= 1) {
    els.pagination.innerHTML = "";
    return;
  }
  const btn = (page, label, { disabled = false, current = false, aria } = {}) =>
    `<button type="button" data-page="${page}" class="${current ? "btn-primary" : "btn-secondary"} min-w-10 px-3" ${disabled ? "disabled" : ""} ${current ? 'aria-current="page"' : ""} ${aria ? `aria-label="${aria}"` : ""}>${label}</button>`;

  // show first, last, current ±1, with gaps
  const nums = new Set([1, pages, state.page - 1, state.page, state.page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...nums].sort((a, b) => a - b);
  let html = btn(state.page - 1, "‹", { disabled: state.page === 1, aria: "Previous page" });
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) html += `<span class="px-1 text-gray-400">…</span>`;
    html += btn(n, n, { current: n === state.page, aria: `Page ${n}` });
  });
  html += btn(state.page + 1, "›", { disabled: state.page === pages, aria: "Next page" });
  els.pagination.innerHTML = html;
}

function update(changes, { resetPage = true } = {}) {
  Object.assign(state, changes);
  if (resetPage) state.page = 1;
  render();
}

function clearAll() {
  Object.assign(state, { q: "", category: "all", min: "", max: "", inStock: false, sale: false, page: 1 });
  syncControls();
  render();
}

function syncControls() {
  els.search.value = state.q;
  els.sort.value = state.sort;
  els.min.value = state.min;
  els.max.value = state.max;
  els.inStock.checked = state.inStock;
  els.onSale.checked = state.sale;
}

/* ---------- Events ---------- */

els.search.addEventListener("input", debounce(() => update({ q: els.search.value }), 250));
els.sort.addEventListener("change", () => update({ sort: els.sort.value }));
els.min.addEventListener("input", debounce(() => update({ min: els.min.value }), 400));
els.max.addEventListener("input", debounce(() => update({ max: els.max.value }), 400));
els.inStock.addEventListener("change", () => update({ inStock: els.inStock.checked }));
els.onSale.addEventListener("change", () => update({ sale: els.onSale.checked }));
els.clear.addEventListener("click", clearAll);
els.categoryList.addEventListener("change", (e) => {
  if (e.target.name === "category") update({ category: e.target.value });
});
els.chips.addEventListener("click", (e) => {
  const key = e.target.closest("[data-chip]")?.dataset.chip;
  if (!key) return;
  const reset = { q: "", category: "all", min: "", max: "", inStock: false, sale: false };
  update({ [key]: reset[key] });
  syncControls();
});
els.pagination.addEventListener("click", (e) => {
  const page = Number(e.target.closest("[data-page]")?.dataset.page);
  if (!page) return;
  update({ page }, { resetPage: false });
  els.title.scrollIntoView({ behavior: "smooth", block: "start" });
});
els.filtersToggle.addEventListener("click", () => {
  const open = els.filtersPanel.classList.toggle("hidden") === false;
  els.filtersToggle.setAttribute("aria-expanded", String(open));
});

/* ---------- Load ---------- */

async function load() {
  syncControls();
  els.grid.innerHTML = skeletonCardsHTML(6);
  try {
    allProducts = await listProducts();
    if (!allProducts.length) {
      els.grid.innerHTML = stateBlock({ title: "No products yet", message: "Check back soon, new products are on the way." });
      els.count.textContent = "";
      return;
    }
    render();
  } catch (error) {
    console.error(error);
    els.grid.innerHTML = stateBlock({ icon: "error", title: "Couldn't load products", message: friendlyError(error), action: { label: "Try again", id: "retryShop" } });
    document.getElementById("retryShop").addEventListener("click", load);
  }
}

load();
