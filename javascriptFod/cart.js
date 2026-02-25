// ========== SHARED CART MODULE ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    doc,
    onSnapshot,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Firebase configuration
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

// Global cart state
let cartItems = [];
let currentUser = null;
let unsubscribeCart = null;
let cartUpdateCallbacks = [];
let authInitialized = false;

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, (user) => {
    const previousUser = currentUser;
    currentUser = user;
    
    if (user) {
        // User is signed in
        console.log("User signed in:", user.uid);
        loadUserCart(user.uid);
        
        // If there was a previous anonymous cart, merge it
        if (!previousUser && cartItems.length > 0) {
            mergeAnonymousCart(user.uid);
        }
    } else {
        // User is signed out
        console.log("User signed out");
        if (unsubscribeCart) {
            unsubscribeCart();
            unsubscribeCart = null;
        }
        cartItems = [];
        notifyCartUpdate();
    }
    
    authInitialized = true;
});

// ========== MERGE ANONYMOUS CART WITH USER CART ==========
async function mergeAnonymousCart(userId) {
    if (cartItems.length === 0) return;
    
    try {
        // Get user's existing cart from Firebase
        const cartsRef = collection(db, 'carts');
        const q = query(cartsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        let userCart = [];
        
        if (!querySnapshot.empty) {
            const cartDoc = querySnapshot.docs[0];
            userCart = cartDoc.data().items || [];
        }
        
        // Merge anonymous cart with user cart
        const mergedItems = [...userCart];
        
        for (const anonItem of cartItems) {
            const existingItem = mergedItems.find(item => item.id === anonItem.id);
            if (existingItem) {
                existingItem.quantity += anonItem.quantity;
            } else {
                mergedItems.push(anonItem);
            }
        }
        
        // Update cartItems with merged items
        cartItems = mergedItems;
        
        // Save to Firebase
        if (querySnapshot.empty) {
            await addDoc(cartsRef, {
                userId: userId,
                items: cartItems,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } else {
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), {
                items: cartItems,
                updatedAt: new Date().toISOString()
            });
        }
        
        notifyCartUpdate();
        
    } catch (error) {
        console.error("Error merging cart:", error);
    }
}

// ========== LOAD USER CART WITH REAL-TIME LISTENER ==========
async function loadUserCart(userId) {
    try {
        const cartsRef = collection(db, 'carts');
        const q = query(cartsRef, where('userId', '==', userId));
        
        // Clean up previous listener
        if (unsubscribeCart) {
            unsubscribeCart();
        }
        
        // Set up real-time listener
        unsubscribeCart = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const cartDoc = snapshot.docs[0];
                const cartData = cartDoc.data();
                cartItems = cartData.items || [];
            } else {
                cartItems = [];
                createUserCart(userId);
            }
            notifyCartUpdate();
        }, (error) => {
            console.error("Error loading cart:", error);
        });
        
    } catch (error) {
        console.error("Error setting up cart listener:", error);
    }
}

// ========== CREATE USER CART ==========
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

// ========== SAVE CART TO FIREBASE ==========
export async function saveCartToFirebase() {
    if (!currentUser) {
        // Store in memory only for anonymous users
        notifyCartUpdate();
        return true;
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
            await addDoc(cartsRef, {
                ...cartData,
                createdAt: new Date().toISOString()
            });
        } else {
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), cartData);
        }
        
        return true;
    } catch (error) {
        console.error("Error saving cart:", error);
        return false;
    }
}

// ========== ADD TO CART ==========
export async function addToCart(product) {
    // Check if product has required fields
    if (!product || !product.id) {
        console.error("Invalid product:", product);
        return false;
    }
    
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: product.id,
            title: product.title || 'Product',
            price: product.price || 0,
            image: product.image || '',
            quantity: 1
        });
    }
    
    await saveCartToFirebase();
    notifyCartUpdate();
    return true;
}

// ========== REMOVE FROM CART ==========
export async function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    await saveCartToFirebase();
    notifyCartUpdate();
    return true;
}

// ========== UPDATE QUANTITY ==========
export async function updateQuantity(productId, newQuantity) {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            await saveCartToFirebase();
            notifyCartUpdate();
        }
    }
    return true;
}

// ========== CLEAR CART ==========
export async function clearCart() {
    cartItems = [];
    await saveCartToFirebase();
    notifyCartUpdate();
}

// ========== GET CART ITEMS ==========
export function getCartItems() {
    return [...cartItems];
}

// ========== GET CART COUNT ==========
export function getCartCount() {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

// ========== CALCULATE TOTAL ==========
export function calculateTotal() {
    return cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
}

// ========== GET CURRENT USER ==========
export function getCurrentUser() {
    return currentUser;
}

// ========== REGISTER CART UPDATE CALLBACK ==========
export function onCartUpdate(callback) {
    cartUpdateCallbacks.push(callback);
    // Immediately call with current cart items
    callback([...cartItems], getCartCount());
    return () => {
        cartUpdateCallbacks = cartUpdateCallbacks.filter(cb => cb !== callback);
    };
}

// ========== NOTIFY ALL CALLBACKS ==========
function notifyCartUpdate() {
    const items = [...cartItems];
    const count = getCartCount();
    cartUpdateCallbacks.forEach(callback => callback(items, count));
}

// ========== INITIALIZE CART ==========
export function initCart() {
    // Add Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
}

// Export auth and onAuthStateChanged for use in other files
export { auth, onAuthStateChanged };