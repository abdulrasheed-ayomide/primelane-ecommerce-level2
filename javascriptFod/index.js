// ========== IMPORT PRODUCTS AND CART ==========
import { products } from './fourProduct.js';
import {
    addToCart,
    onCartUpdate,
    initCart,
    getCurrentUser
} from './cart.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Initialize auth
const auth = getAuth();

// ========== DARK MODE FUNCTIONALITY ==========
function initDarkMode() {
    const darkToggle = document.getElementById('darkToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        htmlElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = '🌙';
    }

    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            if (htmlElement.classList.contains('dark')) {
                if (themeIcon) themeIcon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            } else {
                if (themeIcon) themeIcon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// ========== MOBILE MENU FUNCTIONALITY ==========
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileToggle && !mobileMenu.classList.contains('hidden')) {
                if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// ========== BACK TO TOP BUTTON ==========
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
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
    }
}

// ========== UPDATE AUTH UI ==========
function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userProfile = document.getElementById('userProfile');
    const mobileAuthLinks = document.getElementById('mobileAuthLinks');
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    const userInitial = document.getElementById('userInitial');
    const mobileUserInitial = document.getElementById('mobileUserInitial');
    
    if (user) {
        // User is logged in
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signupBtn) signupBtn.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        
        // Hide mobile auth links, show mobile user menu
        if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
        
        // Set user email and initial
        const email = user.email || 'User';
        const initial = email.charAt(0).toUpperCase();
        
        if (userEmailDisplay) userEmailDisplay.textContent = email;
        if (dropdownUserEmail) dropdownUserEmail.textContent = email;
        if (mobileUserEmail) mobileUserEmail.textContent = email;
        if (userInitial) userInitial.textContent = initial;
        if (mobileUserInitial) mobileUserInitial.textContent = initial;
        
    } else {
        // User is logged out
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        
        // Show mobile auth links, hide mobile user menu
        if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
    }
}

// ========== USER DROPDOWN MENU ==========
function initUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        // Toggle dropdown on click
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}

// ========== LOGOUT FUNCTIONALITY ==========
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            showToast('Logged out successfully', 'success');
            
            // Close dropdown if open
            const userDropdown = document.getElementById('userDropdown');
            if (userDropdown) userDropdown.classList.add('hidden');
            
            // Close mobile menu
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out', 'error');
        }
    };
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleLogout);
    }
}

// ========== PRODUCT MODAL FUNCTIONALITY ==========
window.showProductModal = function (product) {
    // Remove existing modal
    const existingModal = document.getElementById('productModal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    // Parse colors and features
    const colorsList = Array.isArray(product.colors)
        ? product.colors.join(', ')
        : product.colors || 'Not specified';

    const featuresList = Array.isArray(product.features)
        ? product.features.join(' • ')
        : product.features || 'No features listed';

    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <!-- Close button -->
            <button onclick="this.closest('#productModal').remove()" 
                class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all z-10">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            
            <!-- Modal content -->
            <div class="p-6">
                <!-- Image -->
                <div class="relative mb-6">
                    <img src="${product.image}" alt="${product.title}" 
                        class="w-full h-80 object-contain bg-gray-50 dark:bg-gray-700 rounded-lg">
                    ${product.badge ? `
                        <span class="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ${product.badge}
                        </span>
                    ` : ''}
                </div>
                
                <!-- Title -->
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">${product.title}</h2>
                
                <!-- Categories -->
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                        ${product.category}
                    </span>
                </div>
                
                <!-- Rating -->
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex text-yellow-400">
                        ${Array(5).fill(0).map((_, i) => `
                            <svg class="w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}" 
                                fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                        `).join('')}
                    </div>
                    <span class="text-gray-600 dark:text-gray-400">${product.rating} (${product.reviews || 0} reviews)</span>
                </div>
                
                <!-- Price -->
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-3xl font-bold text-green-600 dark:text-green-400">$${product.price}</span>
                    ${product.originalPrice ? `
                        <span class="text-gray-400 line-through text-lg">$${product.originalPrice}</span>
                    ` : ''}
                </div>
                
                <!-- Description -->
                <div class="mb-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">${product.description}</p>
                </div>
                
                <!-- Stock -->
                <div class="mb-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Availability</h3>
                    <p class="${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-medium">
                        ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
                    </p>
                </div>
                
                <!-- Colors -->
                ${product.colors ? `
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Colors</h3>
                        <p class="text-gray-600 dark:text-gray-400">${colorsList}</p>
                    </div>
                ` : ''}
                
                <!-- Features -->
                ${product.features ? `
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Features</h3>
                        <p class="text-gray-600 dark:text-gray-400">${featuresList}</p>
                    </div>
                ` : ''}
                
                <!-- Add to cart button -->
                <button onclick='window.handleAddToCart(${JSON.stringify(product).replace(/'/g, "\\'")}); this.closest("#productModal").remove()'
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all font-semibold text-lg flex items-center justify-center gap-2"
                    ${product.stock === 0 ? 'disabled' : ''}>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

