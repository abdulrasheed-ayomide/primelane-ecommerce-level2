// Reusable UI pieces: confirm dialog, loading buttons, empty/error states.
import { escapeHTML } from "./utils.js";

/**
 * Accessible confirmation dialog. Resolves to true (confirm) or false (cancel).
 * Uses the native <dialog> element, which handles focus and the Escape key.
 */
export function confirmDialog({
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className =
      "w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-gray-800 shadow-2xl dark:bg-gray-900 dark:text-gray-100";
    dialog.setAttribute("aria-labelledby", "confirm-title");
    dialog.innerHTML = `
      <form method="dialog" class="p-6">
        <h2 id="confirm-title" class="text-lg font-semibold">${escapeHTML(title)}</h2>
        ${message ? `<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${escapeHTML(message)}</p>` : ""}
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button value="cancel" class="btn-secondary">${escapeHTML(cancelText)}</button>
          <button value="confirm" class="${danger ? "btn-danger" : "btn-primary"}">${escapeHTML(confirmText)}</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "confirm");
      dialog.remove();
    });
    dialog.showModal();
    dialog.querySelector('button[value="cancel"]').focus();
  });
}

/** Put a button into a loading state; returns a function that restores it. */
export function setButtonLoading(button, loadingText = "Please wait…") {
  if (!button) return () => {};
  const original = button.innerHTML;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${escapeHTML(loadingText)}</span>`;
  return () => {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = original;
  };
}

const STATE_ICONS = {
  empty: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>`,
  search: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>`,
  error: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>`,
  lock: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>`,
};

/**
 * Markup for an empty / error / no-access state.
 * `action` is { label, href } for a link, or { label, id } for a button.
 */
export function stateBlock({ icon = "empty", title, message = "", action } = {}) {
  let actionHTML = "";
  if (action?.href) {
    actionHTML = `<a href="${escapeHTML(action.href)}" class="btn-primary mt-6">${escapeHTML(action.label)}</a>`;
  } else if (action?.id) {
    actionHTML = `<button type="button" id="${escapeHTML(action.id)}" class="btn-primary mt-6">${escapeHTML(action.label)}</button>`;
  }
  const tone = icon === "error" ? "text-red-500" : "text-gray-400 dark:text-gray-500";
  return `
    <div class="col-span-full flex flex-col items-center justify-center px-4 py-16 text-center">
      <svg class="h-12 w-12 ${tone}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">${STATE_ICONS[icon] ?? STATE_ICONS.empty}</svg>
      <h2 class="mt-4 text-lg font-semibold">${escapeHTML(title)}</h2>
      ${message ? `<p class="mt-1 max-w-md text-sm text-gray-600 dark:text-gray-400">${escapeHTML(message)}</p>` : ""}
      ${actionHTML}
    </div>`;
}

/** Show an inline validation message under a field (and link it for screen readers). */
export function setFieldError(input, message) {
  if (!input) return;
  const id = `${input.id || input.name}-error`;
  let el = document.getElementById(id);
  if (message) {
    if (!el) {
      el = document.createElement("p");
      el.id = id;
      el.className = "field-error";
      input.insertAdjacentElement("afterend", el);
    }
    el.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", id);
  } else {
    el?.remove();
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

/** Run validators { fieldName: (value, form) => errorMessage | "" }. Returns true if valid. */
export function validateForm(form, validators) {
  let firstInvalid = null;
  for (const [name, check] of Object.entries(validators)) {
    const input = form.elements[name];
    if (!input) continue;
    const value = input.type === "checkbox" ? input.checked : input.value.trim();
    const message = check(value, form) || "";
    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  firstInvalid?.focus();
  return !firstInvalid;
}

export const validators = {
  required: (label) => (v) => (v ? "" : `${label} is required.`),
  email: (v) => (!v ? "Email is required." : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address."),
  phone: (v) => (!v ? "Phone number is required." : /^\+?[0-9\s-]{7,20}$/.test(v) ? "" : "Enter a valid phone number."),
};
