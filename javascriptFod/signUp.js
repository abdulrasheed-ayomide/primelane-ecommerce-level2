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
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

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

        Swal.fire({
                    title: "signed up successfully!",
                    text: `Welcome ${fullName}! Your account has been created.`,
                    icon: "success"
                });

                signupForm.reset();

                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = "../otherPages/login.html";
                }, 2000);

                // after logging i want the logged in user to be able to see their name on the home page and also have a logout button that logs them out and redirects them to the login page
                // i dont want to use local storage for this, i want to use firebase auth state listener to check if the user is logged in and then display their name on the home page and also have a logout button that logs them out and redirects them to the login page



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


