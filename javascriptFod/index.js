let display = document.getElementById("featuredProducts");
let loader = document.getElementById("loader");
 
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

    // Fetch products from API and render
async function fetchProducts() {
  try {
    loader.style.display = "flex";

    const response = await fetch(baseUrl);
    const data = await response.json();
    
    // With ?limit=4 in URL, data.products already has exactly 4 items
    displayProducts(data.products);

    loader.style.display = "none";
  } 
  catch (error) {
    console.error('Error fetching products:', error);
    loader.style.display = "none";
    
    display.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-500 dark:text-red-400">Failed to load products. Please try again later.</p>
      </div>
    `;
  }
}

// Modal functions
function openModal(productData) {
  // Fill in the modal with product data
  document.getElementById('modalImage').src = productData.image;
  document.getElementById('modalTitle').textContent = productData.title;
  document.getElementById('modalDescription').textContent = productData.description;
  document.getElementById('modalPrice').textContent = productData.price;
  document.getElementById('modalCategory').textContent = productData.category;
  document.getElementById('modalRating').innerHTML = productData.rating;
  document.getElementById('modalReviewCount').textContent = productData.reviews;
  
  // Show the modal
  document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
}

// Close modal when clicking outside
document.getElementById('productModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});