// login.js  (Firebase Auth + Firestore based)

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const STORAGE_CURRENT = "btx_current_user_v1";

const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailOrUser = document.getElementById("loginUser").value.trim().toLowerCase();
    const password    = document.getElementById("loginPassword").value;

    if (!emailOrUser || !password) {
      alert("❗ Username/Email আর Password দিন।");
      return;
    }

    try {
      // আমরা login সবসময় email দিয়ে করব
      // যদি user লিখে থাকে username, ধরে নিলাম সেটাই email (ডেমোর জন্য)
      const email = emailOrUser;

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid  = cred.user.uid;

      // Firestore থেকে profile আনব
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        alert("⚠ Profile data পাওয়া গেল না (users collection এ চেক করুন)।");
        return;
      }

      const profile = snap.data();

      // localStorage তে current user save
      localStorage.setItem(STORAGE_CURRENT, JSON.stringify(profile));

      alert("✅ Login success!");
      window.location.href = "dashboard.html";   // আপনার dashboard page

    } catch (err) {
      console.error(err);
      alert("❌ Login failed: " + (err.message || err.code || "Unknown error"));
    }
  });
}

// 🔁 Forgot Password button এর জন্য
window.handleForgotPassword = async function () {
  const email = prompt("আপনার account এর email লিখুন:");

  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    alert("✅ Reset link পাঠানো হয়েছে ওই email এ। ইনবক্স/স্প্যাম চেক করুন।");
  } catch (err) {
    console.error(err);
    alert("⚠ Reset error: " + (err.message || err.code || "Unknown error"));
  }
}