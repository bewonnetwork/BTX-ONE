// Common storage keys
const STORAGE_USERS   = "btx_users_v1";
const STORAGE_CURRENT = "btx_current_user_v1";

// Level commission (unilevel): 1st = 10%, 2nd = 3%, 3rd = 2%, 4th–5th = 1%
const LEVEL_PERCENTS = [0.10, 0.03, 0.02, 0.01, 0.01];

function loadUsers(){
  const raw = localStorage.getItem(STORAGE_USERS);
  if(!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}
function saveUsers(users){
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getCurrentUser(){
  const raw = localStorage.getItem(STORAGE_CURRENT);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch(e){ return null; }
}
function setCurrentUser(user){
  localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user));
}

// -------- HOME / PACKAGES (index.html) ----------
(function initPackages(){
  const buttons = document.querySelectorAll(".buy-btn");
  if(!buttons.length) return; // অন্য পেইজে হলে স্কিপ

  buttons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const amount = Number(btn.dataset.amount || "0");
      if(!amount) return;

      const current = getCurrentUser();
      if(!current){
        alert("🔐 প্রথমে Login করুন, তারপর package Buy (demo) করবেন।");
        window.location.href = "login.html";
        return;
      }

      let users = loadUsers();
      const meIndex = users.findIndex(u => u.id === current.id);
      if(meIndex === -1){
        alert("User data পাওয়া যায়নি, আবার Login করুন।");
        window.location.href = "login.html";
        return;
      }

      // ---- নিজের deposit আপডেট ----
      const me = users[meIndex];
      me.depositTotal = (me.depositTotal || 0) + amount;
      me.balance      = (me.balance || 0) + amount; // deposit wallet এ যোগ
      users[meIndex]  = me;

      // ---- Sponsor chain commission ----
      let sponsorUsername = me.sponsor_username || "";
      let level = 0;
      while(sponsorUsername && level < LEVEL_PERCENTS.length){
        const sIndex = users.findIndex(u => u.username === sponsorUsername);
        if(sIndex === -1) break;

        const sponsor = users[sIndex];
        const percent = LEVEL_PERCENTS[level];
        const commission = amount * percent;

        if(level === 0){
          sponsor.directIncome = (sponsor.directIncome || 0) + commission;
        }else{
          sponsor.teamIncome = (sponsor.teamIncome || 0) + commission;
        }
        sponsor.balance = (sponsor.balance || 0) + commission;

        users[sIndex] = sponsor;
        sponsorUsername = sponsor.sponsor_username || "";
        level++;
      }

      saveUsers(users);
      setCurrentUser(me);

      alert("✅ Demo deposit complete: $" + amount +
        " যোগ হয়েছে। Sponsor chain এ demo কমিশন হিসাব করা হয়েছে।");

      // চাইলে সরাসরি dashboard এ নিতে পারো
      // window.location.href = "dashboard.html";
    });
  });
})();

// -------- ADMIN PANEL (admin.html) ----------
(function initAdmin(){
  const tableBody = document.getElementById("adminUsersBody");
  if(!tableBody) return; // admin page না হলে স্কিপ

  const current = getCurrentUser();
  if(!current || current.role !== "admin"){
    alert("এই পেইজ শুধুই admin demo এর জন্য। আগে admin হিসেবে Login করুন।");
    window.location.href = "login.html";
    return;
  }

  const users = loadUsers();

  tableBody.innerHTML = "";
  users.forEach((u, idx)=>{
    const tr = document.createElement("tr");

    const joined = u.createdAt ? new Date(u.createdAt).toLocaleString() : "-";
    const refLink =
      window.location.origin +
      "/register-neon.html?ref=" +
      encodeURIComponent(u.username || "");

    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${u.fullName || "-"}</td>
      <td>${u.username}</td>
      <td>${u.role}</td>
      <td>${u.sponsor_username || "-"}</td>
      <td>${u.depositTotal?.toFixed ? u.depositTotal.toFixed(2) : "0.00"}</td>
      <td>${u.directIncome?.toFixed ? u.directIncome.toFixed(2) : "0.00"}</td>
      <td>${u.teamIncome?.toFixed ? u.teamIncome.toFixed(2) : "0.00"}</td>
      <td>${u.balance?.toFixed ? u.balance.toFixed(2) : "0.00"}</td>
      <td>${u.teamCount || 0}</td>
      <td>${joined}</td>
      <td><input type="text" value="${refLink}" readonly style="width:160px;font-size:10px;"></td>
    `;
    tableBody.appendChild(tr);
  });
})();
