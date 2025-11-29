/********************
 * BTX.ONE – Income Engine (Demo)
 * সব কম্পেনসেশন হিসাব এখানে হবে
 * localStorage key: btx_users_v1
 ********************/

const IE_STORAGE_USERS = "btx_users_v1";

// 🔹 প্ল্যান কনফিগ – তোমার দেয়া ডাটা
const IE_PLAN = {
  roiPercentPerDay: 1.2,      // প্রতিদিন ROI % (ডেমো, চাইলে বদলাবে)
  sponsorPercent: 5,          // direct sponsor 5%

  // 20 level generation – তোমার টেবিল
  // level: 1..20
  // percent = কত %, reqDirect = মোট কত direct sponsor থাকলে এই লেভেল আনলক
  genLevels: [
    { level: 1,  percent: 20, reqDirect: 0  }, // 1★20%  SP No
    { level: 2,  percent: 10, reqDirect: 3  }, // 2★10%  3 sponsor
    { level: 3,  percent: 5,  reqDirect: 5  }, // 3★5%   +2 = 5
    { level: 4,  percent: 4,  reqDirect: 6  }, // 4★4%   +1
    { level: 5,  percent: 3,  reqDirect: 7  }, // 5★3%   +1
    { level: 6,  percent: 2,  reqDirect: 8  }, // 6★2%   +1
    { level: 7,  percent: 5,  reqDirect: 9  }, // 7★5%   +1
    { level: 8,  percent: 4,  reqDirect: 10 }, // 8★4%   +1

    // 9–14 পর্যন্ত মোট +3 sponsor (টোটাল 13)
    { level: 9,  percent: 3,  reqDirect: 11 },
    { level: 10, percent: 2,  reqDirect: 11 },
    { level: 11, percent: 1,  reqDirect: 12 },
    { level: 12, percent: 2,  reqDirect: 12 },
    { level: 13, percent: 2,  reqDirect: 13 },
    { level: 14, percent: 2,  reqDirect: 13 },

    // 15–20 পর্যন্ত আবার +3 sponsor (টোটাল 16)
    { level: 15, percent: 2,  reqDirect: 14 },
    { level: 16, percent: 2,  reqDirect: 14 },
    { level: 17, percent: 2,  reqDirect: 15 },
    { level: 18, percent: 3,  reqDirect: 15 },
    { level: 19, percent: 3,  reqDirect: 16 },
    { level: 20, percent: 3,  reqDirect: 16 }
  ],

  // Global sale bonus – 5% total, ভাগ করে দিচ্ছি
  globalMidPercent: 2,        // 500–999
  globalHighPercent: 3,       // 1000+
  midMin: 500,
  midMax: 999,
  highMin: 1000,

  // Gift voucher কমিশন
  giftVoucherPercent: 1,      // নিজের উপর অতিরিক্ত 1%

  // Affiliate max – 3X working (future use)
  maxMultiple: 3              // মোট income <= depositTotal * 3
};

// ---------- Helper functions ----------

