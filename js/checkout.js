import "./header.js";
import { requireUser, setCachedProfile, getAuthState } from "./auth.js";
import { getCart, cartSubtotal, clearCart, syncCartWithProducts } from "./cart.js";
import { listProducts } from "./services/products.js";
import { placeOrder } from "./services/orders.js";
import { getStoreSettings, shippingFor } from "./services/settings.js";
import { updateMyProfile } from "./services/users.js";
import { stateBlock, validateForm, validators, setButtonLoading } from "./ui.js";
import { showToast } from "./toast.js";
import { escapeHTML, formatPrice, safeUrl, friendlyError } from "./utils.js";
import { NIGERIAN_STATES } from "./config.js";

const root = document.getElementById("checkoutRoot");
let settings;

function field({ name, label, type = "text", autocomplete = "", value = "", extra = "" }) {
  return `
    <div>
      <label for="co-${name}" class="label">${label}</label>
      <input id="co-${name}" name="${name}" type="${type}" class="input" autocomplete="${autocomplete}" value="${escapeHTML(value)}" ${extra}>
    </div>`;
}

function summaryHTML(cart) {
  const subtotal = cartSubtotal(cart);
  const delivery = shippingFor(subtotal, settings);
  return `
    <div class="card p-6">
      <h2 class="text-lg font-semibold">Order summary</h2>
      <ul class="mt-4 max-h-80 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-800">
        ${cart.map((item) => `
          <li class="flex gap-3 py-3">
            <span class="relative shrink-0">
              <img src="${escapeHTML(safeUrl(item.image))}" alt="" class="h-14 w-14 rounded-lg bg-gray-100 object-cover dark:bg-gray-800" loading="lazy" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
              <span class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-700 px-1 text-[11px] font-bold text-white">${item.quantity}</span>
            </span>
            <span class="min-w-0 flex-1">
              <span class="line-clamp-2 text-sm font-medium">${escapeHTML(item.title)}</span>
              <span class="text-xs text-gray-500">${formatPrice(item.price)} × ${item.quantity}</span>
            </span>
            <span class="text-sm font-semibold">${formatPrice(item.price * item.quantity)}</span>
          </li>`).join("")}
      </ul>
      <dl class="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
        <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Subtotal</dt><dd>${formatPrice(subtotal)}</dd></div>
        <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Delivery</dt><dd>${delivery === 0 ? "Free" : formatPrice(delivery)}</dd></div>
        <div class="flex justify-between border-t border-gray-200 pt-3 text-base font-bold dark:border-gray-800"><dt>Total</dt><dd>${formatPrice(subtotal + delivery)}</dd></div>
      </dl>
      <p class="mt-4 text-xs text-gray-500">Payment is collected on delivery. You can track this order from your account.</p>
    </div>`;
}

function render(user, profile) {
  const cart = getCart();
  if (!cart.length) {
    root.innerHTML = `<div class="card">${stateBlock({ title: "Your cart is empty", message: "Add some products before checking out.", action: { label: "Browse products", href: "/pages/shop.html" } })}</div>`;
    return;
  }

  const p = profile ?? {};
  root.innerHTML = `
  <div class="grid gap-8 lg:grid-cols-[1fr_24rem]">
    <form id="checkoutForm" class="space-y-6" novalidate>
      <fieldset class="card space-y-4 p-6">
        <legend class="float-left mb-2 w-full text-lg font-semibold">Contact information</legend>
        ${field({ name: "fullName", label: "Full name", autocomplete: "name", value: p.fullName || user.displayName || "", extra: 'maxlength="100" required' })}
        <div class="grid gap-4 sm:grid-cols-2">
          ${field({ name: "email", label: "Email", type: "email", autocomplete: "email", value: user.email, extra: 'maxlength="200" required' })}
          ${field({ name: "phone", label: "Phone number", type: "tel", autocomplete: "tel", value: p.phone || "", extra: 'maxlength="20" placeholder="0801 234 5678" required' })}
        </div>
      </fieldset>

      <fieldset class="card space-y-4 p-6">
        <legend class="float-left mb-2 w-full text-lg font-semibold">Delivery address</legend>
        ${field({ name: "address", label: "Street address", autocomplete: "street-address", value: p.address || "", extra: 'maxlength="200" required' })}
        <div class="grid gap-4 sm:grid-cols-3">
          ${field({ name: "city", label: "City", autocomplete: "address-level2", value: p.city || "", extra: 'maxlength="100" required' })}
          ${field({ name: "state", label: "State", autocomplete: "address-level1", value: p.state || "", extra: 'list="ng-states" maxlength="100" required' })}
          ${field({ name: "country", label: "Country", autocomplete: "country-name", value: p.country || "Nigeria", extra: 'maxlength="100" required' })}
        </div>
        <datalist id="ng-states">${NIGERIAN_STATES.map((s) => `<option value="${s}">`).join("")}</datalist>
        <label class="flex items-center gap-3 text-sm"><input type="checkbox" name="saveDetails" checked class="h-4 w-4 accent-indigo-600"> Save these details to my account</label>
      </fieldset>

      <div class="lg:hidden">${summaryHTML(cart)}</div>

      <button type="submit" class="btn-primary btn-lg w-full">Place order · ${formatPrice(cartSubtotal(cart) + shippingFor(cartSubtotal(cart), settings))}</button>
      <p class="text-center text-sm"><a href="/pages/cartpage.html" class="text-indigo-600 hover:underline dark:text-indigo-400">← Back to cart</a></p>
    </form>

    <aside class="hidden self-start lg:sticky lg:top-24 lg:block" aria-label="Order summary">${summaryHTML(cart)}</aside>
  </div>`;

  document.getElementById("checkoutForm").addEventListener("submit", (e) => submitOrder(e, user));
}

