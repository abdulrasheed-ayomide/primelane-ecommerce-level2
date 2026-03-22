import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const form = document.querySelector("#loginForm");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // console.log("Logged in user:", user);
    Swal.fire({
        title: "Signed in successfully!",
        text: `Welcome ${email.split("@")[0]}`,
        icon: "success"
    });

    // Firebase already keeps user logged in
    // No need to store in localStorage

    window.location.href = "../index.html";

  } catch (error) {

    console.error(error);

    // alert("Login failed: " + error.message);
    Swal.fire({
        title: "Login failed!",
        text: error.message,
        icon: "error"
    });

  }

});