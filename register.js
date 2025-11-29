// register.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const STORAGE_USERS   = "btx_users_v1";
const STORAGE_CURRENT = "btx_current_user_v1";

function loadUsers(){
  const raw = localStorage.getItem(STORAGE_USERS);
  if(!raw) return [];
  try{return JSON.parse(raw);}catch(e){return [];}
}
function saveUsers(list){
  localStorage.setItem(STORAGE_USERS, JSON.stringify(list));
}

const form = document.getElementById("registerForm");

if(form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const email    = document.getElementById("email").value.trim().toLowerCase();
    const country  = document.getElementById("country").value;
    const mobile   = document.getElementById("mobile").value.trim();
    const pass1    = document.getElementById("password").value;
    const pass2    = document.getElementById("password2").value;
    const refRaw   = document.getElementById("refCode").value.trim();
    const ref      = refRaw.toLowerCase();
    const terms    = document.getElementById("terms");

    if(!fullName || !username || !email || !country || !mobile){
      alert("❗ সবগুলো required ফিল্ড পূরণ করুন।");
      return;
    }
    if(!terms.checked){
      alert("❗ Terms & Conditions এ টিক দিন।");
      return;
    }
    if(pass1.length < 6){
      alert("🔐 Password কমপক্ষে ৬ অক্ষরের দিন (Firebase minimum).");
      return;
    }
    if(pass1 !== pass2){
      alert("❌ Password এবং Re-enter Password মিলছে না।");
      return;
    }

    try{
      const usersCol = collection(db,"users");

      // username unique?
      let q1 = query(usersCol, where("username","==",username));
      let snap1 = await getDocs(q1);
      if(!snap1.empty){
        alert("⚠ এই username আগে থেকেই রয়েছে। অন্যটা ব্যবহার করুন।");
        return;
      }

      // email unique?
      let q2 = query(usersCol, where("email","==",email));
      let snap2 = await getDocs(q2);
      if(!snap2.empty){
        alert("⚠ এই email আগে থেকেই রয়েছে। অন্যটা ব্যবহার করুন।");
        return;
      }

      // sponsor check
      let sponsorUsername = "";
      let sponsorUid = null;
      if(ref){
        const q3 = query(usersCol, where("username","==",ref));
        const snap3 = await getDocs(q3);
        if(snap3.empty){
          alert("⚠ এই sponsor / referral username পাওয়া যায়নি।");
          return;
        }else{
          const docRef = snap3.docs[0];
          sponsorUsername = docRef.data().username;
          sponsorUid = docRef.id;
        }
      }

      // Auth create
      const cred = await createUserWithEmailAndPassword(auth,email,pass1);
      const uid  = cred.user.uid;

      const profile = {
        uid,
        fullName,
        username,
        email,
        country,
        mobile,
        refCode: refRaw,
        sponsor_username: sponsorUsername,
        role: "member",
        membershipType: "free",
        balance: 0,
        depositTotal: 0,
        directIncome: 0,
        teamIncome: 0,
        teamCount: 0,
        createdAt: new Date().toISOString()
      };

      // Firestore profile doc
      await setDoc(doc(db,"users",uid), profile);

      // sponsor team count increment (optional)
      if(sponsorUid){
        await updateDoc(doc(db,"users",sponsorUid),{
          teamCount: increment(1)
        });
      }

      // localStorage sync (dashboard/admin পুরোনো কোডের জন্য)
      const all = loadUsers();
      all.push(profile);
      saveUsers(all);
      localStorage.setItem(STORAGE_CURRENT, JSON.stringify(profile));

      alert("✅ Registration successful! এখন Login করুন।");
      window.location.href = "login.html";

    }catch(err){
      console.error(err);
      alert("❌ Registration error: " + (err.message || err.code || "Unknown error"));
    }
  });
}