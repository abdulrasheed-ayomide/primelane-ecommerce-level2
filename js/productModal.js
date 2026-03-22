import { addToCart } from "./cart.js";

const modal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const closeBtn = document.getElementById("closeProductModal");

const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalRating = document.getElementById("modalRating");
const modalStock = document.getElementById("modalStock");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalAddToCart = document.getElementById("modalAddToCart");

let currentProduct = null;

export function openModal(product) {

  currentProduct = product;

  modalImage.src = product.image;
  modalTitle.textContent = product.title;
  modalDescription.textContent = product.description;

  modalCategory.textContent = product.category ?? "";

  modalRating.textContent = 
    `⭐ ${product.rating?.rate ?? 0} 
     (${product.rating?.count ?? 0} reviews)`;

  modalStock.textContent =
    product.stock > 0
      ? `✔ In Stock (${product.stock})`
      : "Out of Stock";

  modalPrice.innerHTML = `
    <span class="text-green-400 text-3xl font-bold">
      $${product.price}
    </span>
    ${
      product.oldPrice
        ? `<span class="line-through text-gray-500 ml-3">$${product.oldPrice}</span>`
        : ""
    }
  `;

  modal.classList.remove("hidden");

  setTimeout(() => {
    modal.classList.remove("opacity-0");
    modal.classList.add("flex");
    modalContent.classList.remove("scale-95");
    modalContent.classList.add("scale-100");
  }, 10);
}

function closeModal() {
  modal.classList.add("opacity-0");
  modalContent.classList.remove("scale-100");
  modalContent.classList.add("scale-95");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

closeBtn?.addEventListener("click", closeModal);

// click outside to close
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// ESC key close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

modalAddToCart?.addEventListener("click", () => {
  if (currentProduct) {
    addToCart(currentProduct);
    closeModal();
  }
});
