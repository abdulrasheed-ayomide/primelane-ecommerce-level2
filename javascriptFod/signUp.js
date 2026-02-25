// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Your web app's Firebase configuration
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
const auth = getAuth();
const db = getFirestore(app);
const userColRef = collection(db, "users");

let signupForm = document.getElementById("signup");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let fullName = signupForm.fullname.value;
    let email = signupForm.email.value;
    let password = signupForm.password.value;

    // set regex patterns for validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!emailPattern.test(email)) {
        Swal.fire({
            title: "Invalid Email",
            text: "Please enter a valid email address.",
            icon: "error"
        });
        return;
    }

    if (!passwordPattern.test(password)) {
        Swal.fire({
            title: "Invalid Password",
            text: "Password must be at least 8 characters long and contain both letters and numbers.",
            icon: "error"
        });
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);


        const querySnapshot = await addDoc(userColRef, {
            uid: userCredential.user.uid,
            fullName: fullName,
            email: email,
            password: password
        });

        // After successful signup
        Swal.fire({
            title: "Signed up successfully!",
            text: `Welcome ${fullName}! Your account has been created.`,
            icon: "success"
        });

        signupForm.reset();

        // Set a flag in sessionStorage that user just signed up
        sessionStorage.setItem('justSignedUp', 'true');

        // Redirect to home page instead of login page
        setTimeout(() => {
            window.location.href = "../index.html"; // Go to home page
        }, 2000);


    } catch (error) {
        if (error.message == "Firebase: Error (auth/email-already-in-use).") {
            Swal.fire({
                title: "Sign Up Failed",
                text: "The email address is already in use by another account.",
                icon: "error"
            });

        }
    }
});


