// ========== CART PAGE JAVASCRIPT ==========
import { 
    getCartItems, 
    onCartUpdate, 
    updateQuantity,
    removeFromCart,
    calculateTotal,
    clearCart,
    auth,
    getCurrentUser
} from './cart.js';

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
    }
}

// ========== RENDER CART ITEMS ==========
function renderCartItems(items) {
    const container = document.getElementById('cartItemsContainer');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="text-lg mb-2">Your cart is empty</p>
                <p class="text-sm mb-4">Looks like you haven't added any items yet.</p>
                <a href="../index.html" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all">
                    Continue Shopping
                </a>
            </div>
        `;
        cartItemsCount.textContent = '0';
        updateSummary(0);
        return;
    }
    
    cartItemsCount.textContent = items.length;
    
    container.innerHTML = items.map(item => `
        <div class="cart-item p-6 flex flex-col sm:flex-row gap-4 border-b border-gray-200 dark:border-gray-700" data-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="w-full sm:w-24 h-24 object-cover rounded-lg">
            
            <div class="flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 class="font-semibold text-lg">${item.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">$${item.price} each</p>
                    </div>
                    <p class="text-xl font-bold text-indigo-600">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                
                <div class="flex items-center justify-between mt-4">
                    <div class="flex items-center gap-3">
                        <button onclick="window.updateCartItemQuantity('${item.id}', ${item.quantity - 1})" 
                            class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                            -
                        </button>
                        <span class="w-8 text-center font-semibold">${item.quantity}</span>
                        <button onclick="window.updateCartItemQuantity('${item.id}', ${item.quantity + 1})" 
                            class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                            +
                        </button>
                    </div>
                    
                    <button onclick="window.removeCartItem('${item.id}')" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== UPDATE ORDER SUMMARY ==========
function updateSummary(subtotal) {
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (!subtotalEl || !taxEl || !totalEl) return;
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

// ========== LOAD RECOMMENDED PRODUCTS ==========
function loadRecommendedProducts() {
    const container = document.getElementById('recommendedProducts');
    if (!container) return;
    
    const recommended = [
        {
            id: 'rec1',
            title: 'Wireless Headphones',
            price: 79.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        },
        {
            id: 'rec2',
            title: 'Smart Watch',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        },
        {
            id: 'rec3',
            title: 'Backpack',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        },
        {
            id: 'rec4',
            title: 'Running Shoes',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
        }
    ];
    
    container.innerHTML = recommended.map(product => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
            <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-semibold mb-2">${product.title}</h3>
                <p class="text-indigo-600 font-bold mb-3">$${product.price}</p>
                <a href="../index.html" class="block text-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                    View Details
                </a>
            </div>
        </div>
    `).join('');
}

// ========== CHECKOUT MODAL ==========
function initCheckoutModal() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeBtn = document.getElementById('closeCheckoutModal');
    const checkoutForm = document.getElementById('checkoutForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessModal');
    
    if (!checkoutBtn || !checkoutModal) return;
    
    checkoutBtn.addEventListener('click', async () => {
        const user = getCurrentUser();
        
        if (!user) {
            showToast('Please login to checkout', 'warning');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
            return;
        }
        
        const items = getCartItems();
        if (items.length === 0) {
            showToast('Your cart is empty', 'warning');
            return;
        }
        
        checkoutModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            checkoutModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
    }
    
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            window.location.href = '../index.html';
        });
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Simulate order processing
            showToast('Processing your order...', 'success');
            
            setTimeout(() => {
                checkoutModal.classList.add('hidden');
                successModal.classList.remove('hidden');
                
                // Clear cart after successful order
                clearCart();
            }, 1500);
        });
    }
    
    // Close modal when clicking outside
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });
    
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });
}

// ========== PROMO CODE ==========
function initPromoCode() {
    const applyBtn = document.getElementById('applyPromo');
    const promoInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promoMessage');
    
    if (!applyBtn || !promoInput) return;
    
    applyBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        
        if (code === 'SAVE10') {
            promoMessage.textContent = '10% discount applied!';
            promoMessage.className = 'text-sm mt-2 text-green-600';
            promoMessage.classList.remove('hidden');
            
            // Apply discount to total
            const items = getCartItems();
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            updateSummary(subtotal * 0.9);
        } else if (code === 'FREESHIP') {
            promoMessage.textContent = 'Free shipping applied!';
            promoMessage.className = 'text-sm mt-2 text-green-600';
            promoMessage.classList.remove('hidden');
            
            document.getElementById('shipping').textContent = '$0.00';
        } else if (code) {
            promoMessage.textContent = 'Invalid promo code';
            promoMessage.className = 'text-sm mt-2 text-red-600';
            promoMessage.classList.remove('hidden');
        }
    });
}

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

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initMobileMenu();
    initCheckoutModal();
    initPromoCode();
    loadRecommendedProducts();
    
    // Listen for cart updates
    onCartUpdate((items, count, total) => {
        renderCartItems(items);
        
        // Update cart count in navbar
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
        
        // Update summary
        updateSummary(total);
    });
    
    // Make functions available globally
    window.updateCartItemQuantity = async (productId, newQuantity) => {
        await updateQuantity(productId, newQuantity);
    };
    
    window.removeCartItem = async (productId) => {
        await removeFromCart(productId);
    };
    
    window.clearCart = async () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            await clearCart();
        }
    };
});