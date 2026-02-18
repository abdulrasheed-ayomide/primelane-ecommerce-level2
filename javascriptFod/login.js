 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
 import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
 import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


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

let signupForm = document.getElementById("signin");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let email = signupForm.email.value;
    let password = signupForm.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        Swal.fire({
                    title: "Logged in successfully!",
                    text: `Welcome back ${email}! You are now logged in.`,
                    icon: "success"
                });

                signupForm.reset();

                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 2000);

    } catch (error) {
       if (error.message == "Firebase: Error (auth/wrong-password).") {
            Swal.fire({
                title: "Login Failed",
                text: "The email or password you entered is incorrect.",
                icon: "error"
            });

       }
    }
});