function ieLoadUsers() {
  const raw = localStorage.getItem(IE_STORAGE_USERS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function ieSaveUsers(users) {
  localStorage.setItem(IE_STORAGE_USERS, JSON.stringify(users));
}

function ieFindUser(username, users) {
  const uname = (username || "").toLowerCase();
  return users.find(u => (u.username || "").toLowerCase() === uname);
}

// user এর income fields safe করে নেই
function ieEnsureIncomeFields(u) {
  if (!u) return;
  u.packageAmount     = u.packageAmount     || 0;
  u.depositTotal      = u.depositTotal      || 0;
  u.balance           = u.balance           || 0;

  u.directIncome      = u.directIncome      || 0;
  u.generationIncome  = u.generationIncome  || 0;
  u.rankIncome        = u.rankIncome        || 0;
  u.globalIncome      = u.globalIncome      || 0;
  u.giftIncome        = u.giftIncome        || 0;

  u.roiPerDay         = u.roiPerDay         || 0;
  u.roiEarned         = u.roiEarned         || 0;

  // direct sponsor count (আগে teamCount ব্যবহার করলে তাও ধরে নেবে)
  u.directCount       = u.directCount       || u.teamCount || 0;
}

// মোট income (affilate 3X limit যাচাইয়ের জন্য)
function ieTotalIncome(u) {
  ieEnsureIncomeFields(u);
  return (
    (u.directIncome || 0) +
    (u.generationIncome || 0) +
    (u.rankIncome || 0) +
    (u.globalIncome || 0) +
    (u.giftIncome || 0) +
    (u.roiEarned || 0)
  );
}

// ---------- Main: Package activation ----------

/**
 * কোন member যখন ডিপোজিট / package নেবে,
 * UI থেকে এই function call করবে:
 *   ieActivatePackage("username", 200);
 */
function ieActivatePackage(username, amount) {
  amount = Number(amount || 0);
  if (!username || amount <= 0) {
    alert("Package activate করতে username এবং amount দরকার।");
    return;
  }

  const users = ieLoadUsers();
  const member = ieFindUser(username, users);
  if (!member) {
    alert("Member পাওয়া যায়নি: " + username);
    return;
  }

  ieEnsureIncomeFields(member);

  // 👉 deposit + package আপডেট
  member.depositTotal  += amount;
  member.packageAmount += amount;

  // ROI per day update (ডেমো)
  member.roiPerDay = member.packageAmount * IE_PLAN.roiPercentPerDay / 100;

  // ---------- Sponsor Bonus 5% ----------
  if (member.sponsor_username) {
    const sp = ieFindUser(member.sponsor_username, users);
    if (sp) {
      ieEnsureIncomeFields(sp);
      const spInc = amount * IE_PLAN.sponsorPercent / 100;
      sp.directIncome += spInc;
      sp.balance      += spInc;
    }
  }

  // ---------- Generation Bonus (20 level) ----------
  let uplineName = member.sponsor_username || "";
  for (let i = 0; i < IE_PLAN.genLevels.length; i++) {
    if (!uplineName) break;

    const levelConf = IE_PLAN.genLevels[i];
    const up = ieFindUser(uplineName, users);
    if (!up) break;

    ieEnsureIncomeFields(up);

    const directCount = up.directCount || 0;

    // এই লেভেলের জন্য minimum sponsor আছে কি না
    if (directCount >= levelConf.reqDirect) {
      const genInc = amount * levelConf.percent / 100;
      up.generationIncome += genInc;
      up.balance          += genInc;
    }

    // পরের লেভেল – আরেক ধাপ উপরের sponsor
    uplineName = up.sponsor_username || "";
  }

  // ---------- Gift Voucher (1%) ----------
  const giftInc = amount * IE_PLAN.giftVoucherPercent / 100;
  member.giftIncome += giftInc;
  member.balance    += giftInc;

  // ---------- Global Sale Bonus ----------
  // 2% – 500–999, 3% – 1000+
  const midPool  = amount * IE_PLAN.globalMidPercent  / 100;
  const highPool = amount * IE_PLAN.globalHighPercent / 100;

  const activeUsers = users.filter(u => {
    ieEnsureIncomeFields(u);
    return (u.packageAmount || 0) > 0;
  });

  const midGroup = activeUsers.filter(u =>
    u.packageAmount >= IE_PLAN.midMin &&
    u.packageAmount <= IE_PLAN.midMax
  );
  const highGroup = activeUsers.filter(u =>
    u.packageAmount >= IE_PLAN.highMin
  );

  if (midGroup.length > 0 && midPool > 0) {
    const share = midPool / midGroup.length;
    midGroup.forEach(u => {
      u.globalIncome += share;
      u.balance      += share;
    });
  }

  if (highGroup.length > 0 && highPool > 0) {
    const share = highPool / highGroup.length;
    highGroup.forEach(u => {
      u.globalIncome += share;
      u.balance      += share;
    });
  }

  // ---------- Affiliate 3X limit (future – শুধু warn করছি) ----------
  const totalAfter = ieTotalIncome(member);
  const maxAllowed = member.depositTotal * IE_PLAN.maxMultiple;
  if (totalAfter > maxAllowed) {
    // চাইলে এখানে income বন্ধ করার system দিতে পারো
    console.warn(
      "⚠ "+member.username+" 3X working limit cross করেছে (demo):",
      totalAfter.toFixed(2), ">", maxAllowed.toFixed(2)
    );
  }

  ieSaveUsers(users);
  alert("✅ Demo package activate complete\nUser: " + username +
        "\nAmount: " + amount + " USDT");
}

// ---------- Daily ROI demo ----------

/**
 * runDailyRoiDemo()
 * – একবার কল করলে সকল active package এর জন্য ১ দিনের ROI যোগ করবে
 */
function runDailyRoiDemo() {
  const users = ieLoadUsers();
  users.forEach(u => {
    ieEnsureIncomeFields(u);
    if (u.roiPerDay > 0) {
      u.roiEarned += u.roiPerDay;
      u.balance   += u.roiPerDay;
    }
  });
  ieSaveUsers(users);
  alert("📅 ১ দিনের ROI demo হিসেবে add করা হয়েছে।");
}

// ---------- Dashboard summary helper ----------

/**
 * getIncomeSummary(username)
 * – Dashboard এ দেখানোর জন্য সব টোটাল রেডি করে দেয়
 */
function getIncomeSummary(username) {
  const users = ieLoadUsers();
  const u = ieFindUser(username, users);
  if (!u) return null;
  ieEnsureIncomeFields(u);

  const total =
    (u.directIncome || 0) +
    (u.generationIncome || 0) +
    (u.rankIncome || 0) +
    (u.globalIncome || 0) +
    (u.giftIncome || 0) +
    (u.roiEarned || 0);

  return {
    selfInvestment: u.packageAmount || 0,
    dailyROI:       u.roiPerDay || 0,
    sponsorBonus:   u.directIncome || 0,
    genBonus:       u.generationIncome || 0,
    rankBonus:      u.rankIncome || 0,
    globalBonus:    u.globalIncome || 0,
    giftVoucher:    u.giftIncome || 0,
    totalEarning:   total,
    currentBalance: u.balance || 0
  };
}