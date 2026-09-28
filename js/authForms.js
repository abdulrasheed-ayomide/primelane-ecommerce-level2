// Helpers shared by the login and signup pages.

/** Where to go after logging in. Only same-site paths are allowed (prevents open redirects). */
export function nextUrl() {
  const next = new URLSearchParams(location.search).get("next") || "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/index.html";
}

/** Carry ?next= across the login <-> signup links. */
export function keepNextParam(link) {
  const next = new URLSearchParams(location.search).get("next");
  if (link && next) link.href += `?next=${encodeURIComponent(next)}`;
}

export function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    const input = document.getElementById(btn.dataset.togglePassword);
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });
}

export function showFormError(message) {
  const box = document.getElementById("formError");
  box.textContent = message;
  box.classList.toggle("hidden", !message);
}

export function showFormNotice(message) {
  const box = document.getElementById("formNotice");
  if (!box) return;
  box.textContent = message;
  box.classList.toggle("hidden", !message);
}
