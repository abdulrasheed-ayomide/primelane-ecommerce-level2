// Toast notifications. Creates its own container, so pages don't need one.
const ICONS = { success: "✓", error: "✕", warning: "!", info: "i" };
const COLORS = {
  success: "bg-green-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
  info: "bg-gray-900 dark:bg-gray-700",
};

function getContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  container.className =
    "pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end";
  container.setAttribute("role", "status");
  container.setAttribute("aria-live", "polite");
  return container;
}

export function showToast(message, type = "info", duration = 3500) {
  const container = getContainer();
  const toast = document.createElement("div");
  toast.className = `${COLORS[type] ?? COLORS.info} pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg transition duration-300 opacity-0 -translate-y-2`;

  const icon = document.createElement("span");
  icon.className = "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS[type] ?? ICONS.info;

  const text = document.createElement("p");
  text.className = "flex-1";
  text.textContent = message; // textContent, never innerHTML, for user-facing messages

  toast.append(icon, text);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.remove("opacity-0", "-translate-y-2"));
  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
