// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Dark mode toggle
const darkToggle = document.getElementById('darkToggle');
const themeIcon = document.getElementById('themeIcon');

// Check for saved theme preference
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  themeIcon.textContent = '☀️';
} else {
  document.documentElement.classList.remove('dark');
  themeIcon.textContent = '🌙';
}

darkToggle.addEventListener('click', () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
    themeIcon.textContent = '🌙';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
    themeIcon.textContent = '☀️';
  }
});

// Back to top button
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTop.style.opacity = '1';
    backToTop.style.visibility = 'visible';
  } else {
    backToTop.style.opacity = '0';
    backToTop.style.visibility = 'hidden';
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Close mobile menu on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    mobileMenu.classList.add('hidden');
  }
});

// Modal box pop up for feature product
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalContent = document.getElementById("modalContent");

const products = document.querySelectorAll("#featured-Products .product");

products.forEach(product => {

  const viewBtn = product.querySelector(".viewBtn");

  viewBtn.addEventListener("click", () => {
    // e.stopPropagation(); // Prevents triggering parent click

    modalContent.innerHTML = "";

    const clone = product.cloneNode(true);

    // 🔥 REMOVE line clamp inside modal
    const desc = clone.querySelector(".desc");
    desc.classList.remove("line-clamp-2");

    // 🔥 Change button text to Add to Cart
    const modalBtn = clone.querySelector(".viewBtn");
    modalBtn.textContent = "Add to Cart";
    modalBtn.classList.remove("bg-black");
    modalBtn.classList.add("bg-green-600");

    // Optional: Add cart click action
    modalBtn.addEventListener("click", () => {
      alert("Added to cart!");
    });


    const image = clone.querySelector("img");
    image.classList.remove("h-48");
    image.classList.add("h-64", "md:h-auto", "object-cover");

    const details = clone.querySelector(".p-5");

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = `flex flex-col md:flex-row  gap-6 items-center`;

    // Style image properly
    image.className = `w-full md:w-1/2  h-64 md:h-auto  object-cover  rounded-lg `;

    // Style details
    details.classList.add("w-full", "md:w-2/5");

    wrapper.appendChild(image);
    wrapper.appendChild(details);

    modalContent.appendChild(wrapper);

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  });
});

// close function
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden"); 
});

