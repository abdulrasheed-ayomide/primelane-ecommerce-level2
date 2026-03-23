import { addToCart } from "./cart.js";
import { openModal } from "./productModal.js";

export function renderProducts(products, container, options = {}) {

  if (!container || !Array.isArray(products)) return;

  container.innerHTML = "";

  products.forEach(product => {

    const {
      image,
      title,
      category,
      description,
      price,
      oldPrice,
      rating,
      stock
    } = product;

    const rate = rating?.rate ?? 0;
    const count = rating?.count ?? 0;

    const card = document.createElement("div");
    card.className =
      "bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2";
    /* ================= HOME MODE ================= */
    if (options.mode === "home") {

      card.innerHTML = `
        <img src="${image}" 
             class="w-full h-52 object-cover">

        <div class="p-5 flex flex-col flex-grow">

          <p class="text-sm text-gray-400 mb-1">
            ${category}
          </p>

          <h3 class="text-xl font-semibold mb-2">
            ${title}
          </h3>

          <div class="text-yellow-400 text-sm mb-2">
            ⭐ ${rate} 
            <span class="text-gray-400">
              (${count})
            </span>
          </div>

          <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 flex-grow">
            ${description.slice(0, 80)}...
          </p>

          <div class="mb-2">
            <span class="text-green-400 text-2xl font-bold">
              $${price}
            </span>
            ${oldPrice
          ? `<span class="text-gray-500 line-through ml-2">$${oldPrice}</span>`
          : ""
        }
          </div>

          <p class="text-green-400 text-sm mb-4">
            ${stock > 0 ? `✔ In Stock (${stock})` : "Out of Stock"}
          </p>

          <button class="view-more  bg-gray-200 dark:bg-gray-800   hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white  py-2 rounded-xl transition">
            View More
          </button>

        </div>
      `;

      card.querySelector(".view-more")
        ?.addEventListener("click", () => openModal(product));
    }

    /* ================= SHOP MODE ================= */
    else {

      card.innerHTML = `
        <img src="${image}" 
             class="w-full h-52 object-cover">

        <div class="p-5 flex flex-col flex-grow">

          <p class="text-sm text-gray-400 mb-1">
            ${category}
          </p>

          <h3 class="text-xl font-semibold mb-2">
            ${title}
          </h3>

          <div class="text-yellow-400 text-sm mb-2">
            ⭐ ${rate}
            <span class="text-gray-400">
              (${count})
            </span>
          </div>

          <p class="text-gray-400 text-sm mb-4">
            ${description.slice(0, 200)}
          </p>

          <div class="flex justify-between items-center mb-4">
            <div>
              <span class="text-green-400 text-2xl font-bold">
                $${price}
              </span>
              ${oldPrice
          ? `<span class="text-gray-500 line-through ml-2">$${oldPrice}</span>`
          : ""
        }
            </div>
          </div>

          <button class="add-to-cart bg-green-600 hover:bg-green-700 
                         py-2 rounded-xl transition">
            Add to Cart
          </button>

        </div>
      `;

      card.querySelector(".add-to-cart")
        ?.addEventListener("click", () =>
          addToCart({ ...product, quantity: 1 })
        );
    }

    container.appendChild(card);
  });
}