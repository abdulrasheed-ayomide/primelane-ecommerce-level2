// Shared site header + footer, dark mode, and cart badge.
// Each page has <div id="site-header"></div> and <div id="site-footer"></div>;
// this module fills them so the markup lives in ONE place.
import { onAuthChange, logout, isAdmin } from "./auth.js";
import { onCartChange } from "./cart.js";
import { confirmDialog } from "./ui.js";
import { showToast } from "./toast.js";
import { escapeHTML } from "./utils.js";
import { STORE_NAME } from "./config.js";

const ICON = {
  search: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z"/></svg>`,
  cart: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>`,
  sun: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>`,
  moon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>`,
  menu: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>`,
  close: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
};

const NAV = [
  { href: "/index.html", label: "Home", page: "home" },
  { href: "/pages/shop.html", label: "Shop", page: "shop" },
  { href: "/pages/shop.html?sale=1", label: "Deals", page: "deals" },
  { href: "/index.html#contact-section", label: "Contact", page: "contact" },
];

/* ---------------- Dark mode ---------------- */

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function updateThemeButtons() {
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.innerHTML = isDark() ? ICON.sun : ICON.moon;
    btn.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
  });
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark() ? "dark" : "light");
  } catch {}
  updateThemeButtons();
}

/* ---------------- Header ---------------- */

function headerHTML(currentPage) {
  const links = NAV.map(
    (n) => `<a href="${n.href}" class="nav-link" ${n.page === currentPage ? 'aria-current="page"' : ""}>${n.label}</a>`
  ).join("");

  return `
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg dark:focus:bg-gray-900">Skip to content</a>
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
    <div class="container-page flex h-16 items-center gap-3 md:h-18">
      <a href="/index.html" class="flex shrink-0 items-center" aria-label="${STORE_NAME} home">
        <img src="/multimedia/image.png" alt="${STORE_NAME}" class="h-9 w-auto md:h-11" width="120" height="44">
      </a>

      <nav class="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">${links}</nav>

      <form action="/pages/shop.html" role="search" class="ml-auto hidden max-w-sm flex-1 md:block" data-header-search>
        <label for="header-search" class="sr-only">Search products</label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">${ICON.search}</span>
          <input id="header-search" name="q" type="search" placeholder="Search products…" class="input pl-10" autocomplete="off">
        </div>
      </form>

      <div class="ml-auto flex items-center gap-1 md:ml-2">
        <button type="button" class="icon-btn" data-theme-toggle></button>

        <a href="/pages/cartpage.html" class="icon-btn relative" aria-label="Cart">
          ${ICON.cart}
          <span data-cart-count class="absolute -right-0.5 -top-0.5 hidden min-w-5 rounded-full bg-indigo-600 px-1 text-center text-[11px] leading-5 font-bold text-white">0</span>
        </a>

        <div data-auth-slot class="hidden md:block">
          <span class="skeleton block h-9 w-24"></span>
        </div>

        <button type="button" class="icon-btn lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">${ICON.menu}</button>
      </div>
    </div>

    <div id="mobile-menu" class="hidden border-t border-gray-200 lg:hidden dark:border-gray-800">
      <div class="container-page space-y-4 py-4">
        <form action="/pages/shop.html" role="search" class="md:hidden">
          <label for="mobile-search" class="sr-only">Search products</label>
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">${ICON.search}</span>
            <input id="mobile-search" name="q" type="search" placeholder="Search products…" class="input pl-10">
          </div>
        </form>
        <nav class="grid gap-1" aria-label="Mobile">
          ${NAV.map((n) => `<a href="${n.href}" class="rounded-lg px-3 py-2.5 font-medium hover:bg-gray-100 dark:hover:bg-gray-800" ${n.page === currentPage ? 'aria-current="page"' : ""}>${n.label}</a>`).join("")}
        </nav>
        <div data-mobile-auth-slot class="border-t border-gray-200 pt-4 dark:border-gray-800"></div>
      </div>
    </div>
  </header>`;
}

function initials(profile, user) {
  const source = profile?.fullName || user?.email || "?";
  return source.trim()[0].toUpperCase();
}

