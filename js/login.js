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
    //i want the conditon should be if there is no internet it will alert check your internet connection and if the email or password is incorrect it will alert incorrect email or password
    if (error.code === "auth/network-request-failed") {
        Swal.fire({
            title: "Login failed!",
            text: "Please check your internet connection and try again.",
            icon: "error"
        });
    } else {
        Swal.fire({
            title: "Login failed!",
            text: "incorrect email or password. Please try again.",
            icon: "error"
        });
    }

  }

});