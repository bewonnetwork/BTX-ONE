/ firebase-config.js
// 👉 এই ফাইল project root এ রাখো (register-neon.html, login.html এর পাশে)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLyRZVzGj3zXMQx4Xsgc5MRsbhL6vcFR8",
  authDomain: "btx-one.firebaseapp.com",
  projectId: "btx-one",
  storageBucket: "btx-one.firebasestorage.app",
  messagingSenderId: "565159053468",
  appId: "1:565159053468:web:9577f2aff87b9d53644559",
  measurementId: "G-W9XG8LC1GD"
};

// Initialize Firebase
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);