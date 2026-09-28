import "./header.js";
import { requireUser } from "./auth.js";
import { getOrder } from "./services/orders.js";
import { timelineHTML, orderItemsHTML, orderTotalsHTML, addressHTML } from "./orderView.js";
import { stateBlock } from "./ui.js";
import { escapeHTML, formatDate, getParam, orderRef, statusBadge, statusLabel, friendlyError } from "./utils.js";

const root = document.getElementById("orderRoot");

async function load() {
  await requireUser();
  const id = getParam("id");
  if (!id) {
    root.innerHTML = stateBlock({ icon: "search", title: "Order not found", action: { label: "View my orders", href: "/pages/account.html#orders" } });
    return;
  }

  try {
    const order = await getOrder(id);
    if (!order) {
      root.innerHTML = stateBlock({ icon: "search", title: "Order not found", message: "Check the link, or find the order in your account.", action: { label: "View my orders", href: "/pages/account.html#orders" } });
      return;
    }
    document.title = `Order ${orderRef(order.id)} | PrimeLane`;
    const justPlaced = getParam("placed") === "1";

    root.innerHTML = `
      ${justPlaced ? `
      <div class="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100" role="status">
        <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div><p class="font-semibold">Thank you! Your order has been placed.</p><p class="text-sm">We'll confirm it shortly. You can follow its progress on this page.</p></div>
      </div>` : ""}

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold md:text-3xl">Order ${escapeHTML(orderRef(order.id))}</h1>
          <p class="text-sm text-gray-500">Placed on ${formatDate(order.createdAt, true)}</p>
        </div>
        ${statusBadge(order.status)}
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="space-y-6">
          <section class="card p-6" aria-labelledby="tracking-heading">
            <h2 id="tracking-heading" class="text-lg font-semibold">Tracking</h2>
            <p class="mb-5 mt-1 text-sm text-gray-600 dark:text-gray-400">Current status: <strong>${escapeHTML(statusLabel(order.status))}</strong></p>
            ${timelineHTML(order)}
          </section>
          <section class="card p-6" aria-labelledby="items-heading">
            <h2 id="items-heading" class="text-lg font-semibold">Items (${order.itemCount ?? order.items?.length ?? 0})</h2>
            ${orderItemsHTML(order)}
          </section>
        </div>
        <div class="space-y-6">
          <section class="card p-6" aria-labelledby="total-heading">
            <h2 id="total-heading" class="mb-4 text-lg font-semibold">Payment summary</h2>
            ${orderTotalsHTML(order)}
            <p class="mt-3 text-xs text-gray-500">Payment on delivery. Prices shown are the prices at the time of purchase.</p>
          </section>
          <section class="card p-6" aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" class="mb-3 text-lg font-semibold">Delivery details</h2>
            ${addressHTML(order)}
          </section>
          <a href="/index.html#contact-section" class="btn-secondary w-full">Need help with this order?</a>
        </div>
      </div>`;
    root.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error(error);
    const denied = error?.code === "permission-denied";
    root.innerHTML = stateBlock({
      icon: denied ? "lock" : "error",
      title: denied ? "You can't view this order" : "Couldn't load this order",
      message: denied ? "Orders can only be viewed by the account that placed them." : friendlyError(error),
      action: denied ? { label: "View my orders", href: "/pages/account.html#orders" } : { label: "Try again", id: "retryOrder" },
    });
    document.getElementById("retryOrder")?.addEventListener("click", load);
  }
}

load();
