// Admin → Settings: delivery fee. firestore.rules checks new orders against these values.
import { saveStoreSettings } from "../services/settings.js";
import { setButtonLoading, setFieldError } from "../ui.js";
import { showToast } from "../toast.js";
import { friendlyError } from "../utils.js";
import { ENABLE_IMAGE_UPLOADS } from "../config.js";

export async function render(container, ctx) {
  const settings = await ctx.get("settings");

  container.innerHTML = `
    <div class="max-w-2xl space-y-6">
      ${settings.exists ? "" : `<p class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Delivery settings haven't been saved yet, so customers can't check out. Review the values below and click <strong>Save settings</strong>.</p>`}
      <form id="settingsForm" class="card space-y-5 p-6" novalidate>
        <h2 class="text-lg font-semibold">Delivery</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="deliveryFee" class="label">Delivery fee (₦)</label>
            <input id="deliveryFee" name="deliveryFee" type="number" min="0" step="1" inputmode="numeric" class="input" value="${settings.deliveryFee}">
          </div>
          <div>
            <label for="freeDeliveryThreshold" class="label">Free delivery from (₦)</label>
            <input id="freeDeliveryThreshold" name="freeDeliveryThreshold" type="number" min="0" step="1" inputmode="numeric" class="input" value="${settings.freeDeliveryThreshold}" aria-describedby="threshold-hint">
            <p id="threshold-hint" class="mt-1 text-xs text-gray-500">Orders at or above this subtotal ship free. Use 0 to always charge delivery.</p>
          </div>
        </div>
        <p class="text-xs text-gray-500">Customers see the delivery fee in the cart and at checkout. When "Free delivery from" is above 0, a free-delivery message also appears on the home page, product pages, cart and checkout. Changes apply to new orders only; existing orders keep the fee they were charged.</p>
        <div class="flex justify-end"><button type="submit" class="btn-primary">Save settings</button></div>
      </form>

      <section class="card p-6 text-sm">
        <h2 class="text-lg font-semibold">Product images</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          ${ENABLE_IMAGE_UPLOADS
            ? "Image uploads through Firebase Storage are <strong>on</strong>."
            : `Products use image URLs. Uploading through Firebase Storage is built in but turned off, because Storage needs the Blaze (pay-as-you-go) plan.
               To turn it on later: upgrade to Blaze and create a Storage bucket in the Firebase console, publish the contents of <code>storage.rules</code> in
               <strong>Firebase Console → Storage → Rules</strong>, then set <code>ENABLE_IMAGE_UPLOADS = true</code> in <code>js/config.js</code>.`}
        </p>
      </section>
    </div>`;

  const form = container.querySelector("#settingsForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fee = Number(form.deliveryFee.value);
    const threshold = Number(form.freeDeliveryThreshold.value);
    setFieldError(form.deliveryFee, Number.isFinite(fee) && fee >= 0 && form.deliveryFee.value !== "" ? "" : "Enter 0 or more.");
    setFieldError(form.freeDeliveryThreshold, Number.isFinite(threshold) && threshold >= 0 && form.freeDeliveryThreshold.value !== "" ? "" : "Enter 0 or more.");
    if (form.querySelector('[aria-invalid="true"]')) return;

    const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Saving…");
    try {
      await saveStoreSettings({ deliveryFee: fee, freeDeliveryThreshold: threshold });
      ctx.invalidate("settings");
      showToast("Settings saved.", "success");
      ctx.rerender();
    } catch (error) {
      restore();
      showToast(friendlyError(error), "error");
    }
  });
}
