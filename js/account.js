import "./header.js";
import { requireUser, setCachedProfile, getAuthState } from "./auth.js";
import { listMyOrders } from "./services/orders.js";
import { updateMyProfile } from "./services/users.js";
import { stateBlock, setButtonLoading, validateForm, validators } from "./ui.js";
import { showToast } from "./toast.js";
import { escapeHTML, formatDate, formatPrice, orderRef, statusBadge, safeUrl, friendlyError } from "./utils.js";
import { NIGERIAN_STATES } from "./config.js";

const tabs = document.querySelectorAll("[data-tab]");
const ordersList = document.getElementById("ordersList");
const form = document.getElementById("profileForm");
let ordersLoaded = false;
let currentUser;

function showTab(name) {
  const tab = ["orders", "profile"].includes(name) ? name : "orders";
  tabs.forEach((t) => {
    const active = t.dataset.tab === tab;
    active ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current");
    t.className = `block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium ${
      active ? "bg-indigo-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;
  });
  document.getElementById("panel-orders").hidden = tab !== "orders";
  document.getElementById("panel-profile").hidden = tab !== "profile";
  if (tab === "orders" && !ordersLoaded) loadOrders();
}

async function loadOrders() {
  ordersLoaded = true;
  ordersList.innerHTML = Array.from({ length: 3 }, () => `<div class="skeleton mb-3 h-28 rounded-xl"></div>`).join("");
  try {
    const orders = await listMyOrders(currentUser.uid);
    if (!orders.length) {
      ordersList.innerHTML = `<div class="card">${stateBlock({ title: "No orders yet", message: "When you place an order, you can track it here.", action: { label: "Start shopping", href: "/pages/shop.html" } })}</div>`;
      return;
    }
    ordersList.innerHTML = `<ul class="space-y-3">${orders.map(orderCardHTML).join("")}</ul>`;
    ordersList.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error(error);
    ordersLoaded = false;
    ordersList.innerHTML = `<div class="card">${stateBlock({ icon: "error", title: "Couldn't load your orders", message: friendlyError(error), action: { label: "Try again", id: "retryOrders" } })}</div>`;
    document.getElementById("retryOrders").addEventListener("click", loadOrders);
  }
}

function orderCardHTML(order) {
  const images = (order.items ?? []).slice(0, 3);
  const more = (order.items?.length ?? 0) - images.length;
  return `
  <li>
    <a href="/pages/order.html?id=${encodeURIComponent(order.id)}" class="card flex flex-col gap-4 p-4 transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center sm:p-5 dark:hover:border-indigo-800">
      <div class="flex shrink-0 -space-x-3">
        ${images.map((i) => `<img src="${escapeHTML(safeUrl(i.image))}" alt="" loading="lazy" class="h-14 w-14 rounded-lg border-2 border-white bg-gray-100 object-cover dark:border-gray-900 dark:bg-gray-800" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">`).join("")}
        ${more > 0 ? `<span class="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-white bg-gray-200 text-sm font-semibold dark:border-gray-900 dark:bg-gray-800">+${more}</span>` : ""}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-semibold">Order ${escapeHTML(orderRef(order.id))}</p>
          ${statusBadge(order.status)}
        </div>
        <p class="mt-1 text-sm text-gray-500">${formatDate(order.createdAt)} · ${order.itemCount ?? order.items?.length ?? 0} item(s)</p>
      </div>
      <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p class="font-bold">${formatPrice(order.total)}</p>
        <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">Track order →</span>
      </div>
    </a>
  </li>`;
}

function fillProfile(user, profile) {
  const p = profile ?? {};
  const name = p.fullName || user.displayName || user.email;
  document.getElementById("accountName").textContent = name;
  document.getElementById("accountEmail").textContent = user.email;
  document.getElementById("accountAvatar").textContent = name.trim()[0].toUpperCase();
  const f = form.elements;
  f.fullName.value = p.fullName ?? "";
  f.email.value = user.email;
  f.phone.value = p.phone ?? "";
  f.address.value = p.address ?? "";
  f.city.value = p.city ?? "";
  f.state.value = p.state ?? "";
  f.country.value = p.country || "Nigeria";
  document.getElementById("ng-states").innerHTML = NIGERIAN_STATES.map((s) => `<option value="${s}">`).join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const valid = validateForm(form, {
    fullName: (v) => (v.length >= 3 ? "" : "Enter your full name."),
    phone: (v) => (!v ? "" : validators.phone(v)),
  });
  if (!valid) return;

  const f = form.elements;
  const changes = {};
  ["fullName", "phone", "address", "city", "state", "country"].forEach((k) => (changes[k] = f[k].value.trim()));
  const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Saving…");
  try {
    await updateMyProfile(currentUser.uid, changes);
    const profile = { ...getAuthState().profile, ...changes };
    setCachedProfile(profile);
    fillProfile(currentUser, profile);
    showToast("Profile saved.", "success");
  } catch (error) {
    showToast(friendlyError(error), "error");
  } finally {
    restore();
  }
});

tabs.forEach((t) => t.addEventListener("click", () => setTimeout(() => showTab(location.hash.slice(1)))));
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

(async function init() {
  const { user, profile } = await requireUser();
  currentUser = user;
  fillProfile(user, profile);
  showTab(location.hash.slice(1));
})();
