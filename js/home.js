import "./header.js";
import { products } from "./products.js";
import { renderProducts } from "./renderProducts.js";
import "./productModal.js";


const homeContainer = document.getElementById("featuredProducts");

renderProducts(products.slice(0, 4), homeContainer, { mode: "home" });

function initBackToTop() {
  const backToTop = document.getElementById("backToTop");

  if (backToTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTop.style.opacity = "1";
        backToTop.style.visibility = "visible";
      } else {
        backToTop.style.opacity = "0";
        backToTop.style.visibility = "hidden";
      }
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
}

initBackToTop();