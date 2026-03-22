import { onAuthChange } from "./auth.js";
import { logout } from "./auth.js";
import { onCartChange } from "./cart.js";


const body = document.body;

document.addEventListener("DOMContentLoaded", () => {

  /* ================= SELECT ELEMENTS ================= */

  const loginBtns = document.querySelectorAll(".loginBtn");
  const signupBtns = document.querySelectorAll(".signupBtn");
  const userProfiles = document.querySelectorAll(".userProfile");
  const emails = document.querySelectorAll(".userEmail");
  const initials = document.querySelectorAll(".userInitial");
  const logoutBtns = document.querySelectorAll(".logoutBtn");

  const mobileToggle = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  const darkToggle = document.getElementById("darkToggle");
  const themeIcon = document.getElementById("themeIcon");

  const dropdownBtns = document.querySelectorAll(".userMenuBtn");
  const dropdowns = document.querySelectorAll(".userDropdown");

  const cartCount = document.querySelector(".cart-count");

  /* ================= AUTH UI ================= */

  onAuthChange((user) => {
    // remove loading lock (prevents flicker)
    body.classList.remove("auth-loading");

    if (user) {

      // hide login/signup everywhere
      loginBtns.forEach(btn => btn.classList.add("hidden"));
      signupBtns.forEach(btn => btn.classList.add("hidden"));

      // show profile everywhere
      userProfiles.forEach(profile =>
        profile.classList.remove("hidden")
      );

      // update email text
      emails.forEach(el => el.textContent = user.email);

      // update initials
      initials.forEach(el =>
        el.textContent = user.email[0].toUpperCase()
      );

    } else {

      // show login/signup
      loginBtns.forEach(btn => btn.classList.remove("hidden"));
      signupBtns.forEach(btn => btn.classList.remove("hidden"));

      // hide profile
      userProfiles.forEach(profile =>
        profile.classList.add("hidden")
      );
    }
  });

  /* ================= LOGOUT ================= */

  logoutBtns.forEach(btn =>
    btn.addEventListener("click", () => {
      confirmLogout();
    })
  );

  function confirmLogout() {

    const toast = document.createElement("div");

    toast.className = ` fixed bottom-6 right-6  bg-gray-900 text-white  px-5 py-4 rounded-xl shadow-lg flex items-center gap-4 z-50 `;

    toast.innerHTML = `
    <span>Are you sure you want to logout?</span>

    <button class="yes bg-red-600 px-3 py-1 rounded">
      Yes
    </button>

    <button class="no bg-gray-600 px-3 py-1 rounded">
      No
    </button>
  `;

    document.body.appendChild(toast);

    toast.querySelector(".yes").addEventListener("click", () => {
      logout();
      toast.remove();
    });

    toast.querySelector(".no").addEventListener("click", () => {
      toast.remove();
    });
  }



  /* ================= CART COUNT ================= */

  onCartChange((cart) => {
    if (cartCount) {

      const totalItems = cart.reduce((total, item) => {
        return total + (item.quantity || 1);
      }, 0);

      cartCount.textContent = totalItems;
    }
  });
  /* ================= MOBILE MENU ================= */

  mobileToggle?.addEventListener("click", () => {
    mobileMenu?.classList.toggle("hidden");
  });

  /* ================= DROPDOWN ================= */

  dropdownBtns.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns[index]?.classList.toggle("hidden");
    });
  });

  // close dropdown when clicking outside
  document.addEventListener("click", () => {
    dropdowns.forEach(d => d.classList.add("hidden"));
  });

  /* ================= DARK MODE ================= */

  function applyTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      if (themeIcon) themeIcon.textContent = "☀️";
    }
  }

  applyTheme();

  darkToggle?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");

    const isDark =
      document.documentElement.classList.contains("dark");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    if (themeIcon)
      themeIcon.textContent = isDark ? "☀️" : "🌙";
  });

});

/* ================= CART MODAL ================= */

// const cartIcon = document.getElementById("cartIcon");
// const cartModal = document.getElementById("cartModal");
// const closeCart = document.getElementById("closeCart");

// cartIcon?.addEventListener("click", () => {
//   cartModal.classList.remove("hidden");
//   cartModal.classList.add("flex");
// });

// closeCart?.addEventListener("click", () => {
//   cartModal.classList.add("hidden");
// });