import { auth, createUserWithEmailAndPassword, updateProfile } from "./firebase.js";
import { sendVerificationEmail, verificationCooldownLeft } from "./auth.js";
import { ensureUserProfile } from "./services/users.js";
import { validateForm, validators, setButtonLoading } from "./ui.js";
import { friendlyError } from "./utils.js";
import { keepNextParam, initPasswordToggles, showFormError } from "./authForms.js";

const form = document.getElementById("signupForm");
initPasswordToggles();
keepNextParam(document.getElementById("loginLink"));
keepNextParam(document.getElementById("doneLoginLink"));

function passwordProblem(value) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return "Password must include at least one letter and one number.";
  return "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showFormError("");
  const valid = validateForm(form, {
    fullname: (v) => (v.length >= 3 ? "" : "Enter your full name."),
    email: (v) => (!v ? "Email is required." : validators.email(v) ? "Invalid email address." : ""),
    password: passwordProblem,
    confirmPassword: (v, f) => (!v ? "Please confirm your password." : v !== f.password.value ? "Passwords do not match." : ""),
    terms: (checked) => (checked ? "" : "Please accept the terms to continue."),
  });
  if (!valid) return;

  const fullName = form.fullname.value.trim();
  const email = form.email.value.trim();
  const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Creating account…");
  let user;
  try {
    ({ user } = await createUserWithEmailAndPassword(auth, email, form.password.value));
  } catch (error) {
    restore();
    showFormError(
      error?.code === "auth/email-already-in-use"
        ? "This email is already registered. Log in instead, or use “Forgot password?” on the login page."
        : friendlyError(error)
    );
    return;
  }

  // The account exists from here on; problems below must not block the "check your email" screen.
  try {
    await updateProfile(user, { displayName: fullName });
    // Profile document: name, email, role "customer". The password is never stored in Firestore.
    await ensureUserProfile(user, { fullName });
  } catch (error) {
    console.warn("Profile will be completed after verification", error);
  }

  let sent = true;
  try {
    await sendVerificationEmail(user);
  } catch (error) {
    sent = false;
    console.warn("Verification email not sent", error);
  }

  form.classList.add("hidden");
  document.getElementById("doneEmail").textContent = email;
  document.getElementById("signupDone").classList.remove("hidden");
  if (!sent) {
    document.getElementById("doneResendStatus").textContent =
      "We couldn't send the verification email just now. Use “Resend verification email” to try again.";
  }
  updateResend();
});

/* ---------- Resend from the "check your email" screen ---------- */

const resendBtn = document.getElementById("doneResendBtn");
const resendStatus = document.getElementById("doneResendStatus");
let timer;
function updateResend() {
  clearInterval(timer);
  const tick = () => {
    const left = Math.ceil(verificationCooldownLeft() / 1000);
    resendBtn.disabled = left > 0;
    resendBtn.textContent = left > 0 ? `Resend available in ${left}s` : "Resend verification email";
    if (left <= 0) clearInterval(timer);
  };
  tick();
  timer = setInterval(tick, 1000);
}

resendBtn.addEventListener("click", async () => {
  const restore = setButtonLoading(resendBtn, "Sending…");
  try {
    await sendVerificationEmail();
    restore();
    resendStatus.textContent = "Verification email sent again. Check your inbox.";
  } catch (error) {
    restore();
    resendStatus.textContent = friendlyError(error);
  }
  updateResend();
});
