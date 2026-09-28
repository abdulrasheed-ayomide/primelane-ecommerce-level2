import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from "./firebase.js";
import {
  authReady, waitForSignedIn, logout, refreshVerification,
  sendVerificationEmail, verificationCooldownLeft,
} from "./auth.js";
import { validateForm, validators, setButtonLoading, setFieldError } from "./ui.js";
import { friendlyError } from "./utils.js";
import { nextUrl, keepNextParam, initPasswordToggles, showFormError, showFormNotice } from "./authForms.js";

const form = document.getElementById("loginForm");
const panel = document.getElementById("verifyPanel");
const resendBtn = document.getElementById("resendBtn");
const resendStatus = document.getElementById("resendStatus");
initPasswordToggles();
keepNextParam(document.getElementById("signupLink"));

const params = new URLSearchParams(location.search);
if (params.get("verified") === "1") showFormNotice("Your email address is verified. You can log in now.");

/* ---------- "Please verify your email" panel ---------- */

function showVerifyPanel(email) {
  document.getElementById("verifyEmail").textContent = email;
  panel.classList.remove("hidden");
  updateResendButton();
}

function hideVerifyPanel() {
  panel.classList.add("hidden");
  resendStatus.textContent = "";
}

let cooldownTimer;
function updateResendButton() {
  clearInterval(cooldownTimer);
  const tick = () => {
    const left = Math.ceil(verificationCooldownLeft() / 1000);
    resendBtn.disabled = left > 0;
    resendBtn.textContent = left > 0 ? `Resend available in ${left}s` : "Resend verification email";
    if (left <= 0) clearInterval(cooldownTimer);
  };
  tick();
  cooldownTimer = setInterval(tick, 1000);
}

resendBtn.addEventListener("click", async () => {
  resendStatus.textContent = "";
  const restore = setButtonLoading(resendBtn, "Sending…");
  try {
    await sendVerificationEmail();
    restore();
    resendStatus.textContent = "Verification email sent. Check your inbox.";
  } catch (error) {
    restore();
    resendStatus.textContent = friendlyError(error);
  }
  updateResendButton();
});

document.getElementById("checkVerifiedBtn").addEventListener("click", async (e) => {
  const restore = setButtonLoading(e.currentTarget, "Checking…");
  try {
    if (await refreshVerification()) {
      window.location.href = nextUrl();
      return;
    }
    resendStatus.textContent = "Your email isn't verified yet. Open the link in the email we sent, then try again.";
  } catch (error) {
    resendStatus.textContent = friendlyError(error);
  }
  restore();
});

document.getElementById("switchAccountBtn").addEventListener("click", async () => {
  await logout();
  hideVerifyPanel();
  form.reset();
  form.email.focus();
});

/* ---------- On load ---------- */

authReady().then(async ({ user, unverifiedUser }) => {
  if (user) {
    window.location.replace(nextUrl());
    return;
  }
  if (unverifiedUser) {
    // Came back from the verification link (or already verified in another tab)?
    if (params.get("verified") === "1" && (await refreshVerification().catch(() => false))) {
      window.location.replace(nextUrl());
      return;
    }
    form.email.value = unverifiedUser.email;
    showVerifyPanel(unverifiedUser.email);
  }
});

/* ---------- Log in ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showFormError("");
  hideVerifyPanel();
  const valid = validateForm(form, {
    email: validators.email,
    password: validators.required("Password"),
  });
  if (!valid) return;

  const restore = setButtonLoading(form.querySelector('button[type="submit"]'), "Logging in…");
  try {
    const { user } = await signInWithEmailAndPassword(auth, form.email.value.trim(), form.password.value);
    if (!user.emailVerified) {
      // Right password, unverified email: keep them out of the store and offer a new link.
      restore();
      form.password.value = "";
      showVerifyPanel(user.email);
      return;
    }
    await waitForSignedIn(); // auth.js has loaded the profile
    window.location.href = nextUrl();
  } catch (error) {
    restore();
    showFormError(friendlyError(error));
  }
});

/* ---------- Forgot password (Firebase sends the reset email) ---------- */

let lastResetAt = 0;
document.getElementById("forgotBtn").addEventListener("click", async (e) => {
  const email = form.email.value.trim();
  if (validators.email(email)) {
    setFieldError(form.email, "Enter your email address above, then click “Forgot password?” again.");
    form.email.focus();
    return;
  }
  setFieldError(form.email, "");
  showFormError("");
  if (Date.now() - lastResetAt < 60_000) {
    showFormNotice("A reset link was just sent. Please wait a minute before asking for another.");
    return;
  }
  const restore = setButtonLoading(e.currentTarget, "Sending…");
  try {
    await sendPasswordResetEmail(auth, email);
    lastResetAt = Date.now();
    // Same message whether or not the account exists, so nobody can probe for accounts.
    showFormNotice(`If an account exists for ${email}, we've sent a link to reset your password. Check your inbox.`);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      lastResetAt = Date.now();
      showFormNotice(`If an account exists for ${email}, we've sent a link to reset your password. Check your inbox.`);
    } else {
      showFormError(friendlyError(error));
    }
  }
  restore();
});