// ========== RENDER PRODUCTS ==========
function renderProducts() {
    const container = document.getElementById('featured-Products');
    if (!container) return;

    container.innerHTML = '';

    products.forEach((product) => {
        const productCard = document.createElement('div');
        productCard.className = 'product bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2';

        productCard.innerHTML = `
            <div class="relative overflow-hidden h-64">
                <img src="${product.image}" alt="${product.title}" 
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    ${product.badge || '-12%'}
                </div>
                <div class="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                    Best Seller
                </div>
            </div>
            <div class="p-5">
                <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">${product.category}</p>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    ${product.title}
                </h3>
                <div class="flex items-center gap-2 mb-3">
                    <div class="flex text-yellow-400">
                        ★★★★★
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">(${product.reviews})</span>
                </div>
                <p class="desc text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    ${product.description}
                </p>
                <ul class="text-sm text-gray-500 mb-4 list-disc pl-4 space-y-1">
                    ${product.features.slice(0, 3).map(f => `<li>${f}</li>`).join('')}
                </ul>
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">$${product.price}</span>
                    <span class="text-sm text-gray-500 line-through">$${product.originalPrice}</span>
                </div>
                <button onclick='window.showProductModal(${JSON.stringify(product).replace(/'/g, "\\'")})'
                    class="viewBtn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                    View More
                </button>
            </div>
        `;

        container.appendChild(productCard);
    });
}

// ========== HANDLE ADD TO CART WITH AUTH CHECK ==========
window.handleAddToCart = async function (product) {
    const user = getCurrentUser();

    if (!user) {
        showToast('Please login to add items to cart', 'warning');

        // Save the product to localStorage to add after login
        localStorage.setItem('pendingCartItem', JSON.stringify(product));

        setTimeout(() => {
            window.location.href = './otherPages/login.html';
        }, 2000);
        return;
    }

    await addToCart(product);
};

// ========== SHOW TOAST ==========
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    let bgColor = 'bg-green-500';
    let icon = 'fa-check-circle';

    if (type === 'error') {
        bgColor = 'bg-red-500';
        icon = 'fa-exclamation-circle';
    }
    if (type === 'warning') {
        bgColor = 'bg-yellow-500';
        icon = 'fa-exclamation-triangle';
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== UPDATE CART DISPLAY ==========
function updateCartDisplay() {
    onCartUpdate((items, count) => {
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    });
}

// ========== CONTACT FORM HANDLING ==========
function initContactForm() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// ========== CHECK FOR PENDING CART ITEM AFTER LOGIN ==========
function checkPendingCartItem() {
    const pendingItem = localStorage.getItem('pendingCartItem');
    const user = getCurrentUser();

    if (pendingItem && user) {
        try {
            const product = JSON.parse(pendingItem);
            addToCart(product);
            localStorage.removeItem('pendingCartItem');
            showToast('Item added to your cart!', 'success');
        } catch (error) {
            console.error('Error adding pending item:', error);
        }
    }
}

// ========== FIX STATIC PRODUCT BUTTONS ==========
function fixStaticProductButtons() {
    const viewMoreButtons = document.querySelectorAll('.product .viewBtn');

    viewMoreButtons.forEach((button, index) => {
        if (!button.hasAttribute('onclick') && products[index]) {
            button.addEventListener('click', () => {
                showProductModal(products[index]);
            });
        }
    });
}

// ========== INITIALIZE EVERYTHING ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    initDarkMode();
    initMobileMenu();
    initBackToTop();
    initCart();
    initContactForm();
    initUserDropdown();
    initLogout();

    // Render products dynamically
    renderProducts();

    // Fix static product buttons as fallback
    fixStaticProductButtons();

    // Update cart display
    updateCartDisplay();

    // Check for pending cart item
    setTimeout(checkPendingCartItem, 1000);

    // Make functions available globally
    window.showProductModal = showProductModal;
    window.addToCart = addToCart;
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        updateAuthUI(user);
        
        // Check for pending cart item when user logs in
        if (user) {
            checkPendingCartItem();
        }
    });
});