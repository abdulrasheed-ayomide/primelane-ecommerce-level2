// Dashboard overview: every number is calculated from Firestore data.
import { statCard } from "./common.js";
import { escapeHTML, formatPrice, formatDate, orderRef, statusBadge, toDate } from "../utils.js";
import { LOW_STOCK_THRESHOLD, ORDER_STATUSES, STATUS_META } from "../config.js";

const OPEN_STATUSES = ["placed", "confirmed", "processing", "shipped", "out_for_delivery"];
const DAYS = 14;

export async function render(container, ctx) {
  const [products, orders, users, settings] = await Promise.all([
    ctx.get("products"), ctx.get("orders"), ctx.get("users"), ctx.get("settings"),
  ]);

  const counted = orders.filter((o) => o.status !== "cancelled" && o.status !== "failed");
  const totalSales = counted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pending = orders.filter((o) => OPEN_STATUSES.includes(o.status));
  const completed = orders.filter((o) => o.status === "delivered");
  const customers = users.filter((u) => u.role !== "admin");
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);
  const needsSetup = !products.length || !settings.exists;

  container.innerHTML = `
    ${needsSetup ? setupHTML(products.length, settings.exists) : ""}

    <section aria-label="Key figures" class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      ${statCard({ label: "Total sales", value: formatPrice(totalSales), hint: "Excludes cancelled & failed", tone: "green" })}
      ${statCard({ label: "Total orders", value: orders.length.toLocaleString(), href: "#orders" })}
      ${statCard({ label: "Pending orders", value: pending.length.toLocaleString(), hint: "Not yet delivered", tone: pending.length ? "amber" : "gray", href: "#orders?status=open" })}
      ${statCard({ label: "Completed orders", value: completed.length.toLocaleString(), hint: "Delivered", tone: "gray", href: "#orders?status=delivered" })}
      ${statCard({ label: "Products", value: products.length.toLocaleString(), href: "#products", tone: "gray" })}
      ${statCard({ label: "Customers", value: customers.length.toLocaleString(), href: "#customers", tone: "gray" })}
      ${statCard({ label: "Low stock", value: lowStock.length.toLocaleString(), hint: `${LOW_STOCK_THRESHOLD} or fewer left`, tone: lowStock.length ? "red" : "gray", href: "#products?stock=low" })}
      ${statCard({ label: "Average order", value: counted.length ? formatPrice(totalSales / counted.length) : "—", tone: "gray" })}
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <section class="card p-5 xl:col-span-2" aria-labelledby="sales-heading">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sales-heading" class="font-semibold">Sales, last ${DAYS} days</h2>
          <p class="text-sm text-gray-500" id="salesTotal"></p>
        </div>
        <div id="salesChart" class="relative mt-4"></div>
      </section>

      <section class="card p-5" aria-labelledby="status-heading">
        <h2 id="status-heading" class="font-semibold">Orders by status</h2>
        ${statusBreakdownHTML(orders)}
      </section>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <section class="card overflow-hidden" aria-labelledby="recent-heading">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 id="recent-heading" class="font-semibold">Recent orders</h2>
          <a href="#orders" class="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">View all</a>
        </div>
        ${orders.length ? `<ul class="divide-y divide-gray-200 dark:divide-gray-800">${orders.slice(0, 6).map((o) => `
          <li><a href="#orders?open=${encodeURIComponent(o.id)}" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">${escapeHTML(orderRef(o.id))} · ${escapeHTML(o.customer?.fullName ?? "")}</p>
              <p class="text-xs text-gray-500">${formatDate(o.createdAt, true)}</p>
            </div>
            <div class="text-right"><p class="text-sm font-semibold">${formatPrice(o.total)}</p>${statusBadge(o.status)}</div>
          </a></li>`).join("")}</ul>` : `<p class="p-5 text-sm text-gray-500">No orders yet.</p>`}
      </section>

      <section class="card overflow-hidden" aria-labelledby="low-heading">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 id="low-heading" class="font-semibold">Low stock</h2>
          <a href="#products?stock=low" class="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Manage stock</a>
        </div>
        ${lowStock.length ? `<ul class="divide-y divide-gray-200 dark:divide-gray-800">${lowStock.slice(0, 6).map((p) => `
          <li class="flex items-center gap-3 px-5 py-3">
            <p class="min-w-0 flex-1 truncate text-sm">${escapeHTML(p.title)}</p>
            <span class="badge ${p.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}">${p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
          </li>`).join("")}</ul>` : `<p class="p-5 text-sm text-gray-500">All products are well stocked.</p>`}
      </section>
    </div>`;

  renderSalesChart(container.querySelector("#salesChart"), counted);
  container.querySelector("#setupImport")?.addEventListener("click", () => ctx.navigate("products"));
  container.querySelector("#setupSettings")?.addEventListener("click", () => ctx.navigate("settings"));
}

function setupHTML(hasProducts, hasSettings) {
  return `
    <section class="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40" aria-labelledby="setup-heading">
      <h2 id="setup-heading" class="font-semibold text-indigo-900 dark:text-indigo-100">Finish setting up the store</h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li class="flex flex-wrap items-center gap-2">${hasProducts ? "✅ Products added" : `⬜ Add products <button id="setupImport" type="button" class="btn-primary px-3 py-1.5">Go to products</button>`}</li>
        <li class="flex flex-wrap items-center gap-2">${hasSettings ? "✅ Delivery settings saved" : `⬜ Save delivery settings (needed before customers can check out) <button id="setupSettings" type="button" class="btn-primary px-3 py-1.5">Open settings</button>`}</li>
      </ul>
    </section>`;
}

