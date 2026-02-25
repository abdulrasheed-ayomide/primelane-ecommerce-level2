// ========== IMPORT FIREBASE ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// ========== IMPORT PRODUCTS ==========
import { products } from "./main.js";

// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "AIzaSyAHRV1wkGr6fRI6y7CSg6AM-_gPUOd9Ibw",
    authDomain: "e-commerce-website-proje-9af1a.firebaseapp.com",
    projectId: "e-commerce-website-proje-9af1a",
    storageBucket: "e-commerce-website-proje-9af1a.firebasestorage.app",
    messagingSenderId: "1059874177756",
    appId: "1:1059874177756:web:086483c6b60490db82aa19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ========== GLOBAL VARIABLES ==========
let cartItems = [];
let currentUser = null;
let unsubscribeCart = null;

// ========== DARK MODE FUNCTIONALITY ==========
function initDarkMode() {
    const darkToggle = document.getElementById('darkToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        htmlElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
    
    // Toggle dark mode
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
    }
}

// ========== CART FUNCTIONALITY WITH FIREBASE ==========

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
        // User is signed in, load their cart
        loadUserCart(user.uid);
        
        // Update UI to show logged in state (optional)
        updateAuthUI(user);
    } else {
        // User is signed out, clear cart
        if (unsubscribeCart) {
            unsubscribeCart();
            unsubscribeCart = null;
        }
        cartItems = [];
        updateCartCount();
        
        // Update UI to show logged out state (optional)
        updateAuthUI(null);
    }
});

// Update auth UI (you can add this to your navbar)
function updateAuthUI(user) {
    const loginLink = document.querySelector('a[href="./login.html"]');
    const signupLink = document.querySelector('a[href="./signUp.html"]');
    
    if (user) {
        // User is logged in - you can replace login/signup with logout
        if (loginLink) {
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.onclick = (e) => {
                e.preventDefault();
                auth.signOut();
                window.location.reload();
            };
        }
        if (signupLink) signupLink.style.display = 'none';
    } else {
        // User is logged out
        if (loginLink) {
            loginLink.textContent = 'Login';
            loginLink.href = './login.html';
            loginLink.onclick = null;
        }
        if (signupLink) signupLink.style.display = 'block';
    }
}

// Load user cart from Firebase with real-time listener
async function loadUserCart(userId) {
    try {
        const cartsRef = collection(db, 'carts');
        const q = query(cartsRef, where('userId', '==', userId));
        
        // Set up real-time listener
        unsubscribeCart = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Get the first cart document (assuming one cart per user)
                const cartDoc = snapshot.docs[0];
                const cartData = cartDoc.data();
                cartItems = cartData.items || [];
            } else {
                // Create empty cart for new user
                cartItems = [];
                createUserCart(userId);
            }
            updateCartCount();
        }, (error) => {
            console.error("Error loading cart:", error);
            showToast('Error loading cart', 'error');
        });
        
    } catch (error) {
        console.error("Error setting up cart listener:", error);
        showToast('Error loading cart', 'error');
    }
}

// Create a new cart for user
async function createUserCart(userId) {
    try {
        const cartsRef = collection(db, 'carts');
        await addDoc(cartsRef, {
            userId: userId,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error creating cart:", error);
    }
}

// Save cart to Firebase
async function saveCartToFirebase() {
    if (!currentUser) {
        showToast('Please login to save cart', 'warning');
        return;
    }

    try {
        const cartsRef = collection(db, 'carts');
        const q = query(cartsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        const cartData = {
            userId: currentUser.uid,
            items: cartItems,
            updatedAt: new Date().toISOString()
        };

        if (querySnapshot.empty) {
            // Create new cart
            await addDoc(cartsRef, {
                ...cartData,
                createdAt: new Date().toISOString()
            });
        } else {
            // Update existing cart
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), cartData);
        }
        
        showToast('Cart updated successfully', 'success');
    } catch (error) {
        console.error("Error saving cart:", error);
        showToast('Error saving cart', 'error');
    }
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    // Set background color based on type
    let bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast-notification fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-0`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
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

// Modified addToCart function
async function addToCart(product) {
    // Check if user is logged in
    if (!currentUser) {
        showToast('Please login to add items to cart', 'warning');
        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = './login.html';
        }, 2000);
        return;
    }
    
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`Added another ${product.title} to cart`, 'success');
    } else {
        cartItems.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        showToast(`${product.title} added to cart!`, 'success');
    }
    
    // Save to Firebase
    await saveCartToFirebase();
}

// Optional: Add function to remove from cart
async function removeFromCart(productId) {
    if (!currentUser) return;
    
    cartItems = cartItems.filter(item => item.id !== productId);
    await saveCartToFirebase();
    showToast('Item removed from cart', 'success');
}

// Optional: Add function to update quantity
async function updateQuantity(productId, newQuantity) {
    if (!currentUser) return;
    
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            await saveCartToFirebase();
        }
    }
}

// ========== PRODUCT MODAL FUNCTIONALITY ==========
function showProductModal(product) {
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
                    ${product.subCategory ? `
                        <span class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                            ${product.subCategory}
                        </span>
                    ` : ''}
                    ${product.brand ? `
                        <span class="bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                            ${product.brand}
                        </span>
                    ` : ''}
                </div>
                
                <!-- Rating -->
                ${product.rating ? `
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
                ` : ''}
                
                <!-- Price -->
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-3xl font-bold text-green-600 dark:text-green-400">$${product.price}</span>
                    ${product.originalPrice ? `
                        <span class="text-gray-400 line-through text-lg">$${product.originalPrice}</span>
                    ` : ''}
                    ${product.discountPercentage ? `
                        <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ${product.discountPercentage}% OFF
                        </span>
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
                <button onclick='addToCart(${JSON.stringify(product).replace(/'/g, "\\'")}); this.closest("#productModal").remove()'
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all font-semibold text-lg flex items-center justify-center gap-2"
                    ${product.stock === 0 ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>
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
}

