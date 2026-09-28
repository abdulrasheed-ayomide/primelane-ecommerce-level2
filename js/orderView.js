// Order display pieces shared by the customer order page and the admin dashboard.
import { ORDER_FLOW, STATUS_META } from "./config.js";
import { escapeHTML, formatDate, formatPrice, safeUrl } from "./utils.js";

/** Vertical tracking timeline: Placed → Confirmed → … → Delivered (or Cancelled / Failed). */
export function timelineHTML(order) {
  const history = order.statusHistory ?? [];
  const reachedAt = {};
  history.forEach((h) => (reachedAt[h.status] = h.at));

  const ended = order.status === "cancelled" || order.status === "failed";
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  // for cancelled/failed orders, show progress up to the last normal step reached
  const lastReached = ended
    ? Math.max(0, ...history.map((h) => ORDER_FLOW.indexOf(h.status)).filter((i) => i >= 0))
    : currentIndex;

  const steps = ORDER_FLOW.map((status, i) => ({
    status,
    done: i <= lastReached,
    current: !ended && i === currentIndex,
    at: reachedAt[status],
  }));
  const visible = ended ? steps.slice(0, lastReached + 1) : steps;
  if (ended) visible.push({ status: order.status, done: true, current: true, at: reachedAt[order.status], ended: true });

  return `
  <ol class="relative space-y-6" aria-label="Order progress">
    ${visible.map((step, i) => {
      const isLast = i === visible.length - 1;
      const dot = step.ended
        ? "bg-red-600 text-white"
        : step.done
          ? "bg-indigo-600 text-white"
          : "border-2 border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900";
      const note = history.find((h) => h.status === step.status && h.note)?.note;
      return `
      <li class="relative flex gap-4" ${step.current ? 'aria-current="step"' : ""}>
        ${!isLast ? `<span class="absolute left-4 top-8 -ml-px h-[calc(100%-0.5rem)] w-0.5 ${visible[i + 1].done && !visible[i + 1].ended ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-800"}" aria-hidden="true"></span>` : ""}
        <span class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dot} ${step.current ? "ring-4 ring-indigo-200 dark:ring-indigo-900" : ""}" aria-hidden="true">
          ${step.ended ? "✕" : step.done ? `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : i + 1}
        </span>
        <div class="min-w-0 pt-1">
          <p class="font-semibold ${step.done ? "" : "text-gray-400 dark:text-gray-500"}">${escapeHTML(STATUS_META[step.status]?.label ?? step.status)}${step.current ? ' <span class="sr-only">(current status)</span>' : ""}</p>
          ${step.at ? `<p class="text-sm text-gray-500">${formatDate(step.at, true)}</p>` : ""}
          ${note ? `<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">${escapeHTML(note)}</p>` : ""}
        </div>
      </li>`;
    }).join("")}
  </ol>`;
}

export function orderItemsHTML(order) {
  return `
  <ul class="divide-y divide-gray-200 dark:divide-gray-800">
    ${(order.items ?? []).map((item) => `
      <li class="flex gap-3 py-3">
        <img src="${escapeHTML(safeUrl(item.image))}" alt="" loading="lazy" class="h-16 w-16 shrink-0 rounded-lg bg-gray-100 object-cover dark:bg-gray-800" onerror="this.onerror=null;this.src='/multimedia/placeholder.svg'">
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium">${escapeHTML(item.title)}</p>
          <p class="text-sm text-gray-500">${formatPrice(item.price)} × ${item.quantity}</p>
        </div>
        <p class="text-sm font-semibold">${formatPrice(item.lineTotal ?? item.price * item.quantity)}</p>
      </li>`).join("")}
  </ul>`;
}

export function orderTotalsHTML(order) {
  return `
  <dl class="space-y-2 text-sm">
    <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Subtotal</dt><dd>${formatPrice(order.subtotal)}</dd></div>
    <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Delivery</dt><dd>${order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
    <div class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold dark:border-gray-800"><dt>Total</dt><dd>${formatPrice(order.total)}</dd></div>
  </dl>`;
}

export function addressHTML(order) {
  const c = order.customer ?? {};
  const s = order.shipping ?? {};
  return `
  <address class="space-y-0.5 text-sm not-italic text-gray-700 dark:text-gray-300">
    <p class="font-semibold text-gray-900 dark:text-white">${escapeHTML(c.fullName)}</p>
    <p>${escapeHTML(s.address)}</p>
    <p>${escapeHTML([s.city, s.state].filter(Boolean).join(", "))}</p>
    <p>${escapeHTML(s.country)}</p>
    <p class="pt-2">${escapeHTML(c.phone)}</p>
    <p class="break-all">${escapeHTML(c.email)}</p>
  </address>`;
}
