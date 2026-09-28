// Admin → Orders: search, filter, view details, change status.
import { openSheet, pagerHTML } from "./common.js";
import { updateOrderStatus } from "../services/orders.js";
import { timelineHTML, orderItemsHTML, orderTotalsHTML, addressHTML } from "../orderView.js";
import { confirmDialog, setButtonLoading, stateBlock } from "../ui.js";
import { showToast } from "../toast.js";
import { escapeHTML, formatDate, formatPrice, orderRef, statusBadge, debounce, friendlyError } from "../utils.js";
import { ORDER_STATUSES, ORDER_END_STATES, STATUS_META } from "../config.js";

const PAGE_SIZE = 15;
const OPEN = ["placed", "confirmed", "processing", "shipped", "out_for_delivery"];

export async function render(container, ctx, params) {
  const orders = await ctx.get("orders");
  const state = { q: "", status: params.get("status") ?? "all", page: 1 };

  if (!orders.length) {
    container.innerHTML = `<div class="card">${stateBlock({ title: "No orders yet", message: "Orders placed by customers will appear here." })}</div>`;
    return;
  }

  const count = (s) => orders.filter((o) => (s === "open" ? OPEN.includes(o.status) : o.status === s)).length;
  container.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row">
      <label for="orderSearch" class="sr-only">Search orders</label>
      <input id="orderSearch" type="search" class="input flex-1" placeholder="Search by order number, name, email or phone…">
      <label for="orderStatus" class="sr-only">Filter by status</label>
      <select id="orderStatus" class="input sm:w-56">
        <option value="all">All statuses (${orders.length})</option>
        <option value="open">Open / pending (${count("open")})</option>
        ${ORDER_STATUSES.map((s) => `<option value="${s}">${STATUS_META[s].short} (${count(s)})</option>`).join("")}
      </select>
    </div>
    <div id="orderResults" class="mt-4"></div>`;

  const results = container.querySelector("#orderResults");
  container.querySelector("#orderStatus").value = state.status;

  function filtered() {
    const q = state.q.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (state.status === "open" && !OPEN.includes(o.status)) return false;
      if (!["all", "open"].includes(state.status) && o.status !== state.status) return false;
      if (q) {
        const hay = `${o.id} ${o.customer?.fullName} ${o.customer?.email} ${o.customer?.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function draw() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const pageItems = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    if (!list.length) {
      results.innerHTML = `<div class="card">${stateBlock({ icon: "search", title: "No orders match", message: "Try another search or status." })}</div>`;
      return;
    }

    results.innerHTML = `
      <div class="card hidden overflow-hidden md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
            <tr><th class="px-4 py-3 font-medium">Order</th><th class="px-4 py-3 font-medium">Customer</th><th class="hidden px-4 py-3 font-medium lg:table-cell">Items</th><th class="px-4 py-3 text-right font-medium">Total</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3"><span class="sr-only">Actions</span></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            ${pageItems.map((o) => `
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td class="px-4 py-3"><p class="font-medium">${escapeHTML(orderRef(o.id))}</p><p class="text-xs text-gray-500">${formatDate(o.createdAt, true)}</p></td>
                <td class="px-4 py-3"><p class="max-w-48 truncate">${escapeHTML(o.customer?.fullName)}</p><p class="max-w-48 truncate text-xs text-gray-500">${escapeHTML(o.customer?.email)}</p></td>
                <td class="hidden px-4 py-3 tabular-nums lg:table-cell">${o.itemCount ?? o.items?.length ?? 0}</td>
                <td class="px-4 py-3 text-right font-semibold tabular-nums">${formatPrice(o.total)}</td>
                <td class="px-4 py-3">${statusBadge(o.status)}</td>
                <td class="px-4 py-3 text-right"><button type="button" data-open="${escapeHTML(o.id)}" class="btn-secondary px-3 py-1.5">Manage</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <ul class="space-y-3 md:hidden">
        ${pageItems.map((o) => `
          <li>
            <button type="button" data-open="${escapeHTML(o.id)}" class="card block w-full p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-800">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0"><p class="font-semibold">${escapeHTML(orderRef(o.id))}</p><p class="truncate text-sm text-gray-600 dark:text-gray-400">${escapeHTML(o.customer?.fullName)}</p></div>
                ${statusBadge(o.status)}
              </div>
              <div class="mt-3 flex items-center justify-between text-sm">
                <span class="text-gray-500">${formatDate(o.createdAt)} · ${o.itemCount ?? o.items?.length ?? 0} item(s)</span>
                <span class="font-bold">${formatPrice(o.total)}</span>
              </div>
            </button>
          </li>`).join("")}
      </ul>
      <div class="mt-4">${pagerHTML(state.page, pages, list.length, "orders")}</div>`;
  }

  container.querySelector("#orderSearch").addEventListener("input", debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 200));
  container.querySelector("#orderStatus").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; draw(); });
  results.addEventListener("click", (e) => {
    const pager = e.target.closest("[data-pager]");
    if (pager) { state.page = Number(pager.dataset.pager); draw(); return; }
    const id = e.target.closest("[data-open]")?.dataset.open;
    if (id) openOrder(orders.find((o) => o.id === id), ctx, draw);
  });

  draw();

  // deep link from the overview: #orders?open=<id>
  const openId = params.get("open");
  if (openId) {
    const order = orders.find((o) => o.id === openId);
    if (order) openOrder(order, ctx, draw);
  }
}

function openOrder(order, ctx, redraw) {
  const { body, close } = openSheet(`Order ${orderRef(order.id)}`, { wide: true });
  const final = ORDER_END_STATES.includes(order.status);

  body.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-gray-500">Placed ${formatDate(order.createdAt, true)} · ID <span class="font-mono text-xs">${escapeHTML(order.id)}</span></p>
        ${statusBadge(order.status)}
      </div>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800" aria-labelledby="status-form-heading">
        <h3 id="status-form-heading" class="font-semibold">Update status</h3>
        ${final
          ? `<p class="mt-2 text-sm text-gray-500">This order is ${escapeHTML(order.status)} and can no longer be changed.</p>`
          : `<form id="statusForm" class="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div><label for="newStatus" class="label">New status</label>
                <select id="newStatus" class="input">${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${STATUS_META[s].label}</option>`).join("")}</select></div>
              <div><label for="statusNote" class="label">Note for customer (optional)</label>
                <input id="statusNote" class="input" maxlength="200" placeholder="e.g. Rider: 0803…"></div>
              <button type="submit" class="btn-primary">Update</button>
            </form>`}
      </section>

      <div class="grid gap-6 sm:grid-cols-2">
        <section><h3 class="mb-2 font-semibold">Customer & delivery</h3>${addressHTML(order)}</section>
        <section><h3 class="mb-3 font-semibold">Tracking</h3>${timelineHTML(order)}</section>
      </div>

      <section>
        <h3 class="font-semibold">Items</h3>
        ${orderItemsHTML(order)}
        <div class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">${orderTotalsHTML(order)}</div>
      </section>
    </div>`;

  body.querySelector("#statusForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newStatus = body.querySelector("#newStatus").value;
    const note = body.querySelector("#statusNote").value.trim();
    if (newStatus === order.status) {
      showToast("Choose a different status.", "warning");
      return;
    }
    if (ORDER_END_STATES.includes(newStatus)) {
      const ok = await confirmDialog({
        title: `Mark as ${STATUS_META[newStatus].short.toLowerCase()}?`,
        message: "The items go back into stock and the order can't be changed afterwards.",
        confirmText: `Mark ${STATUS_META[newStatus].short.toLowerCase()}`,
        danger: true,
      });
      if (!ok) return;
    }
    const restore = setButtonLoading(e.submitter ?? body.querySelector('#statusForm button[type="submit"]'), "Updating…");
    try {
      await updateOrderStatus(order, newStatus, note);
      ctx.invalidate("orders", "products");
      showToast(`Order ${orderRef(order.id)} is now “${STATUS_META[newStatus].short}”. The customer sees this on their order page.`, "success", 5000);
      close();
      ctx.rerender();
    } catch (error) {
      restore();
      showToast(friendlyError(error), "error");
    }
  });
}
