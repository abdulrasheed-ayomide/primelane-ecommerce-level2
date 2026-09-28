// Admin → Products: search, filter, add, edit, delete, stock.
import { openSheet, pagerHTML } from "./common.js";
import {
  sanitizeProductInput, createProduct, updateProduct, deleteProduct, setProductStock,
  importSeedCatalog, getCategories,
} from "../services/products.js";
import { confirmDialog, setButtonLoading, setFieldError, stateBlock } from "../ui.js";
import { showToast } from "../toast.js";
import { escapeHTML, formatPrice, safeUrl, debounce, friendlyError } from "../utils.js";
import { LOW_STOCK_THRESHOLD, ENABLE_IMAGE_UPLOADS } from "../config.js";

const PAGE_SIZE = 20;

export async function render(container, ctx, params) {
  const products = await ctx.get("products");
  const state = { q: "", category: "all", stock: params.get("stock") ?? "all", page: 1 };

  if (!products.length) {
    container.innerHTML = `<div class="card">${stateBlock({
      title: "No products yet",
      message: "Import the 100 products from the original catalog (js/data/products.seed.js), or add your own.",
    })}
      <div class="-mt-8 flex flex-col justify-center gap-3 px-6 pb-12 sm:flex-row">
        <button type="button" id="importSeed" class="btn-primary">Import starter catalog</button>
        <button type="button" id="addFirst" class="btn-secondary">Add a product</button>
      </div></div>`;
    container.querySelector("#addFirst").addEventListener("click", () => openProductForm(null, ctx, products));
    container.querySelector("#importSeed").addEventListener("click", async (e) => {
      const restore = setButtonLoading(e.currentTarget, "Importing…");
      try {
        const { products: seed } = await import("../data/products.seed.js");
        await importSeedCatalog(seed);
        showToast(`Imported ${seed.length} products.`, "success");
        ctx.invalidate("products");
        ctx.rerender();
      } catch (error) {
        restore();
        showToast(friendlyError(error), "error");
      }
    });
    return;
  }

  const categories = getCategories(products);
  container.innerHTML = `
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="relative flex-1">
        <label for="adminProductSearch" class="sr-only">Search products</label>
        <input id="adminProductSearch" type="search" placeholder="Search name, brand or ID…" class="input">
      </div>
      <div class="grid grid-cols-2 gap-3 sm:flex">
        <label class="sr-only" for="adminCategory">Category</label>
        <select id="adminCategory" class="input sm:w-48">
          <option value="all">All categories</option>
          ${categories.map((c) => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)} (${c.count})</option>`).join("")}
        </select>
        <label class="sr-only" for="adminStock">Stock</label>
        <select id="adminStock" class="input sm:w-40">
          <option value="all">All stock</option>
          <option value="low">Low stock (≤ ${LOW_STOCK_THRESHOLD})</option>
          <option value="out">Out of stock</option>
        </select>
        <button type="button" id="addProduct" class="btn-primary col-span-2 sm:col-span-1">+ Add product</button>
      </div>
    </div>
    <div id="productResults" class="mt-4"></div>`;

  const results = container.querySelector("#productResults");
  container.querySelector("#adminStock").value = state.stock;

  function filtered() {
    const q = state.q.toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.title} ${p.brand} ${p.id}`.toLowerCase().includes(q)) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
      if (state.stock === "low" && p.stock > LOW_STOCK_THRESHOLD) return false;
      if (state.stock === "out" && p.stock > 0) return false;
      return true;
    }).sort((a, b) => (state.stock === "all" ? a.title.localeCompare(b.title) : a.stock - b.stock));
  }

  function stockBadge(p) {
    if (p.stock === 0) return `<span class="badge bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Out</span>`;
    if (p.stock <= LOW_STOCK_THRESHOLD) return `<span class="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Low</span>`;
    return "";
  }

  function stockInput(p) {
    return `<label class="sr-only" for="stock-${escapeHTML(p.id)}">Stock for ${escapeHTML(p.title)}</label>
      <input id="stock-${escapeHTML(p.id)}" type="number" min="0" step="1" inputmode="numeric" value="${p.stock}" data-stock="${escapeHTML(p.id)}" class="input w-20 px-2 py-1.5 text-right tabular-nums">`;
  }

  function draw() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const pageItems = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    if (!list.length) {
      results.innerHTML = `<div class="card">${stateBlock({ icon: "search", title: "No products match", message: "Try a different search or filter." })}</div>`;
      return;
    }

    const img = (p, size) => `<img src="${escapeHTML(safeUrl(p.image))}" alt="" loading="lazy" class="${size} shrink-0 rounded-lg bg-gray-100 object-cover dark:bg-gray-800" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">`;
    const actions = (p) => `
      <button type="button" data-edit="${escapeHTML(p.id)}" class="btn-secondary px-3 py-1.5">Edit</button>
      <button type="button" data-delete="${escapeHTML(p.id)}" class="btn-ghost px-3 py-1.5 text-red-600 dark:text-red-400" aria-label="Delete ${escapeHTML(p.title)}">Delete</button>`;

    results.innerHTML = `
      <!-- Table on tablet/desktop -->
      <div class="card hidden overflow-hidden md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
            <tr><th class="px-4 py-3 font-medium">Product</th><th class="px-4 py-3 font-medium">Category</th><th class="px-4 py-3 text-right font-medium">Price</th><th class="px-4 py-3 text-right font-medium">Stock</th><th class="px-4 py-3 text-right font-medium"><span class="sr-only">Actions</span></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            ${pageItems.map((p) => `
              <tr>
                <td class="px-4 py-3"><div class="flex items-center gap-3">${img(p, "h-11 w-11")}<div class="min-w-0"><p class="line-clamp-1 font-medium">${escapeHTML(p.title)}</p><p class="text-xs text-gray-500">ID ${escapeHTML(p.id)}${p.brand ? ` · ${escapeHTML(p.brand)}` : ""}</p></div></div></td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-400">${escapeHTML(p.category)}</td>
                <td class="px-4 py-3 text-right tabular-nums">${formatPrice(p.price)}</td>
                <td class="px-4 py-3"><div class="flex items-center justify-end gap-2">${stockBadge(p)}${stockInput(p)}</div></td>
                <td class="px-4 py-3"><div class="flex justify-end gap-1">${actions(p)}</div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <!-- Cards on phones -->
      <ul class="space-y-3 md:hidden">
        ${pageItems.map((p) => `
          <li class="card p-4">
            <div class="flex gap-3">
              ${img(p, "h-16 w-16")}
              <div class="min-w-0 flex-1">
                <p class="line-clamp-2 font-medium">${escapeHTML(p.title)}</p>
                <p class="text-xs text-gray-500">${escapeHTML(p.category)} · ID ${escapeHTML(p.id)}</p>
                <p class="mt-1 font-semibold">${formatPrice(p.price)}</p>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
              <div class="flex items-center gap-2 text-sm"><span class="text-gray-500">Stock</span>${stockInput(p)}${stockBadge(p)}</div>
              <div class="flex gap-1">${actions(p)}</div>
            </div>
          </li>`).join("")}
      </ul>
      <div class="mt-4">${pagerHTML(state.page, pages, list.length, "products")}</div>`;
  }

  // events (delegated, bound once)
  container.querySelector("#adminProductSearch").addEventListener("input", debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 200));
  container.querySelector("#adminCategory").addEventListener("change", (e) => { state.category = e.target.value; state.page = 1; draw(); });
  container.querySelector("#adminStock").addEventListener("change", (e) => { state.stock = e.target.value; state.page = 1; draw(); });
  container.querySelector("#addProduct").addEventListener("click", () => openProductForm(null, ctx, products));

  results.addEventListener("click", async (e) => {
    const pager = e.target.closest("[data-pager]");
    if (pager) { state.page = Number(pager.dataset.pager); draw(); results.scrollIntoView({ block: "start" }); return; }

    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    if (editId) return openProductForm(products.find((p) => p.id === editId), ctx, products);

    const deleteId = e.target.closest("[data-delete]")?.dataset.delete;
    if (deleteId) {
      const product = products.find((p) => p.id === deleteId);
      const ok = await confirmDialog({
        title: "Delete this product?",
        message: `"${product.title}" will be removed from the store. Past orders keep their copy of the product details.`,
        confirmText: "Delete product",
        danger: true,
      });
      if (!ok) return;
      try {
        await deleteProduct(deleteId);
        products.splice(products.indexOf(product), 1);
        showToast("Product deleted.", "success");
        draw();
      } catch (error) {
        showToast(friendlyError(error), "error");
      }
    }
  });

  results.addEventListener("change", async (e) => {
    const id = e.target.dataset.stock;
    if (!id) return;
    const product = products.find((p) => p.id === id);
    const value = Number(e.target.value);
    if (!Number.isInteger(value) || value < 0) {
      showToast("Stock must be a whole number, 0 or more.", "warning");
      e.target.value = product.stock;
      return;
    }
    e.target.disabled = true;
    try {
      await setProductStock(id, value);
      product.stock = value;
      showToast(`Stock for ${product.title} set to ${value}.`, "success");
      draw();
    } catch (error) {
      showToast(friendlyError(error), "error");
      e.target.value = product.stock;
      e.target.disabled = false;
    }
  });

  draw();
}

/* ---------- Add / edit form ---------- */

function openProductForm(product, ctx, products) {
  const isEdit = Boolean(product);
  const p = product ?? { title: "", brand: "", category: "", subCategory: "", price: "", originalPrice: "", stock: 0, image: "", badge: "", features: [], colors: [], description: "", featured: false };
  const { body, close } = openSheet(isEdit ? "Edit product" : "Add product", { wide: true });
  const categories = getCategories(products).map((c) => c.name);

  const input = (name, label, attrs = "", value = p[name] ?? "") => `
    <div><label for="pf-${name}" class="label">${label}</label>
    <input id="pf-${name}" name="${name}" class="input" value="${escapeHTML(value)}" ${attrs}></div>`;

  body.innerHTML = `
    <form id="productForm" class="space-y-5" novalidate>
      ${input("title", "Product name", 'maxlength="120" required')}
      <div class="grid gap-4 sm:grid-cols-2">
        ${input("category", "Category", 'list="pf-categories" maxlength="40" required')}
        ${input("subCategory", "Sub-category (optional)", 'maxlength="60"')}
        ${input("brand", "Brand (optional)", 'maxlength="60"')}
        ${input("badge", "Badge (optional)", 'maxlength="30" placeholder="e.g. New, Best Seller"')}
      </div>
      <datalist id="pf-categories">${categories.map((c) => `<option value="${escapeHTML(c)}">`).join("")}</datalist>

      <div class="grid gap-4 sm:grid-cols-3">
        ${input("price", "Price (₦)", 'type="number" min="0" step="0.01" inputmode="decimal" required')}
        ${input("originalPrice", "Original price (₦)", 'type="number" min="0" step="0.01" inputmode="decimal" placeholder="For discounts"')}
        ${input("stock", "Stock", 'type="number" min="0" step="1" inputmode="numeric" required')}
      </div>

      <div>
        <label for="pf-image" class="label">Image URL</label>
        <div class="flex gap-3">
          <img id="pf-preview" src="${escapeHTML(safeUrl(p.image))}" alt="" class="h-20 w-20 shrink-0 rounded-lg bg-gray-100 object-cover dark:bg-gray-800" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
          <div class="flex-1">
            <input id="pf-image" name="image" type="url" class="input" placeholder="https://…" value="${escapeHTML(p.image)}" maxlength="20000" required>
            <p class="mt-1 text-xs text-gray-500">Paste a link to an image hosted online (e.g. Unsplash, Cloudinary, ImgBB).</p>
            ${ENABLE_IMAGE_UPLOADS ? `<label class="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-indigo-600"><input type="file" id="pf-upload" accept="image/*" class="sr-only"> Or upload an image (max 2 MB)</label>` : ""}
          </div>
        </div>
      </div>

      <div><label for="pf-description" class="label">Description</label>
        <textarea id="pf-description" name="description" rows="5" class="input" maxlength="2000" required>${escapeHTML(p.description)}</textarea></div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${input("features", "Features (comma separated)", 'maxlength="600"', p.features.join(", "))}
        ${input("colors", "Colours (comma separated)", 'maxlength="300"', p.colors.join(", "))}
      </div>
      <label class="flex items-center gap-3 text-sm"><input type="checkbox" name="featured" class="h-4 w-4 accent-indigo-600" ${p.featured ? "checked" : ""}> Show in “Featured products” on the home page</label>

      <div class="sticky -bottom-5 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-gray-200 bg-white p-5 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-900">
        <button type="button" data-cancel class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">${isEdit ? "Save changes" : "Add product"}</button>
      </div>
    </form>`;

  const form = body.querySelector("#productForm");
  const preview = body.querySelector("#pf-preview");
  form.querySelector("[data-cancel]").addEventListener("click", close);
  form.image.addEventListener("change", () => (preview.src = safeUrl(form.image.value)));

  body.querySelector("#pf-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { uploadProductImage } = await import("../services/storage.js");
      showToast("Uploading image…", "info");
      form.image.value = await uploadProductImage(file);
      preview.src = form.image.value;
      showToast("Image uploaded.", "success");
    } catch (error) {
      showToast(friendlyError(error), "error");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(form));
    raw.featured = form.featured.checked;
    const { data, errors } = sanitizeProductInput(raw);

    let first = null;
    ["title", "category", "price", "originalPrice", "stock", "image", "description"].forEach((name) => {
      setFieldError(form.elements[name], errors[name] || "");
      if (errors[name] && !first) first = form.elements[name];
    });
    if (first) {
      first.focus();
      return;
    }

    const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Saving…");
    try {
      if (isEdit) {
        await updateProduct(product.id, data);
        showToast("Product updated.", "success");
      } else {
        await createProduct(data);
        showToast("Product added.", "success");
      }
      ctx.invalidate("products");
      close();
      ctx.rerender();
    } catch (error) {
      restore();
      showToast(friendlyError(error), "error");
    }
  });
}
