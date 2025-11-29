// login.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const STORAGE_CURRENT = "btx_current_user_v1";
const STORAGE_USERS   = "btx_users_v1";

const form = document.getElementById("loginForm");

if(form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const userOrEmail = document.getElementById("username").value.trim().toLowerCase();
    const password    = document.getElementById("password").value;

    if(!userOrEmail || !password){
      alert("❗ Username/Email এবং Password দিন।");
      return;
    }

    try{
      let emailToUse = userOrEmail;

      // যদি username টাইপ করা হয় → email খুঁজে বের করো
      if(!userOrEmail.includes("@")){
        const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
        const found = users.find(u => u.username === userOrEmail);
        if(!found){
          alert("❌ Invalid username / email!");
          return;
        }
        emailToUse = found.email;
      }

      // Firebase Login
      const cred = await signInWithEmailAndPassword(auth, emailToUse, password);
      const uid = cred.user.uid;

      // Firestore থেকে profile আনো
      const snap = await getDoc(doc(db,"users",uid));
      if(!snap.exists()){
        alert("⚠ Profile পাওয়া যায়নি!");
        return;
      }

      const userData = snap.data();

      // localStorage sync
      localStorage.setItem(STORAGE_CURRENT, JSON.stringify(userData));

      // Users cache update
      let all = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
      const idx = all.findIndex(x=>x.uid === uid);
      if(idx>=0) all[idx] = userData;
      else all.push(userData);
      localStorage.setItem(STORAGE_USERS, JSON.stringify(all));

      // Admin হলে admin panel এ
      if(userData.role === "admin"){
        window.location.href = "admin.html";
      }else{
        window.location.href = "dashboard.html";
      }

    }catch(err){
      console.error(err);
      alert("❌ Login failed: " + (err.message || err.code));
    }
  });
}