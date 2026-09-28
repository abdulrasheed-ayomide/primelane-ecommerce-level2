// Small building blocks shared by the admin sections.
import { escapeHTML } from "../utils.js";

export function statCard({ label, value, hint = "", tone = "indigo", href = "" }) {
  const tones = {
    indigo: "text-indigo-600 dark:text-indigo-400",
    green: "text-green-700 dark:text-green-400",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-900 dark:text-white",
  };
  const inner = `
    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${escapeHTML(label)}</p>
    <p class="mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${tones[tone]}">${escapeHTML(value)}</p>
    ${hint ? `<p class="mt-1 text-xs text-gray-500">${escapeHTML(hint)}</p>` : ""}`;
  return href
    ? `<a href="${href}" class="card block p-4 transition hover:border-indigo-300 hover:shadow-md sm:p-5 dark:hover:border-indigo-800">${inner}</a>`
    : `<div class="card p-4 sm:p-5">${inner}</div>`;
}

/**
 * Side sheet (full screen on phones) built on <dialog>.
 * Returns { dialog, body, close }. Content goes into `body`.
 */
export function openSheet(title, { wide = false } = {}) {
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-labelledby", "sheet-title");
  dialog.className = `m-0 ml-auto h-dvh max-h-dvh w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-w-full bg-white p-0 text-gray-800 shadow-2xl dark:bg-gray-900 dark:text-gray-100`;
  dialog.innerHTML = `
    <div class="flex h-full flex-col">
      <div class="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h2 id="sheet-title" class="truncate text-lg font-semibold">${escapeHTML(title)}</h2>
        <button type="button" data-close class="icon-btn -mr-2" aria-label="Close">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div data-body class="flex-1 overflow-y-auto p-5"></div>
    </div>`;
  document.body.appendChild(dialog);
  const close = () => dialog.close();
  dialog.querySelector("[data-close]").addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
  return { dialog, body: dialog.querySelector("[data-body]"), close };
}

/** Simple prev/next pagination markup. */
export function pagerHTML(page, pages, total, label = "items") {
  if (pages <= 1) return `<p class="text-sm text-gray-500">${total} ${label}</p>`;
  return `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500">Page ${page} of ${pages} · ${total} ${label}</p>
      <div class="flex gap-2">
        <button type="button" data-pager="${page - 1}" class="btn-secondary" ${page <= 1 ? "disabled" : ""}>Previous</button>
        <button type="button" data-pager="${page + 1}" class="btn-secondary" ${page >= pages ? "disabled" : ""}>Next</button>
      </div>
    </div>`;
}
