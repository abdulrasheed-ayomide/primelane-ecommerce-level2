// Admin dashboard shell: access check, navigation, and a shared data cache.
// Each section lives in js/admin/*.js and exports render(container, ctx).
//
// Security note: hiding this page is NOT what protects admin data.
// firestore.rules only lets users whose users/{uid}.role == "admin" read all
// orders/users or change products. This check just gives a friendly screen.
import "./header.js"; // dark-mode toggle
import { authReady, isAdmin, loginUrl } from "./auth.js";
import { listProducts } from "./services/products.js";
import { listAllOrders } from "./services/orders.js";
import { listUsers } from "./services/users.js";
import { listMessages } from "./services/messages.js";
import { getStoreSettings } from "./services/settings.js";
import { stateBlock } from "./ui.js";
import { escapeHTML, friendlyError } from "./utils.js";

const SECTIONS = {
  overview: { label: "Overview", module: "./admin/overview.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5M7.5 21l4.5-4.5 4.5 4.5M7.5 10.5l3 3 3-3 3 3"/>` },
  orders: { label: "Orders", module: "./admin/orders.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>` },
  products: { label: "Products", module: "./admin/products.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>` },
  customers: { label: "Customers", module: "./admin/customers.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>` },
  messages: { label: "Messages", module: "./admin/messages.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>` },
  settings: { label: "Settings", module: "./admin/settings.js", icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>` },
};

const main = document.getElementById("adminMain");
const nav = document.getElementById("adminNav");
const sidebar = document.getElementById("adminSidebar");
const overlay = document.getElementById("sidebarOverlay");

/* ---------- Shared data cache (one fetch per collection until refreshed) ---------- */

const loaders = {
  products: () => listProducts({ fresh: true }),
  orders: listAllOrders,
  users: listUsers,
  messages: listMessages,
  settings: getStoreSettings,
};
const cache = {};

const ctx = {
  get(key) {
    cache[key] ??= loaders[key]().catch((error) => {
      delete cache[key];
      throw error;
    });
    return cache[key];
  },
  invalidate(...keys) {
    (keys.length ? keys : Object.keys(cache)).forEach((k) => delete cache[k]);
  },
  navigate(section, params = "") {
    location.hash = section + (params ? `?${params}` : "");
  },
  rerender: () => route(),
  currentUser: null,
};

/* ---------- Routing (#section?param=value) ---------- */

function parseHash() {
  const [section, query = ""] = location.hash.slice(1).split("?");
  return { section: SECTIONS[section] ? section : "overview", params: new URLSearchParams(query) };
}

function renderNav(active) {
  nav.innerHTML = Object.entries(SECTIONS)
    .map(([key, s]) => `
      <a href="#${key}" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
        key === active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }" ${key === active ? 'aria-current="page"' : ""}>
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true">${s.icon}</svg>
        ${s.label}
        ${key === "messages" ? `<span data-unread class="badge ml-auto hidden bg-indigo-600 text-white"></span>` : ""}
      </a>`)
    .join("");
  updateUnreadBadge();
}

async function updateUnreadBadge() {
  try {
    const unread = (await ctx.get("messages")).filter((m) => !m.read).length;
    const badge = nav.querySelector("[data-unread]");
    if (badge) {
      badge.textContent = unread;
      badge.classList.toggle("hidden", unread === 0);
    }
  } catch {}
}
ctx.updateUnreadBadge = updateUnreadBadge;

let renderToken = 0;
async function route() {
  const { section, params } = parseHash();
  const token = ++renderToken;
  document.getElementById("adminTitle").textContent = SECTIONS[section].label;
  document.title = `${SECTIONS[section].label} | PrimeLane Admin`;
  renderNav(section);
  closeSidebar();

  main.innerHTML = `<div class="flex items-center gap-3 py-20 text-gray-500 justify-center"><span class="spinner h-5 w-5"></span> Loading…</div>`;
  try {
    const module = await import(SECTIONS[section].module);
    if (token !== renderToken) return; // user navigated away meanwhile
    await module.render(main, ctx, params);
  } catch (error) {
    console.error(error);
    if (token !== renderToken) return;
    main.innerHTML = `<div class="card">${stateBlock({ icon: "error", title: "Couldn't load this section", message: friendlyError(error), action: { label: "Try again", id: "retrySection" } })}</div>`;
    document.getElementById("retrySection").addEventListener("click", () => {
      ctx.invalidate();
      route();
    });
  }
  main.focus?.({ preventScroll: true });
  window.scrollTo(0, 0);
}

/* ---------- Mobile sidebar ---------- */

function openSidebar() {
  sidebar.classList.remove("-translate-x-full");
  overlay.classList.remove("hidden");
  document.getElementById("openSidebar").setAttribute("aria-expanded", "true");
}
function closeSidebar() {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
  document.getElementById("openSidebar").setAttribute("aria-expanded", "false");
}
document.getElementById("openSidebar").addEventListener("click", openSidebar);
document.getElementById("closeSidebar").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeSidebar();
});

document.getElementById("refreshData").addEventListener("click", () => {
  ctx.invalidate();
  route();
});

/* ---------- Start ---------- */

(async function init() {
  const gate = document.getElementById("adminGate");
  const { user, profile } = await authReady();

  if (!user) {
    location.replace(loginUrl());
    return;
  }
  if (!isAdmin(profile)) {
    gate.innerHTML = `<div class="card w-full max-w-lg">${stateBlock({
      icon: "lock",
      title: "Admins only",
      message: `You're signed in as ${user.email}, which is not an admin account.`,
      action: { label: "Back to store", href: "/index.html" },
    })}</div>`;
    return;
  }

  ctx.currentUser = user;
  document.getElementById("adminUser").innerHTML = escapeHTML(profile.fullName || user.email);
  gate.remove();
  document.getElementById("adminApp").classList.remove("hidden");
  main.tabIndex = -1;
  window.addEventListener("hashchange", route);
  route();
})();
