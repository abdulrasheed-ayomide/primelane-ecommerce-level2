import "./auth.js";
import "./header.js";
import "./cart.js";
import { products } from "./products.js";
import { renderProducts } from "./renderProducts.js";

const shopContainer = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

function filterProducts() {

  let filtered = products;

  const searchValue = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  if (searchValue) {
    filtered = filtered.filter(product =>
      product.title.toLowerCase().includes(searchValue)
    );
  }

  if (selectedCategory !== "all") {
    filtered = filtered.filter(product =>
      product.category === selectedCategory
    );
  }

  renderProducts(filtered, shopContainer, { mode: "shop" });
}

// initial render
renderProducts(products, shopContainer, { mode: "shop" });

// listeners
searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);