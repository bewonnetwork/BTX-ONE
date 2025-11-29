// admin.js – Firestore LIVE Admin Panel (Users tab)

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---------- DOM ----------
const userTbody        = document.getElementById("userTableBody");
const editForm         = document.getElementById("editUserForm");
const editUserId       = document.getElementById("editUserId");
const editUsername     = document.getElementById("editUsername");
const editFullName     = document.getElementById("editFullName");
const editEmail        = document.getElementById("editEmail");
const editMobile       = document.getElementById("editMobile");
const editCountry      = document.getElementById("editCountry");
const editRole         = document.getElementById("editRole");
const editMembership   = document.getElementById("editMembership");
const editBalance      = document.getElementById("editBalance");
const editDepositTotal = document.getElementById("editDepositTotal");
const editDirectIncome = document.getElementById("editDirectIncome");
const editTeamIncome   = document.getElementById("editTeamIncome");
const editTeamCount    = document.getElementById("editTeamCount");
const editRefCode      = document.getElementById("editRefCode");
const editSponsor      = document.getElementById("editSponsor");
const editPassword     = document.getElementById("editPassword"); // শুধুই demo text – আসল Auth password change হবে না

// Header buttons
window.goDashboard = function () {
  window.location.href = "dashboard.html";
};

window.adminLogout = function () {
  signOut(auth);
  alert("Admin logged out.");
  window.location.href = "login.html";
};

// ---------- GLOBAL STATE ----------
let currentAdmin = null;  // logged-in admin
let allUsers     = [];    // Firestore থেকে load করা users

// ---------- TAB Switch (আগের HTML অনুযায়ী) ----------
window.switchTab = function (name, btn) {
  document.querySelectorAll(".tab-section").forEach((s) => {
    s.classList.remove("active");
  });
  document.getElementById("tab-" + name).classList.add("active");

  document.querySelectorAll(".tab-btn").forEach((b) =>
    b.classList.remove("active")
  );
  if (btn) btn.classList.add("active");
};

// ---------- Admin/Auth Check ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Admin panel এ যাওয়ার আগে login করুন।");
    window.location.href = "login.html";
    return;
  }

  const meRef = doc(db, "users", user.uid);
  const meSnap = await getDoc(meRef);

  if (!meSnap.exists()) {
    alert("আপনার profile Firestore এ পাওয়া যায়নি।");
    window.location.href = "login.html";
    return;
  }

  const me = meSnap.data();
  currentAdmin = { uid: user.uid, ...me };

  if (me.role !== "admin") {
    alert("শুধু admin role থাকলে admin panel এ ঢোকা যাবে।");
    window.location.href = "dashboard.html";
    return;
  }

  // সব ঠিক থাকলে users লোড করো
  await loadAndRenderUsers();
});

// ---------- Users Load & Render ----------
async function loadAndRenderUsers() {
  const snap = await getDocs(collection(db, "users"));
  allUsers = [];
  snap.forEach((d) => {
    allUsers.push({ id: d.id, ...d.data() });
  });

  // sort by createdAt
  allUsers.sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || "")
  );

  userTbody.innerHTML = "";

  allUsers.forEach((u) => {
    const tr = document.createElement("tr");
    const dt = u.createdAt
      ? new Date(u.createdAt).toLocaleString()
      : "-";

    tr.innerHTML = `
      <td>${u.username || ""}</td>
      <td>${u.fullName || ""}</td>
      <td>${u.email || ""}</td>
      <td>${u.mobile || ""}</td>
      <td>${u.country || ""}</td>
      <td>${u.role || "member"}</td>
      <td>${u.membershipType || "free"}</td>
      <td>$${(u.balance || 0).toFixed(2)}</td>
      <td>${u.teamCount || 0}</td>
      <td>${u.refCode || ""}</td>
      <td>${dt}</td>
      <td>
        <button class="btn-table btn-edit" data-uid="${u.id}">
          Edit
        </button>
        <button class="btn-table btn-approve" data-reset="${u.email}">
          Reset Mail
        </button>
      </td>
    `;
    userTbody.appendChild(tr);
  });

  // edit বাটন event
  userTbody.querySelectorAll("button[data-uid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.getAttribute("data-uid");
      fillEditForm(uid);
    });
  });

  // reset mail বাটন event
  userTbody.querySelectorAll("button[data-reset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const em = btn.getAttribute("data-reset");
      sendResetMail(em);
    });
  });
}

