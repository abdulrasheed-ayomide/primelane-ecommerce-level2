// messages collection: contact-form submissions. Anyone can create; only admins can read.
import {
  db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp,
} from "../firebase.js";

export async function sendMessage({ name, email, subject, message }) {
  await addDoc(collection(db, "messages"), {
    name: name.slice(0, 100),
    email: email.slice(0, 200),
    subject: subject.slice(0, 150),
    message: message.slice(0, 3000),
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function listMessages() {
  const snap = await getDocs(collection(db, "messages"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export const markMessageRead = (id, read = true) => updateDoc(doc(db, "messages", id), { read });
export const deleteMessage = (id) => deleteDoc(doc(db, "messages", id));