function statusBreakdownHTML(orders) {
  if (!orders.length) return `<p class="mt-4 text-sm text-gray-500">No orders yet.</p>`;
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  orders.forEach((o) => (counts[o.status] = (counts[o.status] ?? 0) + 1));
  const max = Math.max(...Object.values(counts), 1);
  return `
    <ul class="mt-4 space-y-3">
      ${ORDER_STATUSES.map((s) => `
        <li>
          <a href="#orders?status=${s}" class="block rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div class="flex justify-between text-sm"><span>${escapeHTML(STATUS_META[s].short)}</span><span class="font-semibold tabular-nums">${counts[s]}</span></div>
            <div class="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
              <div class="h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" style="width:${(counts[s] / max) * 100}%"></div>
            </div>
          </a>
        </li>`).join("")}
    </ul>`;
}

/** Single-series bar chart (inline SVG) of daily sales, with a hover/focus tooltip and a table fallback. */
function renderSalesChart(el, orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return { date: d, total: 0, count: 0 };
  });
  orders.forEach((o) => {
    const d = toDate(o.createdAt);
    if (!d) return;
    d.setHours(0, 0, 0, 0);
    const day = days.find((x) => x.date.getTime() === d.getTime());
    if (day) {
      day.total += Number(o.total) || 0;
      day.count += 1;
    }
  });

  const sum = days.reduce((s, d) => s + d.total, 0);
  el.parentElement.querySelector("#salesTotal").textContent = `${formatPrice(sum)} total`;

  if (sum === 0) {
    el.innerHTML = `<p class="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500 dark:bg-gray-800/40">No sales in the last ${DAYS} days.</p>`;
    return;
  }

  const W = 700, H = 220, padL = 8, padR = 8, padT = 12, padB = 28;
  const max = Math.max(...days.map((d) => d.total));
  const niceMax = niceCeil(max);
  const slot = (W - padL - padR) / DAYS;
  const barW = Math.max(6, slot - 6);
  const y = (v) => padT + (H - padT - padB) * (1 - v / niceMax);
  const label = (d) => d.date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

  const grid = [0.5, 1].map((f) => `<line x1="${padL}" x2="${W - padR}" y1="${y(niceMax * f)}" y2="${y(niceMax * f)}" class="stroke-gray-200 dark:stroke-gray-800" stroke-dasharray="3 3"/>
      <text x="${padL}" y="${y(niceMax * f) - 4}" class="fill-gray-500 text-[11px]">${formatPrice(niceMax * f)}</text>`).join("");

  const bars = days.map((d, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const top = y(d.total);
    const h = Math.max(0, H - padB - top);
    const r = Math.min(4, barW / 2, h);
    // rounded top corners, square at the baseline
    const path = h > 0
      ? `M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - padB} Z`
      : "";
    return `
      <g data-i="${i}" tabindex="0" role="img" aria-label="${label(d)}: ${formatPrice(d.total)} from ${d.count} order${d.count === 1 ? "" : "s"}" class="outline-none">
        <rect x="${padL + i * slot}" y="${padT}" width="${slot}" height="${H - padT - padB}" fill="transparent"/>
        ${path ? `<path d="${path}" class="fill-indigo-600 transition-opacity dark:fill-indigo-400"/>` : ""}
        ${i % 2 === (DAYS - 1) % 2 ? `<text x="${padL + i * slot + slot / 2}" y="${H - 8}" text-anchor="middle" class="fill-gray-500 text-[11px]">${label(d)}</text>` : ""}
      </g>`;
  }).join("");

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="h-auto w-full" role="group" aria-label="Daily sales for the last ${DAYS} days">
      ${grid}
      <line x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" class="stroke-gray-300 dark:stroke-gray-700"/>
      ${bars}
    </svg>
    <div data-tip class="pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"></div>
    <details class="mt-3 text-sm">
      <summary class="cursor-pointer text-gray-500">Show as table</summary>
      <div class="mt-2 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead><tr class="text-gray-500"><th class="py-1 pr-4 font-medium">Day</th><th class="py-1 pr-4 font-medium">Orders</th><th class="py-1 font-medium">Sales</th></tr></thead>
          <tbody>${days.map((d) => `<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-1 pr-4">${label(d)}</td><td class="py-1 pr-4 tabular-nums">${d.count}</td><td class="py-1 tabular-nums">${formatPrice(d.total)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </details>`;

  const tip = el.querySelector("[data-tip]");
  const svg = el.querySelector("svg");
  const show = (g) => {
    const d = days[Number(g.dataset.i)];
    tip.innerHTML = `<p class="font-semibold">${label(d)}</p><p>${formatPrice(d.total)} · ${d.count} order${d.count === 1 ? "" : "s"}</p>`;
    tip.classList.remove("hidden");
    const box = g.getBoundingClientRect();
    const parent = el.getBoundingClientRect();
    const left = Math.min(Math.max(box.left - parent.left + box.width / 2 - tip.offsetWidth / 2, 0), parent.width - tip.offsetWidth);
    tip.style.left = `${left}px`;
    tip.style.top = `0px`;
    svg.querySelectorAll("path").forEach((p) => p.style.opacity = p.closest("g") === g ? "1" : "0.45");
  };
  const hide = () => {
    tip.classList.add("hidden");
    svg.querySelectorAll("path").forEach((p) => (p.style.opacity = "1"));
  };
  svg.querySelectorAll("g[data-i]").forEach((g) => {
    g.addEventListener("mouseenter", () => show(g));
    g.addEventListener("focus", () => show(g));
    g.addEventListener("mouseleave", hide);
    g.addEventListener("blur", hide);
  });
}

function niceCeil(value) {
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * exp;
}