async function submitOrder(event, user) {
  event.preventDefault();
  const form = event.target;
  const valid = validateForm(form, {
    fullName: (v) => (v.length >= 3 ? "" : "Enter your full name."),
    email: validators.email,
    phone: validators.phone,
    address: (v) => (v.length >= 5 ? "" : "Enter your street address."),
    city: validators.required("City"),
    state: validators.required("State"),
    country: validators.required("Country"),
  });
  if (!valid) {
    showToast("Please fix the highlighted fields.", "warning");
    return;
  }

  const f = form.elements;
  const value = (name) => f[name].value.trim();
  const customer = { fullName: value("fullName"), email: value("email"), phone: value("phone") };
  const shipping = { address: value("address"), city: value("city"), state: value("state"), country: value("country") };

  const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Placing order…");
  try {
    const orderId = await placeOrder({ uid: user.uid, customer, shipping, cartItems: getCart() });

    if (f.saveDetails.checked) {
      const details = { fullName: customer.fullName, phone: customer.phone, ...shipping };
      try {
        await updateMyProfile(user.uid, details);
        setCachedProfile({ ...getAuthState().profile, ...details });
      } catch (err) {
        console.warn("Order placed, but saving details to the profile failed", err);
      }
    }

    clearCart();
    window.location.href = `/pages/order.html?id=${encodeURIComponent(orderId)}&placed=1`;
  } catch (error) {
    if (!error.userMessage) console.error(error);
    restore();
    showToast(friendlyError(error), "error", 6000);
    // If stock or prices changed, refresh the cart so the customer sees the real numbers.
    if (error.userMessage) {
      try {
        const products = await listProducts({ fresh: true });
        syncCartWithProducts(new Map(products.map((p) => [p.id, p])));
        render(user, getAuthState().profile);
      } catch {}
    }
  }
}

async function init() {
  const { user, profile } = await requireUser();
  if (profile?.status === "suspended") {
    root.innerHTML = `<div class="card">${stateBlock({ icon: "lock", title: "Your account can't place orders", message: "Please contact support to reactivate your account.", action: { label: "Contact us", href: "/index.html#contact-section" } })}</div>`;
    return;
  }
  try {
    const [storeSettings, products] = await Promise.all([getStoreSettings(), listProducts({ fresh: true })]);
    settings = storeSettings;
    const notes = syncCartWithProducts(new Map(products.map((p) => [p.id, p])));
    if (notes.length) showToast(`Your cart was updated: ${notes.join(" ")}`, "warning", 7000);
    render(user, profile);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="card">${stateBlock({ icon: "error", title: "Couldn't load checkout", message: friendlyError(error), action: { label: "Try again", id: "retryCheckout" } })}</div>`;
    document.getElementById("retryCheckout").addEventListener("click", init);
  }
}

init();
