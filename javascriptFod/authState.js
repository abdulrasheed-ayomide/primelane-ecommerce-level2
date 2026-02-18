// authState.js
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const auth = getAuth();

// Function to update UI based on auth state
export function initializeAuthUI() {
    onAuthStateChanged(auth, (user) => {
        const desktopNav = document.querySelector('.md\\:flex.items-center.space-x-8');
        const mobileNav = document.querySelector('#mobileMenu nav');
        
        if (user) {
            // User is signed in
            updateNavForLoggedInUser(desktopNav, user);
            updateMobileNavForLoggedInUser(mobileNav, user);
        } else {
            // User is signed out
            updateNavForLoggedOutUser(desktopNav);
            updateMobileNavForLoggedOutUser(mobileNav);
        }
    });
}

// Desktop navigation for logged-in users
function updateNavForLoggedInUser(navElement, user) {
    if (!navElement) return;
    
    // Get user's display name (from email or full name)
    const displayName = user.displayName || user.email.split('@')[0] || 'User';
    
    navElement.innerHTML = `
        <a href="index.html" class="nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300 relative group">
            Home
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="shop.html" class="nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300 relative group">
            Shop
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
        </a>
        
        <!-- User Profile Dropdown -->
        <div class="relative group">
            <button class="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/30 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-all duration-300">
                <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    ${displayName.charAt(0).toUpperCase()}
                </div>
                <span class="font-medium">${displayName}</span>
                <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <!-- Dropdown Menu -->
            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50 border border-gray-200 dark:border-gray-700">
                <div class="py-2">
                    <a href="profile.html" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                        <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                    </a>
                    <a href="orders.html" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                        <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                    </a>
                    <a href="wishlist.html" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                        <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Wishlist
                    </a>
                    <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button onclick="handleLogout()" class="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Desktop navigation for logged-out users
function updateNavForLoggedOutUser(navElement) {
    if (!navElement) return;
    
    navElement.innerHTML = `
        <a href="index.html" class="nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300 relative group">
            Home
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="shop.html" class="nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300 relative group">
            Shop
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="login.html" class="nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300 relative group">
            Login
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="signup.html" class="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 font-semibold">
            Sign Up
        </a>
    `;
}

// Mobile navigation for logged-in users
function updateMobileNavForLoggedInUser(mobileNav, user) {
    if (!mobileNav) return;
    
    const displayName = user.displayName || user.email.split('@')[0] || 'User';
    
    mobileNav.innerHTML = `
        <div class="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg mb-2">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    ${displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="font-semibold text-gray-900 dark:text-white">${displayName}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${user.email}</p>
                </div>
            </div>
        </div>
        
        <a href="index.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
        </a>
        
        <a href="shop.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Shop
        </a>
        
        <a href="profile.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
        </a>
        
        <a href="orders.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            My Orders
        </a>
        
        <a href="wishlist.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Wishlist
        </a>
        
        <button onclick="handleLogout()" class="w-full text-left mobile-nav-link text-red-600 hover:text-red-700 font-medium px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
        </button>
    `;
}

// Mobile navigation for logged-out users
function updateMobileNavForLoggedOutUser(mobileNav) {
    if (!mobileNav) return;
    
    mobileNav.innerHTML = `
        <a href="index.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
            Home
        </a>
        <a href="shop.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
            Shop
        </a>
        <a href="login.html" class="mobile-nav-link text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
            Login
        </a>
        <a href="signup.html" class="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-all text-center mx-4">
            Sign Up
        </a>
    `;
}

// Global logout function
window.handleLogout = async function() {
    try {
        await signOut(auth);
        
        // Show success message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "Logged Out",
                text: "You have been successfully logged out.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        }
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
        
    } catch (error) {
        console.error("Logout error:", error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "Error",
                text: "Failed to logout. Please try again.",
                icon: "error"
            });
        }
    }
};