function renderAuth(user, profile) {
  const slot = document.querySelector("[data-auth-slot]");
  const mobileSlot = document.querySelector("[data-mobile-auth-slot]");
  if (!slot || !mobileSlot) return;

  if (!user) {
    slot.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="/pages/login.html" class="btn-ghost">Log in</a>
        <a href="/pages/signup.html" class="btn-primary">Sign up</a>
      </div>`;
    mobileSlot.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <a href="/pages/login.html" class="btn-secondary">Log in</a>
        <a href="/pages/signup.html" class="btn-primary">Sign up</a>
      </div>`;
    return;
  }

  const name = escapeHTML(profile?.fullName || user.email);
  const email = escapeHTML(user.email);
  const adminLink = isAdmin(profile)
    ? `<a href="/pages/admin.html" role="menuitem" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Admin dashboard</a>`
    : "";

  slot.innerHTML = `
    <div class="relative">
      <button type="button" data-user-menu-btn aria-haspopup="true" aria-expanded="false"
        class="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">${escapeHTML(initials(profile, user))}</span>
        <span class="hidden max-w-32 truncate text-sm font-medium xl:inline">${name}</span>
        <span class="sr-only">Open account menu</span>
      </button>
      <div data-user-menu role="menu" class="absolute right-0 mt-2 hidden w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <p class="text-xs text-gray-500">Signed in as</p>
          <p class="truncate text-sm font-semibold">${email}</p>
        </div>
        <a href="/pages/account.html" role="menuitem" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">My account</a>
        <a href="/pages/account.html#orders" role="menuitem" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">My orders</a>
        ${adminLink}
        <button type="button" data-logout role="menuitem" class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800">Sign out</button>
      </div>
    </div>`;

  mobileSlot.innerHTML = `
    <div class="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">${escapeHTML(initials(profile, user))}</span>
      <span class="min-w-0"><span class="block truncate text-sm font-semibold">${name}</span><span class="block truncate text-xs text-gray-500">${email}</span></span>
    </div>
    <nav class="mt-2 grid gap-1" aria-label="Account">
      <a href="/pages/account.html" class="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">My account</a>
      <a href="/pages/account.html#orders" class="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">My orders</a>
      ${isAdmin(profile) ? `<a href="/pages/admin.html" class="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">Admin dashboard</a>` : ""}
      <button type="button" data-logout class="rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800">Sign out</button>
    </nav>`;

  // user dropdown
  const btn = slot.querySelector("[data-user-menu-btn]");
  const menu = slot.querySelector("[data-user-menu]");
  const setOpen = (open) => {
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.classList.contains("hidden"));
  });
  document.addEventListener("click", (e) => {
    if (!slot.contains(e.target)) setOpen(false);
  });
  slot.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      btn.focus();
    }
  });

  document.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", handleLogout));
}

async function handleLogout() {
  const ok = await confirmDialog({ title: "Sign out?", message: "Your cart stays saved on this device.", confirmText: "Sign out" });
  if (!ok) return;
  await logout();
  showToast("You've been signed out.", "success");
  if (document.body.dataset.requiresAuth !== undefined) window.location.href = "/index.html";
}

function initMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("mobile-menu");
  toggle?.addEventListener("click", () => {
    const open = menu.classList.toggle("hidden") === false;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.innerHTML = open ? ICON.close : ICON.menu;
  });
}

/* ---------------- Footer ---------------- */

function footerHTML() {
  const year = new Date().getFullYear();
  const link = (href, label) =>
    `<li><a href="${href}" class="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">${label}</a></li>`;
  return `
  <footer class="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
    <div class="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
      <div class="col-span-2 space-y-4 md:col-span-1">
        <img src="/multimedia/image.png" alt="${STORE_NAME}" class="h-11 w-auto" loading="lazy" width="120" height="44">
        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Quality products, fair prices and delivery across Nigeria.</p>
      </div>
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide">Shop</h2>
        <ul class="space-y-2 text-sm">
          ${link("/pages/shop.html", "All products")}
          ${link("/pages/shop.html?sale=1", "Deals")}
          ${link("/pages/shop.html?category=Electronics", "Electronics")}
          ${link("/pages/shop.html?category=" + encodeURIComponent("Home & Kitchen"), "Home & Kitchen")}
        </ul>
      </div>
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide">Account</h2>
        <ul class="space-y-2 text-sm">
          ${link("/pages/account.html", "My account")}
          ${link("/pages/account.html#orders", "Track an order")}
          ${link("/pages/cartpage.html", "Cart")}
        </ul>
      </div>
      <div class="col-span-2 md:col-span-1">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide">Contact</h2>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li><a href="tel:+2349162231321" class="hover:text-indigo-600 dark:hover:text-indigo-400">+234 916 223 1321</a></li>
          <li><a href="mailto:ayomiderasheed226@gmail.com" class="break-all hover:text-indigo-600 dark:hover:text-indigo-400">ayomiderasheed226@gmail.com</a></li>
          <li>Ikeja, Lagos, Nigeria</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
      © ${year} ${STORE_NAME}. All rights reserved.
    </div>
  </footer>`;
}

/* ---------------- Mount ---------------- */

function mount() {
  const currentPage = document.body.dataset.page;
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.outerHTML = headerHTML(currentPage);
  if (footerSlot) footerSlot.outerHTML = footerHTML();

  document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));
  updateThemeButtons();
  initMobileMenu();

  // keep header search in sync with the current ?q=
  const q = new URLSearchParams(location.search).get("q");
  if (q) document.querySelectorAll('input[name="q"]').forEach((i) => (i.value = q));

  onAuthChange(renderAuth);

  onCartChange((cart) => {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count > 99 ? "99+" : String(count);
      el.classList.toggle("hidden", count === 0);
    });
    document.querySelectorAll('a[aria-label^="Cart"]').forEach((a) =>
      a.setAttribute("aria-label", `Cart, ${count} item${count === 1 ? "" : "s"}`)
    );
  });
}

mount();
