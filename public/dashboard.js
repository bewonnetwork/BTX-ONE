// dashboard.js – Firestore LIVE VERSION
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const mobileEl = document.getElementById("mobile");
const usernameEl = document.getElementById("username");
const sponsorEl = document.getElementById("sponsor");
const balanceEl = document.getElementById("balance");
const depositEl = document.getElementById("deposit");
const directIncomeEl = document.getElementById("directIncome");
const teamIncomeEl = document.getElementById("teamIncome");

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    window.location.href = "login.html";
    return;
  }

  const ref = doc(db,"users", user.uid);
  const snap = await getDoc(ref);

  if(!snap.exists()){
    alert("User profile not found!");
    return;
  }

  const u = snap.data();

  nameEl.innerText = u.fullName;
  emailEl.innerText = u.email;
  mobileEl.innerText = u.mobile;
  usernameEl.innerText = u.username;
  sponsorEl.innerText = u.sponsor_username || "N/A";
  balanceEl.innerText = "$" + (u.balance || 0).toFixed(2);
  depositEl.innerText = "$" + (u.depositTotal || 0).toFixed(2);
  directIncomeEl.innerText = "$" + (u.directIncome || 0).toFixed(2);
  teamIncomeEl.innerText = "$" + (u.teamIncome || 0).toFixed(2);
});

window.logoutUser = function(){
  signOut(auth);
  window.location.href = "login.html";
}