// ========== RENDER PRODUCTS ==========
function renderProducts() {
    const displayProducts = document.getElementById("products-container");
    if (!displayProducts) return;
    
    displayProducts.innerHTML = "";

    products.forEach((product) => {
        let {
            image,
            title,
            category,
            price,
            originalPrice,
            description,
            rating,
            reviews,
            badge,
            stock
        } = product;

        displayProducts.innerHTML += `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition duration-300 p-4 flex flex-col h-full border border-gray-200 dark:border-gray-700">

                <!-- Image -->
                <div class="relative overflow-hidden rounded-lg mb-3">
                    <img src="${image}" alt="${title}" 
                        class="w-full h-48 object-cover hover:scale-105 transition duration-500">
                    ${badge ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">${badge}</span>` : ""}
                </div>

                <!-- Category -->
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${category}</p>

                <!-- Title -->
                <h2 class="font-semibold text-lg mb-2 line-clamp-2 h-14 text-gray-800 dark:text-white">${title}</h2>

                <!-- Rating -->
                ${rating ? `
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400">
                            ${Array(5).fill(0).map((_, i) => `
                                <svg class="w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            `).join('')}
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(${reviews || 0})</span>
                    </div>
                ` : ''}

                <!-- Description -->
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
                    ${description}
                </p>

                <!-- View More Button -->
                <button onclick='showProductModal(${JSON.stringify(product).replace(/'/g, "\\'")})'
                    class="text-blue-600 dark:text-blue-400 text-sm mb-2 hover:underline flex items-center gap-1 group">
                    View More 
                    <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>

                <!-- Price -->
                <div class="mt-auto">
                    <div class="flex items-baseline gap-2 mb-2">
                        <span class="text-xl font-bold text-green-600 dark:text-green-400">$${price}</span>
                        ${originalPrice ? `<span class="text-sm line-through text-gray-400 dark:text-gray-500">$${originalPrice}</span>` : ""}
                    </div>

                    <!-- Stock -->
                    <p class="text-xs mb-3 ${stock > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">
                        ${stock > 0 ? `✓ In Stock (${stock})` : "✗ Out of Stock"}
                    </p>

                    <!-- Add to Cart Button -->
                    <button onclick='addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})'
                        class="w-full bg-black dark:bg-gray-700 text-white py-2.5 rounded-lg 
                        hover:bg-gray-800 dark:hover:bg-gray-600 transition-all font-medium 
                        flex items-center justify-center gap-2 
                        ${stock === 0 ? "opacity-50 cursor-not-allowed" : ""}"
                        ${stock === 0 ? "disabled" : ""}>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
}

// ========== ADD FONT AWESOME ==========
function addFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
}

// ========== INITIALIZE EVERYTHING ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all functions
    initDarkMode();
    initMobileMenu();
    addFontAwesome();
    
    // Render products if products array exists
    if (typeof products !== 'undefined' && products.length > 0) {
        renderProducts();
    } else {
        console.error('Products array not found or empty');
        if (typeof window.products !== 'undefined') {
            window.products = products;
            renderProducts();
        }
    }
    
    // Add click outside to close mobile menu
    document.addEventListener('click', (e) => {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        
        if (mobileMenu && mobileToggle && !mobileMenu.classList.contains('hidden')) {
            if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

// Make functions globally available for onclick events
window.showProductModal = showProductModal;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;