// users/{uid} documents: profile + role. Roles can only be changed by an admin
// (enforced in firestore.rules), never from the customer's browser.
import {
  db, doc, getDoc, getDocs, setDoc, updateDoc, deleteField,
  collection, serverTimestamp, writeBatch,
} from "../firebase.js";

const PROFILE_FIELDS = ["fullName", "phone", "address", "city", "state", "country"];

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Makes sure the signed-in user has a profile document.
 * Also removes the plain-text password that older versions of signup stored.
 */
export async function ensureUserProfile(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = {
      email: user.email,
      fullName: extra.fullName || user.displayName || "",
      role: "customer",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { id: user.uid, ...profile };
  }

  const data = snap.data();
  const fixes = {};
  if ("password" in data) fixes.password = deleteField();
  if (!data.role) fixes.role = "customer";
  if (!data.status) fixes.status = "active";
  if (!data.fullName && (extra.fullName || user.displayName)) fixes.fullName = extra.fullName || user.displayName;
  if (Object.keys(fixes).length) {
    fixes.updatedAt = serverTimestamp();
    await updateDoc(ref, fixes);
    delete data.password;
    Object.assign(data, fixes);
  }
  return { id: snap.id, ...data };
}

/** Customer updates their own profile (only whitelisted fields). */
export async function updateMyProfile(uid, changes) {
  const clean = {};
  for (const key of PROFILE_FIELDS) {
    if (key in changes) clean[key] = String(changes[key] ?? "").trim().slice(0, 200);
  }
  clean.updatedAt = serverTimestamp();
  await updateDoc(doc(db, "users", uid), clean);
}

// ---------- Admin ----------

export async function listUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const { password, ...rest } = d.data(); // never keep a password in memory, even if one exists
    return { id: d.id, ...rest, hasStoredPassword: password !== undefined };
  });
}

export async function setUserStatus(uid, status) {
  await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() });
}

/** Removes plain-text passwords left by the old signup code. */
export async function purgeStoredPasswords(uids) {
  const batch = writeBatch(db);
  uids.forEach((uid) => batch.update(doc(db, "users", uid), { password: deleteField() }));
  await batch.commit();
}
