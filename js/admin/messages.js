// Admin → Messages: contact-form submissions.
import { markMessageRead, deleteMessage } from "../services/messages.js";
import { confirmDialog, stateBlock } from "../ui.js";
import { showToast } from "../toast.js";
import { escapeHTML, formatDate, friendlyError } from "../utils.js";

export async function render(main, ctx) {
  const messages = await ctx.get("messages");
  // render into a fresh element so listeners don't pile up on the shared <main>
  main.innerHTML = "<div></div>";
  const container = main.firstElementChild;

  function draw() {
    if (!messages.length) {
      container.innerHTML = `<div class="card">${stateBlock({ title: "No messages", message: "Messages sent from the contact form appear here." })}</div>`;
      return;
    }
    container.innerHTML = `<ul class="space-y-3">${messages.map((m) => `
      <li class="card p-5 ${m.read ? "" : "border-l-4 border-l-indigo-600"}">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold">${escapeHTML(m.subject)} ${m.read ? "" : '<span class="badge ml-1 bg-indigo-600 text-white">New</span>'}</p>
            <p class="break-all text-sm text-gray-500">${escapeHTML(m.name)} · ${escapeHTML(m.email)}</p>
          </div>
          <p class="text-xs text-gray-500">${formatDate(m.createdAt, true)}</p>
        </div>
        <p class="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">${escapeHTML(m.message)}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <a class="btn-primary px-3 py-1.5" href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: " + m.subject)}">Reply by email</a>
          <button type="button" data-toggle="${escapeHTML(m.id)}" class="btn-secondary px-3 py-1.5">${m.read ? "Mark unread" : "Mark read"}</button>
          <button type="button" data-delete="${escapeHTML(m.id)}" class="btn-ghost px-3 py-1.5 text-red-600 dark:text-red-400">Delete</button>
        </div>
      </li>`).join("")}</ul>`;
  }

  container.addEventListener("click", async (e) => {
    const toggleId = e.target.closest("[data-toggle]")?.dataset.toggle;
    const deleteId = e.target.closest("[data-delete]")?.dataset.delete;
    try {
      if (toggleId) {
        const m = messages.find((x) => x.id === toggleId);
        await markMessageRead(m.id, !m.read);
        m.read = !m.read;
        draw();
        ctx.updateUnreadBadge();
      }
      if (deleteId) {
        const ok = await confirmDialog({ title: "Delete this message?", confirmText: "Delete", danger: true });
        if (!ok) return;
        await deleteMessage(deleteId);
        messages.splice(messages.findIndex((x) => x.id === deleteId), 1);
        draw();
        ctx.updateUnreadBadge();
        showToast("Message deleted.", "success");
      }
    } catch (error) {
      showToast(friendlyError(error), "error");
    }
  });

  draw();
}
