/*****************
 * BTX.ONE – Dashboard Controller (FULL UPDATED)
 * Everything connected with income-engine.js
 *****************/

const STORAGE_CURRENT = "btx_current_user_v1";

function getCurrentUser(){
    let raw = localStorage.getItem(STORAGE_CURRENT);
    if(!raw) return null;
    try{ return JSON.parse(raw); }catch(e){ return null; }
}

function logout(){
    localStorage.removeItem(STORAGE_CURRENT);
    window.location.href = "login.html";
}

// ------------------- Dashboard Init -------------------

(function initDashboard(){

    let user = getCurrentUser();
    if(!user){
        window.location.href = "login.html";
        return;
    }

    // Welcome area
    document.getElementById("welcomeName").textContent =
        "Welcome, " + (user.fullName || user.username);

    document.getElementById("welcomeUser").textContent = 
        "@" + user.username;

    document.getElementById("infoEmail").textContent =
        "Email: " + (user.email || "-");

    document.getElementById("infoCountry").textContent =
        "Country: " + (user.country || "-");

    document.getElementById("infoMobile").textContent =
        "Mobile: " + (user.mobile || "-");

    document.getElementById("infoSponsor").textContent =
        "Sponsor: " + (user.sponsor_username || "N/A");

    // Account info block
    document.getElementById("accName").textContent = user.fullName;
    document.getElementById("accUser").textContent = user.username;
    document.getElementById("accEmail").textContent = user.email;
    document.getElementById("accRole").textContent = 
        user.role === "admin" ? "Admin" : "Member";

    document.getElementById("accCountry").textContent = user.country;
    document.getElementById("accMobile").textContent = user.mobile;
    document.getElementById("accSponsor").textContent =
        user.sponsor_username || "-";

    if(user.createdAt){
        let d = new Date(user.createdAt);
        document.getElementById("accJoined").textContent = d.toLocaleString();
    }

    // ---------------- Income Summary (Live) ----------------
    // এটা Income Engine থেকে real হিসাব নিয়ে আসে
    let summary = getIncomeSummary(user.username);

    if(summary){
        document.getElementById("sumSelf").textContent =
            "$" + summary.selfInvestment.toFixed(2);

        document.getElementById("sumROI").textContent =
            "$" + summary.dailyROI.toFixed(2);

        document.getElementById("sumDirect").textContent =
            "$" + summary.sponsorBonus.toFixed(2);

        document.getElementById("sumGen").textContent =
            "$" + summary.genBonus.toFixed(2);

        document.getElementById("sumRank").textContent =
            "$" + summary.rankBonus.toFixed(2);

        document.getElementById("sumGlobal").textContent =
            "$" + summary.globalBonus.toFixed(2);

        document.getElementById("sumTotal").textContent =
            "$" + summary.totalEarning.toFixed(2);

        document.getElementById("sumBalance").textContent =
            "$" + summary.currentBalance.toFixed(2);
    }

})();