// ---------- Edit Form Fill ----------
function fillEditForm(uid) {
  const u = allUsers.find((x) => x.id === uid);
  if (!u) {
    alert("User পাওয়া যায়নি।");
    return;
  }

  editUserId.value       = u.id;
  editUsername.value     = u.username || "";
  editFullName.value     = u.fullName || "";
  editEmail.value        = u.email || "";
  editMobile.value       = u.mobile || "";
  editCountry.value      = u.country || "";
  editRole.value         = u.role || "member";
  editMembership.value   = u.membershipType || "free";
  editBalance.value      = u.balance || 0;
  editDepositTotal.value = u.depositTotal || 0;
  editDirectIncome.value = u.directIncome || 0;
  editTeamIncome.value   = u.teamIncome || 0;
  editTeamCount.value    = u.teamCount || 0;
  editRefCode.value      = u.refCode || "";
  editSponsor.value      = u.sponsor_username || "";
  editPassword.value     = ""; // Firebase Auth password এখানে দেখা/পরিবর্তন করা যাবে না (security)
}

// ---------- Edit Form Submit ----------
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const uid = editUserId.value;
    if (!uid) {
      alert("আগে কোন member নির্বাচন করুন।");
      return;
    }

    try {
      const ref = doc(db, "users", uid);

      await updateDoc(ref, {
        fullName:       editFullName.value.trim(),
        email:          editEmail.value.trim().toLowerCase(),
        mobile:         editMobile.value.trim(),
        country:        editCountry.value.trim(),
        role:           editRole.value,
        membershipType: editMembership.value,
        balance:        parseFloat(editBalance.value || "0"),
        depositTotal:   parseFloat(editDepositTotal.value || "0"),
        directIncome:   parseFloat(editDirectIncome.value || "0"),
        teamIncome:     parseFloat(editTeamIncome.value || "0"),
        teamCount:      parseInt(editTeamCount.value || "0", 10),
        refCode:        editRefCode.value.trim(),
        sponsor_username: editSponsor.value.trim(),
      });

      // list refresh
      await loadAndRenderUsers();
      alert("Member updated (LIVE).");
    } catch (err) {
      console.error(err);
      alert("Update error: " + (err.message || err.code || "Unknown"));
    }
  });
}

// ---------- Reset Mail (password reset link পাঠানো) ----------
async function sendResetMail(email) {
  if (!email) {
    alert("Email পাওয়া যায়নি।");
    return;
  }
  if (!confirm(এই ইমেইলে reset link পাঠানো হবে:\n${email})) return;

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset mail পাঠানো হয়েছে (Firebase).");
  } catch (err) {
    console.error(err);
    alert("Reset mail error: " + (err.message || err.code || "Unknown"));
  }
}

// ---------- Demo Reset: সব data clear করে শুধু admin রাখার সিস্টেম ----------
window.resetDemo = async function () {
  if (
    !confirm(
      "সব user data (LIVE Firestore থেকে) মুছে যাবে, শুধু current admin ০ balance সহ থাকবে। সত্যি করতে চান?"
    )
  )
    return;

  if (!currentAdmin) {
    alert("Admin info পাওয়া যায়নি।");
    return;
  }

  // সব user নিয়ে আসা
  const snap = await getDocs(collection(db, "users"));

  const batchDeletes = [];
  snap.forEach((d) => {
    if (d.id !== currentAdmin.uid) {
      batchDeletes.push(d.id);
    }
  });

  // admin ছাড়া বাকি সবাই delete
  for (const uid of batchDeletes) {
    await deleteDoc(doc(db, "users", uid));
  }

  // current admin এর ব্যালেন্স zero করা
  await updateDoc(doc(db, "users", currentAdmin.uid), {
    balance: 0,
    depositTotal: 0,
    directIncome: 0,
    teamIncome: 0,
    teamCount: 0,
  });

  alert("Demo reset done: শুধু current admin রাখা হয়েছে।");
  await loadAndRenderUsers();
};