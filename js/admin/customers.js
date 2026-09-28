// Admin → Customers: list, order history, suspend/activate.
// Only profile fields are shown. Passwords live in Firebase Authentication and are never readable.
import { openSheet, pagerHTML } from "./common.js";
import { setUserStatus, purgeStoredPasswords } from "../services/users.js";
import { confirmDialog, setButtonLoading, stateBlock } from "../ui.js";
import { showToast } from "../toast.js";
import { escapeHTML, formatDate, formatPrice, orderRef, statusBadge, debounce, friendlyError } from "../utils.js";

const PAGE_SIZE = 20;

export async function render(container, ctx) {
  const [users, orders] = await Promise.all([ctx.get("users"), ctx.get("orders")]);

  const statsByUser = new Map();
  orders.forEach((o) => {
    const s = statsByUser.get(o.userId) ?? { count: 0, spent: 0, orders: [] };
    s.count += 1;
    if (o.status !== "cancelled" && o.status !== "failed") s.spent += Number(o.total) || 0;
    s.orders.push(o);
    statsByUser.set(o.userId, s);
  });

  const people = users
    .map((u) => ({ ...u, stats: statsByUser.get(u.id) ?? { count: 0, spent: 0, orders: [] } }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  const withPasswords = users.filter((u) => u.hasStoredPassword).map((u) => u.id);
  const state = { q: "", filter: "all", page: 1 };

  container.innerHTML = `
    ${withPasswords.length ? `
    <div class="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" role="alert">
      <p class="flex-1"><strong>Security issue:</strong> ${withPasswords.length} account(s) still have a plain-text password saved in Firestore by the old signup code. Remove them now. Logins keep working because Firebase Authentication stores passwords separately.</p>
      <button type="button" id="purgePasswords" class="btn-danger shrink-0">Remove stored passwords</button>
    </div>` : ""}
    <div class="flex flex-col gap-3 sm:flex-row">
      <label for="customerSearch" class="sr-only">Search customers</label>
      <input id="customerSearch" type="search" class="input flex-1" placeholder="Search name, email or phone…">
      <label for="customerFilter" class="sr-only">Filter</label>
      <select id="customerFilter" class="input sm:w-48">
        <option value="all">All accounts (${people.length})</option>
        <option value="customers">Customers</option>
        <option value="buyers">Have ordered</option>
        <option value="suspended">Suspended</option>
        <option value="admins">Admins</option>
      </select>
    </div>
    <div id="customerResults" class="mt-4"></div>`;

  const results = container.querySelector("#customerResults");

  const filtered = () => {
    const q = state.q.toLowerCase();
    return people.filter((u) => {
      if (q && !`${u.fullName} ${u.email} ${u.phone}`.toLowerCase().includes(q)) return false;
      if (state.filter === "customers" && u.role === "admin") return false;
      if (state.filter === "admins" && u.role !== "admin") return false;
      if (state.filter === "buyers" && !u.stats.count) return false;
      if (state.filter === "suspended" && u.status !== "suspended") return false;
      return true;
    });
  };

  const roleBadge = (u) => u.role === "admin"
    ? `<span class="badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">Admin</span>`
    : u.status === "suspended"
      ? `<span class="badge bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Suspended</span>`
      : `<span class="badge bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>`;

  function draw() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const pageItems = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    if (!list.length) {
      results.innerHTML = `<div class="card">${stateBlock({ icon: "search", title: "No customers found" })}</div>`;
      return;
    }
    results.innerHTML = `
      <div class="card hidden overflow-hidden md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
            <tr><th class="px-4 py-3 font-medium">Customer</th><th class="hidden px-4 py-3 font-medium lg:table-cell">Joined</th><th class="px-4 py-3 text-right font-medium">Orders</th><th class="px-4 py-3 text-right font-medium">Spent</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3"><span class="sr-only">Actions</span></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            ${pageItems.map((u) => `
              <tr>
                <td class="px-4 py-3"><p class="max-w-56 truncate font-medium">${escapeHTML(u.fullName || "—")}</p><p class="max-w-56 truncate text-xs text-gray-500">${escapeHTML(u.email)}</p></td>
                <td class="hidden px-4 py-3 text-gray-600 lg:table-cell dark:text-gray-400">${formatDate(u.createdAt)}</td>
                <td class="px-4 py-3 text-right tabular-nums">${u.stats.count}</td>
                <td class="px-4 py-3 text-right tabular-nums">${formatPrice(u.stats.spent)}</td>
                <td class="px-4 py-3">${roleBadge(u)}</td>
                <td class="px-4 py-3 text-right"><button type="button" data-view="${escapeHTML(u.id)}" class="btn-secondary px-3 py-1.5">View</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <ul class="space-y-3 md:hidden">
        ${pageItems.map((u) => `
          <li><button type="button" data-view="${escapeHTML(u.id)}" class="card block w-full p-4 text-left">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><p class="truncate font-semibold">${escapeHTML(u.fullName || "—")}</p><p class="truncate text-sm text-gray-500">${escapeHTML(u.email)}</p></div>
              ${roleBadge(u)}
            </div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${u.stats.count} order(s) · ${formatPrice(u.stats.spent)} spent</p>
          </button></li>`).join("")}
      </ul>
      <div class="mt-4">${pagerHTML(state.page, pages, list.length, "accounts")}</div>`;
  }

  container.querySelector("#customerSearch").addEventListener("input", debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 200));
  container.querySelector("#customerFilter").addEventListener("change", (e) => { state.filter = e.target.value; state.page = 1; draw(); });
  results.addEventListener("click", (e) => {
    const pager = e.target.closest("[data-pager]");
    if (pager) { state.page = Number(pager.dataset.pager); draw(); return; }
    const id = e.target.closest("[data-view]")?.dataset.view;
    if (id) openCustomer(people.find((u) => u.id === id), ctx);
  });

  container.querySelector("#purgePasswords")?.addEventListener("click", async (e) => {
    const restore = setButtonLoading(e.currentTarget, "Removing…");
    try {
      await purgeStoredPasswords(withPasswords);
      showToast("Stored passwords removed.", "success");
      ctx.invalidate("users");
      ctx.rerender();
    } catch (error) {
      restore();
      showToast(friendlyError(error), "error");
    }
  });

  draw();
}

function openCustomer(user, ctx) {
  const { body, close } = openSheet(user.fullName || user.email, { wide: true });
  const isSelf = user.id === ctx.currentUser?.uid;
  const canToggle = user.role !== "admin" && !isSelf;
  const suspended = user.status === "suspended";
  const address = [user.address, user.city, user.state, user.country].filter(Boolean).join(", ");

  body.innerHTML = `
    <div class="space-y-6">
      <dl class="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt class="text-gray-500">Email</dt><dd class="break-all font-medium">${escapeHTML(user.email)}</dd></div>
        <div><dt class="text-gray-500">Phone</dt><dd class="font-medium">${escapeHTML(user.phone || "—")}</dd></div>
        <div><dt class="text-gray-500">Joined</dt><dd class="font-medium">${formatDate(user.createdAt)}</dd></div>
        <div><dt class="text-gray-500">Role</dt><dd class="font-medium capitalize">${escapeHTML(user.role || "customer")}</dd></div>
        <div class="sm:col-span-2"><dt class="text-gray-500">Saved address</dt><dd class="font-medium">${escapeHTML(address || "—")}</dd></div>
        <div><dt class="text-gray-500">Orders</dt><dd class="font-medium">${user.stats.count}</dd></div>
        <div><dt class="text-gray-500">Total spent</dt><dd class="font-medium">${formatPrice(user.stats.spent)}</dd></div>
      </dl>

      ${canToggle ? `
      <div class="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center dark:border-gray-800">
        <p class="flex-1 text-sm text-gray-600 dark:text-gray-400">${suspended ? "This account is suspended and can't place orders." : "Suspending stops this customer from placing new orders."}</p>
        <button type="button" id="toggleStatus" class="${suspended ? "btn-primary" : "btn-danger"}">${suspended ? "Reactivate account" : "Suspend account"}</button>
      </div>` : ""}

      <section>
        <h3 class="mb-3 font-semibold">Order history</h3>
        ${user.stats.orders.length ? `
        <ul class="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          ${user.stats.orders.map((o) => `
            <li><a href="#orders?open=${encodeURIComponent(o.id)}" class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <div class="min-w-0 flex-1"><p class="text-sm font-medium">${escapeHTML(orderRef(o.id))}</p><p class="text-xs text-gray-500">${formatDate(o.createdAt)}</p></div>
              <span class="text-sm font-semibold">${formatPrice(o.total)}</span>${statusBadge(o.status)}
            </a></li>`).join("")}
        </ul>` : `<p class="text-sm text-gray-500">No orders yet.</p>`}
      </section>
    </div>`;

  body.querySelectorAll('a[href^="#orders"]').forEach((a) => a.addEventListener("click", close));

  body.querySelector("#toggleStatus")?.addEventListener("click", async (e) => {
    const next = suspended ? "active" : "suspended";
    if (next === "suspended") {
      const ok = await confirmDialog({ title: "Suspend this account?", message: `${user.email} won't be able to place orders until reactivated.`, confirmText: "Suspend", danger: true });
      if (!ok) return;
    }
    const restore = setButtonLoading(e.currentTarget, "Saving…");
    try {
      await setUserStatus(user.id, next);
      showToast(next === "active" ? "Account reactivated." : "Account suspended.", "success");
      ctx.invalidate("users");
      close();
      ctx.rerender();
    } catch (error) {
      restore();
      showToast(friendlyError(error), "error");
    }
  });
}
