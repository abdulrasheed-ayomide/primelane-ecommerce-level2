import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const form = document.querySelector("#signupForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value;
  const password = form.password.value;

  try {

    // ✅ Create auth account
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // ✅ Create Firestore user document
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      password: password,
      createdAt: new Date()
    });
    const userName = email.split("@")[0];

    Swal.fire({
        title: "Account created successfully!",
        text: `Welcome ${userName}`,
        icon: "success"
    });

    window.location.href = "./login.html";

  } catch (error) {
    // alert(error.message);
    Swal.fire({
      title: "Signup failed!",
      text: "Please try again.",
      icon: "error"
    });
  }
});